# AI CV Builder

A signed-in user uploads a CV as a PDF (or describes their background in free text), names a target role and gets a CV draft: contacts, summary, experience, education, skills. Generation runs in the background, the AI asks about anything missing or vague, and the answers update the CV. The user can edit every field by hand and download an A4 PDF with selectable text. CVs are stored per user, so they are available from any device. The UI is responsive and usable on a phone.

## Run

```sh
ANTHROPIC_API_KEY=sk-ant-... docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3777 (Swagger: `/docs`)

`ANTHROPIC_API_KEY` is the only secret. Ports, Postgres credentials and URLs are fixed in `docker-compose.yml`. Migrations are applied automatically on API start.

## Tests

Run from `api/` (`npm install` first):

| Command | What it runs | Needs |
| --- | --- | --- |
| `npm run test:unit` | jest: domain logic, use cases, prompts. Fakes are used instead of mocks. | nothing |
| `npm run test:integration` | vitest + Testcontainers: CV and its job are saved atomically (or not at all), optimistic locking, real Puppeteer PDF export (A4, selectable text) | Docker |
| `npm run test:eval` | evalite: the LLM steps against real Claude (extract facts, generate questions, apply answers, compose CV, validate result), pass threshold 85% | `ANTHROPIC_API_KEY` in `api/.env.development` |
| `npm run test:all` | all of the above, stops at the first failure | all of the above |

I focused tests on what is hardest to get right: the anti-hallucination logic, ownership of CVs, consistency between the database and the queue, and LLM quality (evals). Deliberately **not** covered: UI tests, HTTP-level end-to-end tests, and the worker retry path.

## Architecture

Monorepo:

- `api/`: NestJS 11, MikroORM 7, PostgreSQL 17.
- `ui/`: React 19 + Vite, TanStack Query, react-hook-form + zod, Tailwind + Radix.
- `packages/cv-template`: one HTML renderer of a CV, shared by the UI preview and the backend PDF export, so the preview and the PDF always match.

The API is split into modules (`user`, `auth`, `cv`, `shared`), each layered as hexagonal / DDD: `domain` (entities, repository interfaces, pure functions) → `application` (one use case per action, DTOs, ports) → `infrastructure` (MikroORM schemas, queue workers, Puppeteer, file storage) → `interfaces` (controllers, adapters). Domain entities are plain classes without ORM decorators. Modules talk through ports and adapters, and boundaries return `Result<T>` instead of throwing (see below).

### Generation pipeline

A CV is a state machine (`status` + `currentStep`). Every step is a job in a queue ([pg-boss](https://github.com/timgit/pg-boss), running on the same Postgres):

```
parse_pdf → extract_facts → verify_evidence → generate_questions
   → answer_questions (waits for the user) → apply_answers → verify_evidence → generate_questions … (up to 2 rounds, ≤ 5 questions each)
   → compose_cv → validate_result → completed
```

- `POST /cvs` answers `202` immediately. The UI polls `GET /cvs/:id` every second and shows the current step. All progress lives in the database, so a reload or another device sees the same state.
- A CV and the job for its next step are saved in one transaction.
- Haiku does the mechanical steps (extract facts, apply answers). Sonnet does the steps that need judgement (questions, compose, validate).

### The `Result<T>` pattern: use cases decide, services report

Domain entities, ports, adapters and infrastructure services (LLM, queue, file storage, PDF renderer, PDF text) do not throw business exceptions and do not decide what a failure means. They return `Result<T>` (`{ success, message?, dto? }`, built with `ResultBuilder`) and the **use case** decides what to do with it.

The same failure is handled differently depending on who is asking:

- `jobs.enqueueStep` fails when a user creates a CV (`InitCvUseCase`): the use case rolls back the transaction, deletes the uploaded file and answers `503`.
- The same call fails inside a queue worker (`ComposeCvUseCase`): the use case throws a plain `Error`, so pg-boss retries the step.
- `llm.generateObject` fails: the use case turns it into a retry. `pdfText.extractText` fails: the use case marks the CV `failed` with a message for the user, because retrying a scanned PDF is pointless.
- `files.delete` fails after the CV is already failed: the use case only logs a warning and moves on.

This keeps the business behavior in one readable place, the use case, instead of spread over services, where each one would need to know its callers (HTTP request, background job, retry or last attempt). Services stay reusable and dumb: an adapter does not know about HTTP status codes or retries.

Other benefits:

- **Failure is part of the type.** A `Result` cannot be ignored by accident the way a forgotten `try/catch` can, and an infrastructure error (LLM timeout, full disk) does not leak out as a raw exception with provider details. Messages in a `Result` are written for the caller, not copied from the SDK.
- **Domain rules are testable without exceptions.** Entity methods such as `cv.finishStep()` or `cv.editDocument()` return a failed `Result` for a forbidden transition (CV not completed, stale `version`), and unit tests assert on it directly. Fakes can simulate failure by returning `{ success: false }`.
- **Exceptions are kept for the HTTP edge.** Only use cases map a failed `Result` to Nest exceptions (`404`, `409`, `503`), so the API's error contract lives in one layer.

Cost: a few lines of `if (!result.success) …` after every call, and the discipline to never throw from an adapter. It is more verbose than exceptions, and I accepted that so that the control flow of each action can be read top to bottom in its use case.

### Shared `cv-template` package

`packages/cv-template` is a small standalone TypeScript package with two things: the `CvDocument` types and `renderCvHtml(document)`, a pure function that turns a CV into one self-contained HTML page (inline CSS, `@page { size: A4 }`).

- **One renderer, two consumers.** The UI shows the preview with it (`cv-preview.tsx`), and the API feeds the same HTML to Puppeteer to produce the PDF. The preview and the downloaded PDF cannot drift apart, and there is one template to change.
- **One contract.** The UI and the API import the same `CvDocument` type, so a change to the CV shape breaks both builds at compile time instead of failing at runtime. The domain stays free of rendering: it only knows the data, the template only knows how to draw it.
- **Safe by construction.** The renderer is a pure function without I/O, and every value is HTML-escaped. This matters because the content comes from an LLM and from the user. The PDF page also runs with JavaScript disabled.
- **Why a package, not copy-paste or an API call.** Copying the template would drift. Rendering the preview on the server would add a request on every keystroke in the editor. A package keeps the preview instant and the PDF identical.
- **Cost:** it is a third build unit. Both Dockerfiles use the repo root as build context and build the package first (`prebuild` in `api/`). This is the reason `docker compose` builds from the root. If the project grew, it would move to npm workspaces.

### Auth and access control

Passwords are hashed with scrypt. The session id is in an httpOnly `sid` cookie. Every CV query goes through `findByIdForUser`, and another user's CV answers `404`, the same as a missing one, so ids cannot be probed.

### Why a workflow, not an agent

The task is well defined: the steps and their order are known in advance, so I used a fixed workflow with code between the LLM calls instead of an agent that chooses its own tools and iterations.

- **Guarantees live in code.** Quote checks, field filters, document assembly and the judge are hard gates the model cannot skip. In an agent loop "do not invent facts" would depend only on the model behaving.
- **Predictable cost and latency.** The number of calls is bounded (limited question rounds and regenerations). An agent loop is not.
- **Recoverable.** Each step is its own job with retries and saved state, so a failure resumes from that step. A failed agent trajectory has to restart.
- **Human in the loop.** Asking the user is just a pause in the state machine. It can last days and needs no live agent context.
- **Testable and cheap.** Each step has its own eval and its own model (Haiku where it is enough).
- **Cost of the choice:** less adaptive to unusual input, and more prompts to maintain. An agent would make sense for open-ended tasks (for example tailoring to a job description with research), which are out of scope.

## How the AI is kept from inventing facts

1. **Facts with evidence.** The first LLM step extracts atomic facts (`company`, `title`, `achievement`, …), each with a verbatim `quote` from the input. Code (`verify-facts.ts`) drops any fact whose quote is not found in the source or does not contain its value. Only dates are normalized (`YYYY-MM`).
2. **Questions instead of guesses.** Gaps become questions on an allowed list of fields (`askable-targets.ts`). An answer is turned into facts by the same quote check, and only facts for the field the question asked about are kept. A vague answer ("I don't remember") yields no fact.
3. **The model does not write the CV freely.** Compose returns only a summary, the order of jobs and skills, and bullets with `sourceIds` pointing at facts. Code (`build-document.ts`) assembles the document, so names, companies, dates and contacts come straight from facts and are never retyped by the model.
4. **An independent judge.** A separate LLM step checks the summary and every bullet against the facts. Rejected parts trigger regeneration with the judge's feedback (up to 2 times). After that a rejected bullet is replaced with the raw fact it came from, or dropped (`review-document.ts`).
5. **Untrusted input.** All user text (CV, role, answers) is escaped and wrapped in `<untrusted_input>` blocks, and every prompt tells the model to treat them as data. Output of every LLM call is validated with a zod schema and then by domain checks.
6. **Evals prove it.** They include a planted prompt injection (asking for a PhD / MIT / Nobel), a vague answer that must produce no fact, and an answer with an extra claim that must be ignored.

Manual edits are not checked against facts: the text then belongs to the user.

## Technical decisions

What I chose and the trade-off I accepted with it. (The workflow-vs-agent decision and `Result<T>` are described in Architecture.)

| Decision | Why | Trade-off accepted |
| --- | --- | --- |
| **pg-boss on the same Postgres, no separate broker** | A CV and its job are written in one transaction, so there is never a CV without a job or a job without a CV. One piece of infrastructure less. | The queue adds load on the same database. |
| **Step-by-step jobs, not one big LLM call** | Each step has its own retry, model and saved progress. A failure never loses earlier work. | More LLM calls and more total latency. |
| **Polling, not SSE / WebSocket** | The UI only needs a coarse status: which step the CV is on, and when it needs answers or is done. A step takes seconds, so a 1 s poll feels live, and nothing needs to be pushed instantly. Polling is stateless, works behind any proxy, and after a reload or on another device it simply reads the current state from the database. SSE or WebSocket would need long-lived connections and, with several API instances, a pub/sub layer to tell the right instance about a finished step. That is a lot of machinery for a few updates per CV. Polling also stops by itself when the CV waits for answers or is finished (`use-cv.ts`). | Extra requests while a CV is processing (cheap thanks to the in-memory sessions). SSE would not give users anything visible, so it is not planned. |
| **PDF text extracted by code (`unpdf`)** | Cheap and deterministic. A scanned PDF without a text layer gets a clear error ("paste the text instead"). | No OCR. |
| **Haiku / Sonnet per step** | Price and speed where the task is mechanical, quality where judgement is needed. Checked with evals. | Model choice is hard-coded per step (`cv-pipeline.constants.ts`). |
| **PDF rendered on the fly, generated PDFs are not stored** | The PDF is built from the saved CV data on every download. Users rarely come back just to download the same CV again, so a separate storage (and its cleanup) is not worth it. The CV data in the database is the single source of truth, so a PDF can never be stale after an edit. | Each download costs one Chromium render (a second or so). |
| **Shared `cv-template` package** | The preview and the PDF are identical, one shared type contract (see above). | A third build unit, and Chromium (Puppeteer) in the API image. |

## Trade-offs and possible improvements

Where the current implementation is simplified on purpose, and what I would do for production.

| Today | Limitation | Improvement |
| --- | --- | --- |
| **Sessions in memory** (`InMemorySessionRepository`) | Chosen because the UI polls every second and every poll passes `AuthGuard`: with sessions in Postgres each poll would be another query, and under load many pollers would exhaust the connection pool. The price: a restart logs everyone out, sessions have no TTL, and only one API instance works. | Redis with persistence (AOF), so sessions survive a restart, plus a TTL. |
| **Queue on Postgres** (pg-boss) | Shares the database with the data and can become a throughput bottleneck. | Move to a dedicated broker (RabbitMQ, SQS, Kafka). This loses the single transaction: the CV and the message would live in two systems, so a crash between "saved" and "published" leaves a CV that never moves. It requires a full transactional outbox: write the message to an `outbox` table in the same transaction as the CV, and let a relay publish it with at-least-once delivery, retries and cleanup. Workers must be idempotent (they already skip steps that are not current). The queue is behind `QueueService` / `CvJobsPort`, so the swap is local, but the outbox is real work, not a config change. |
| **PDF parsing in code** | No OCR; scanned PDFs are rejected. | Parsing is already its own job (`parse_pdf`) with retries behind `PdfTextPort`, so LLM-based parsing (Claude PDF input) can be plugged in by swapping the implementation, without touching the pipeline. |
| **PDF rendered on every download** | One Chromium render per download. | If downloads become frequent, cache the PDF keyed by CV `version`. |
| **Uploaded PDFs on a local Docker volume** | Fine for a local run. The file is deleted right after parsing, or when generation fails, but it is not shared between API instances. | S3 (or similar) with a lifecycle rule. |
| **No rate limiting** | Every generation costs LLM money, and auth can be brute-forced. | `@nestjs/throttler`, a per-user generation quota, a cap on the number of CVs per user. |
| **Tests** | No UI or HTTP end-to-end tests, no tests of the worker retry path. Eval datasets are small (3–4 cases per step): enough to catch regressions, not to measure quality. | Playwright with a fake LLM (the best proof of the whole flow), worker retry tests, bigger datasets. |
| **Observability** | Only logs with token counts and step timings. | Metrics and per-CV LLM cost. |
| **Manual edits are not checked against facts** | The text then belongs to the user. | Optional warning when an edit adds numbers or employers that are not in the facts. |
| **One CV template** | Templates are out of scope. | A template choice in `cv-template`. |

## Reliability and failure handling

- **DB and queue stay consistent.** Saving a CV and enqueuing its next job is one transaction. If the job cannot be queued the API answers `503` and nothing is created or changed (covered by integration tests).
- **Retries.** Each step is retried 2 more times with exponential backoff (from 30 s). After the last attempt the CV becomes `failed`, the user sees the step it failed at, and the uploaded file is deleted. Nobody waits forever.
- **Idempotent, ordered jobs.** `singletonKey = cvId` allows one job per CV at a time. A worker skips a job when the CV has already moved on, and fails (so it is retried) when the job arrives before its step.
- **Concurrent changes.** Optimistic locking through `version`. An edit based on an old version gets `409`.
- **LLM output is untrusted.** An invalid response fails the schema, the step fails and is retried. A valid but unsupported claim is caught by the quote checks and the judge. LLM calls return a `Result` and never throw past the service.
- **PDF rendering.** JavaScript is disabled in the page, there is a 15 s timeout, and the browser is relaunched if it dies.
- **Input at the edge.** Global `ValidationPipe` (whitelist, `forbidNonWhitelisted`), UUID checks, uploaded files are checked by MIME type and `%PDF-` magic bytes, helmet and a strict CORS origin.

## Limits

| What | Limit |
| --- | --- |
| Input text | 20 000 characters |
| Target role | 120 characters |
| PDF | 10 MB, one file, must have a text layer |
| Question rounds | 2, at most 5 questions per round |
| Answer | 2 000 characters |
| Compose regenerations after the judge rejects | 2 |
| Step attempts | 3 (1 + 2 retries) |
| Manual edit | field 200, bullet 400, summary 2 000 characters, lists up to 50 items |
| Pagination | `limit` ≤ 100 (default 20) |
| PDF render | 15 s timeout |

Deliberately missing: rate limiting, session TTL and a cap on the number of CVs per user (see Trade-offs and possible improvements).

## How I used AI tools

- **Claude Code wrote the code, in small steps.** I asked for one module or one step at a time, then read the diff, edited it or threw it away. Rules and conventions (architecture, naming, "build only what is asked now", "no commits without permission") are written in `CLAUDE.md`, so the agent follows them in every session.
- **Claude Code helped write and analyze the tests.** It wrote the unit, integration and eval code, and it reviewed the whole test suite against the task description. The review found gaps (no real PDF export test, no evals for questions and answers) and I closed the ones that mattered most. I decided which gaps to leave open (see Tests).
- **I own the design decisions:** workflow instead of an agent, facts with evidence instead of free-text generation, sessions in memory, pg-boss on Postgres. The trade-offs above are mine, not the tool's.
