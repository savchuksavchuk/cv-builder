import type { CvDocument, EndDate, YearMonth } from './types.js'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c])

const clean = (value: string | null | undefined) => value?.trim() || null

const join = (parts: (string | null)[], separator: string) =>
  parts.filter((p): p is string => !!p).join(separator)

const period = (start: YearMonth | null, end: EndDate | null) =>
  join([start, end], ' – ')

const section = (title: string, body: string) =>
  body ? `<section><h2>${title}</h2>${body}</section>` : ''

const STYLES = `
@page { size: A4; margin: 15mm; }
* { box-sizing: border-box; }
@media screen { body { padding: 15mm; } }
body { margin: 0; font: 10.5pt/1.45 Helvetica, Arial, sans-serif; color: #111; }
h1 { margin: 0; font-size: 22pt; }
h2 { margin: 16px 0 6px; padding-bottom: 2px; border-bottom: 1px solid #999; font-size: 11pt; text-transform: uppercase; letter-spacing: .05em; }
p, ul { margin: 0; }
ul { padding-left: 18px; }
.muted { color: #555; }
.row { display: flex; justify-content: space-between; gap: 12px; }
.item { margin-bottom: 8px; }
.keep { break-inside: avoid; }
h2, .row { break-after: avoid; }
li, .row { break-inside: avoid; }
p, li { orphans: 2; widows: 2; }
.item strong { font-weight: 600; }
`

const renderHeader = ({ header }: CvDocument) => {
  const contacts = join(
    [header.email, header.phone, header.location, ...header.links].map((v) =>
      v ? esc(v.trim()) : null,
    ),
    ' · ',
  )
  const name = clean(header.fullName)
  return `<header>${name ? `<h1>${esc(name)}</h1>` : ''}${
    contacts ? `<p class="muted">${contacts}</p>` : ''
  }</header>`
}

const renderExperience = ({ experience }: CvDocument) =>
  experience
    .map((e) => {
      const heading = join([clean(e.title), clean(e.company)].map((v) => (v ? esc(v) : null)), ', ')
      const dates = period(e.startDate, e.endDate)
      const location = clean(e.location)
      const bullets = e.bullets
        .map((b) => clean(b.text))
        .filter((t): t is string => !!t)
        .map((t) => `<li>${esc(t)}</li>`)
        .join('')
      if (!heading && !bullets) {
        return ''
      }
      return `<div class="item"><div class="row"><strong>${heading}</strong><span class="muted">${esc(dates)}</span></div>${
        location ? `<p class="muted">${esc(location)}</p>` : ''
      }${bullets ? `<ul>${bullets}</ul>` : ''}</div>`
    })
    .join('')

const renderEducation = ({ education }: CvDocument) =>
  education
    .map((e) => {
      const heading = join(
        [clean(e.degree), clean(e.fieldOfStudy), clean(e.institution)].map((v) => (v ? esc(v) : null)),
        ', ',
      )
      return heading
        ? `<div class="item keep"><div class="row"><strong>${heading}</strong><span class="muted">${esc(
            period(e.startDate, e.endDate),
          )}</span></div></div>`
        : ''
    })
    .join('')

const renderCertifications = ({ certifications }: CvDocument) =>
  certifications
    .map((c) => {
      const name = clean(c.name)
      if (!name) {
        return ''
      }
      const issuer = clean(c.issuer)
      return `<div class="item keep"><div class="row"><strong>${esc(name)}${
        issuer ? `, ${esc(issuer)}` : ''
      }</strong><span class="muted">${esc(c.issueDate ?? '')}</span></div></div>`
    })
    .join('')

export const renderCvHtml = (doc: CvDocument): string => {
  const summary = clean(doc.summary)
  const skills = doc.skills.map(clean).filter((s): s is string => !!s)

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${STYLES}</style></head><body>${renderHeader(
    doc,
  )}${section('Summary', summary ? `<p>${esc(summary)}</p>` : '')}${section(
    'Skills',
    skills.length ? `<p>${skills.map(esc).join(', ')}</p>` : '',
  )}${section('Experience', renderExperience(doc))}${section(
    'Education',
    renderEducation(doc),
  )}${section('Certifications', renderCertifications(doc))}</body></html>`
}
