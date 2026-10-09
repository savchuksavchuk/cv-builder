import {
  MAX_COMPOSE_REGENERATIONS,
  MAX_INPUT_CHARS,
  MAX_QUESTION_ROUNDS,
} from '../constants/cv-limits.constants';
import { NEXT_STEP } from '../constants/cv-pipeline.constants';
import { CvDocument } from '../types/cv-document';
import { CvStatus } from '../types/cv-status';
import { CvStep } from '../types/cv-step';
import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../types/fact';
import { Question, QuestionDraft, QuestionStatus } from '../types/question';
import { Cv } from './cv.entity';

const draftDocument = { summary: 'draft' } as CvDocument;
const safeDocument = { summary: 'safe' } as CvDocument;

const emailQuestionDraft: QuestionDraft = {
  target: {
    section: FactSection.Contacts,
    entryId: 'contacts',
    field: FactField.Email,
  },
  question: 'What is your email?',
};

const allSteps = Object.values(CvStep);
const notProcessing = [CvStatus.Initial, CvStatus.Completed, CvStatus.Failed];

function openQuestion(id: string): Question {
  return {
    id,
    target: emailQuestionDraft.target,
    question: emailQuestionDraft.question,
    status: QuestionStatus.Open,
    answer: null,
    createdAt: '',
    updatedAt: '',
  };
}

function companyFact(value: string, source: string): Fact {
  return {
    id: `${source}-${value}`,
    section: FactSection.WorkExperience,
    entryId: 'job-1',
    field: FactField.Company,
    value,
    evidence: { source, quote: value },
  };
}

// A CV with an uploaded PDF, currently at the given step.
function cvAtStep(step: CvStep | null, status = CvStatus.Processing): Cv {
  const cv = Cv.create(
    'user-1',
    'Backend Engineer',
    'my background',
    'file-key',
  );
  cv.status = status;
  cv.currentStep = step;
  cv.document = draftDocument;
  return cv;
}

describe('Cv', () => {
  describe('pipeline order', () => {
    it('goes from creation to completion step by step, with one question round', () => {
      const cv = Cv.create('user-1', 'Backend Engineer', 'my background', null);

      expect(cv.setProcessingState().success).toBe(true);
      expect(cv.setExtractingFactsStep().success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ExtractFacts);

      expect(cv.applyExtractedFacts([]).success).toBe(true);
      expect(cv.finishStep(CvStep.ExtractFacts).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.VerifyEvidence);

      expect(cv.verifyEvidence().success).toBe(true);
      expect(cv.finishStep(CvStep.VerifyEvidence).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.GenerateQuestions);

      expect(cv.askQuestions([emailQuestionDraft]).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.AnswerQuestions);

      const questionId = cv.questions[0].id;
      const answers = [{ questionId, answer: 'a@b.c' }];
      expect(cv.submitAnswers(answers).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ApplyAnswers);

      expect(cv.applyAnswers([]).success).toBe(true);
      expect(cv.finishStep(CvStep.ApplyAnswers).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.VerifyEvidence);

      // Answers are verified like the original input, then questions are asked again.
      expect(cv.verifyEvidence().success).toBe(true);
      expect(cv.finishStep(CvStep.VerifyEvidence).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.GenerateQuestions);

      expect(cv.askQuestions([]).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ComposeCv);

      expect(cv.applyComposition(draftDocument).success).toBe(true);
      expect(cv.finishStep(CvStep.ComposeCv).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ValidateResult);

      const review = { feedback: [], safeDocument };
      expect(cv.applyReview(review).success).toBe(true);
      expect(cv.currentStep).toBeNull();
      expect(cv.status).toBe(CvStatus.Completed);
      expect(cv.questions[0].status).toBe(QuestionStatus.Applied);
    });

    it('parses the PDF before extracting facts when a file was uploaded', () => {
      const cv = Cv.create('user-1', 'Backend Engineer', '', 'file-key');

      expect(cv.setProcessingState().success).toBe(true);
      expect(cv.setExtractingFileStep().success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ParsePdf);

      expect(cv.applyPdfText('text from the pdf').success).toBe(true);
      expect(cv.sourceFileKey).toBeNull();

      expect(cv.finishStep(CvStep.ParsePdf).success).toBe(true);
      expect(cv.currentStep).toBe(CvStep.ExtractFacts);
    });
  });

  describe('setProcessingState', () => {
    it('starts processing an initial CV', () => {
      const cv = cvAtStep(null, CvStatus.Initial);

      expect(cv.setProcessingState().success).toBe(true);
      expect(cv.status).toBe(CvStatus.Processing);
    });

    it('is rejected when the CV is already processing, completed or failed', () => {
      for (const status of [
        CvStatus.Processing,
        CvStatus.Completed,
        CvStatus.Failed,
      ]) {
        const cv = cvAtStep(null, status);

        expect(cv.setProcessingState().success).toBe(false);
        expect(cv.status).toBe(status);
      }
    });
  });

  describe('setExtractingFileStep', () => {
    it('works only before any step has started', () => {
      expect(cvAtStep(null).setExtractingFileStep().success).toBe(true);

      for (const step of allSteps) {
        expect(cvAtStep(step).setExtractingFileStep().success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        expect(cvAtStep(null, status).setExtractingFileStep().success).toBe(
          false,
        );
      }
    });
  });

  describe('setExtractingFactsStep', () => {
    it('works only before any step has started', () => {
      expect(cvAtStep(null).setExtractingFactsStep().success).toBe(true);

      for (const step of allSteps) {
        expect(cvAtStep(step).setExtractingFactsStep().success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        expect(cvAtStep(null, status).setExtractingFactsStep().success).toBe(
          false,
        );
      }
    });
  });

  describe('applyPdfText', () => {
    it('works only at the parse_pdf step', () => {
      expect(cvAtStep(CvStep.ParsePdf).applyPdfText('text').success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.ParsePdf)) {
        expect(cvAtStep(step).applyPdfText('text').success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ParsePdf, status);

        expect(cv.applyPdfText('text').success).toBe(false);
      }
    });

    it('rejects text over the input limit and keeps the uploaded file', () => {
      const cv = cvAtStep(CvStep.ParsePdf);

      expect(cv.applyPdfText('x'.repeat(MAX_INPUT_CHARS + 1)).success).toBe(
        false,
      );
      expect(cv.sourceFileKey).toBe('file-key');
    });
  });

  describe('applyExtractedFacts', () => {
    it('works only at the extract_facts step', () => {
      const cv = cvAtStep(CvStep.ExtractFacts);
      expect(cv.applyExtractedFacts([]).success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.ExtractFacts)) {
        expect(cvAtStep(step).applyExtractedFacts([]).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ExtractFacts, status);

        expect(cv.applyExtractedFacts([]).success).toBe(false);
      }
    });
  });

  describe('verifyEvidence', () => {
    it('works only at the verify_evidence step', () => {
      expect(cvAtStep(CvStep.VerifyEvidence).verifyEvidence().success).toBe(
        true,
      );

      for (const step of allSteps.filter((s) => s !== CvStep.VerifyEvidence)) {
        expect(cvAtStep(step).verifyEvidence().success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.VerifyEvidence, status);

        expect(cv.verifyEvidence().success).toBe(false);
      }
    });

    describe('facts', () => {
      function cvWithInputAndAnswers(): Cv {
        const cv = cvAtStep(CvStep.VerifyEvidence);
        cv.initialUserInput = 'I worked at Acme.';
        cv.questions = [
          {
            ...openQuestion('q1'),
            status: QuestionStatus.Answered,
            answer: 'Then I joined Globex.',
          },
          { ...openQuestion('q2'), status: QuestionStatus.Dismissed },
        ];
        return cv;
      }

      it('keeps a fact quoted from the initial input and drops an invented one', () => {
        const cv = cvWithInputAndAnswers();
        const supported = companyFact('Acme', INITIAL_USER_INPUT_SOURCE);
        const invented = companyFact('Initech', INITIAL_USER_INPUT_SOURCE);
        cv.facts = [supported, invented];

        cv.verifyEvidence();

        expect(cv.facts).toEqual([supported]);
      });

      it('keeps a fact quoted from the answer it cites', () => {
        const cv = cvWithInputAndAnswers();
        const fromAnswer = companyFact('Globex', 'q1');
        cv.facts = [fromAnswer];

        cv.verifyEvidence();

        expect(cv.facts).toEqual([fromAnswer]);
      });

      it('drops a fact that cites an answer but quotes the initial input', () => {
        const cv = cvWithInputAndAnswers();
        cv.facts = [companyFact('Acme', 'q1')];

        cv.verifyEvidence();

        expect(cv.facts).toEqual([]);
      });

      it('drops a fact that cites a dismissed question', () => {
        const cv = cvWithInputAndAnswers();
        cv.facts = [companyFact('Acme', 'q2')];

        cv.verifyEvidence();

        expect(cv.facts).toEqual([]);
      });

      it('drops a fact that cites an unknown source', () => {
        const cv = cvWithInputAndAnswers();
        cv.facts = [companyFact('Acme', 'unknown')];

        cv.verifyEvidence();

        expect(cv.facts).toEqual([]);
      });
    });
  });

  describe('askQuestions', () => {
    it('works only at the generate_questions step', () => {
      const cv = cvAtStep(CvStep.GenerateQuestions);
      expect(cv.askQuestions([emailQuestionDraft]).success).toBe(true);

      const otherSteps = allSteps.filter((s) => s !== CvStep.GenerateQuestions);
      for (const step of otherSteps) {
        const other = cvAtStep(step);

        expect(other.askQuestions([emailQuestionDraft]).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.GenerateQuestions, status);

        expect(cv.askQuestions([emailQuestionDraft]).success).toBe(false);
      }
    });

    it('opens the drafted questions and counts the round', () => {
      const cv = cvAtStep(CvStep.GenerateQuestions);

      cv.askQuestions([emailQuestionDraft]);

      expect(cv.currentStep).toBe(CvStep.AnswerQuestions);
      expect(cv.questionRounds).toBe(1);
      expect(cv.questions).toHaveLength(1);
      expect(cv.questions[0].status).toBe(QuestionStatus.Open);
    });

    it('goes to composition when there is nothing to ask', () => {
      const cv = cvAtStep(CvStep.GenerateQuestions);

      cv.askQuestions([]);

      expect(cv.currentStep).toBe(CvStep.ComposeCv);
    });

    it('goes to composition without asking once the question rounds are used up', () => {
      const cv = cvAtStep(CvStep.GenerateQuestions);
      cv.questionRounds = MAX_QUESTION_ROUNDS;

      cv.askQuestions([emailQuestionDraft]);

      expect(cv.currentStep).toBe(CvStep.ComposeCv);
      expect(cv.questions).toHaveLength(0);
    });
  });

  describe('submitAnswers', () => {
    function cvWithTwoOpenQuestions(): Cv {
      const cv = cvAtStep(CvStep.AnswerQuestions);
      cv.questions = [openQuestion('q1'), openQuestion('q2')];
      return cv;
    }

    it('works only at the answer_questions step', () => {
      const answers = [{ questionId: 'q1', answer: 'a' }];

      const cv = cvAtStep(CvStep.AnswerQuestions);
      cv.questions = [openQuestion('q1')];
      expect(cv.submitAnswers(answers).success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.AnswerQuestions)) {
        const other = cvAtStep(step);
        other.questions = [openQuestion('q1')];

        expect(other.submitAnswers(answers).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      const answers = [{ questionId: 'q1', answer: 'a' }];

      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.AnswerQuestions, status);
        cv.questions = [openQuestion('q1')];

        expect(cv.submitAnswers(answers).success).toBe(false);
      }
    });

    it('rejects an answer for an unknown question', () => {
      const cv = cvWithTwoOpenQuestions();

      const result = cv.submitAnswers([
        { questionId: 'q1', answer: 'a' },
        { questionId: 'unknown', answer: 'b' },
      ]);

      expect(result.success).toBe(false);
      expect(cv.currentStep).toBe(CvStep.AnswerQuestions);
    });

    it('rejects answers that leave an open question unanswered', () => {
      const cv = cvWithTwoOpenQuestions();

      const result = cv.submitAnswers([{ questionId: 'q1', answer: 'a' }]);

      expect(result.success).toBe(false);
      expect(cv.currentStep).toBe(CvStep.AnswerQuestions);
    });

    it('rejects two answers for the same question', () => {
      const cv = cvWithTwoOpenQuestions();

      const result = cv.submitAnswers([
        { questionId: 'q1', answer: 'a' },
        { questionId: 'q1', answer: 'b' },
      ]);

      expect(result.success).toBe(false);
      expect(cv.currentStep).toBe(CvStep.AnswerQuestions);
    });

    it('trims answers and dismisses blank ones', () => {
      const cv = cvWithTwoOpenQuestions();

      cv.submitAnswers([
        { questionId: 'q1', answer: '  a@b.c \n' },
        { questionId: 'q2', answer: '   ' },
      ]);

      expect(cv.currentStep).toBe(CvStep.ApplyAnswers);
      expect(cv.questions[0].status).toBe(QuestionStatus.Answered);
      expect(cv.questions[0].answer).toBe('a@b.c');
      expect(cv.questions[1].status).toBe(QuestionStatus.Dismissed);
      expect(cv.questions[1].answer).toBeNull();
    });

    it('does not accept the same answers twice', () => {
      const cv = cvAtStep(CvStep.AnswerQuestions);
      cv.questions = [openQuestion('q1')];
      const answers = [{ questionId: 'q1', answer: 'a' }];

      expect(cv.submitAnswers(answers).success).toBe(true);
      expect(cv.submitAnswers(answers).success).toBe(false);
    });
  });

  describe('applyAnswers', () => {
    it('works only at the apply_answers step', () => {
      expect(cvAtStep(CvStep.ApplyAnswers).applyAnswers([]).success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.ApplyAnswers)) {
        expect(cvAtStep(step).applyAnswers([]).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ApplyAnswers, status);

        expect(cv.applyAnswers([]).success).toBe(false);
      }
    });
  });

  describe('applyComposition', () => {
    it('works only at the compose_cv step', () => {
      const cv = cvAtStep(CvStep.ComposeCv);
      expect(cv.applyComposition(safeDocument).success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.ComposeCv)) {
        const other = cvAtStep(step);

        expect(other.applyComposition(safeDocument).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ComposeCv, status);

        expect(cv.applyComposition(safeDocument).success).toBe(false);
      }
    });
  });

  describe('applyReview', () => {
    const noFeedback = { feedback: [], safeDocument };

    it('works only at the validate_result step', () => {
      const cv = cvAtStep(CvStep.ValidateResult);
      expect(cv.applyReview(noFeedback).success).toBe(true);

      for (const step of allSteps.filter((s) => s !== CvStep.ValidateResult)) {
        expect(cvAtStep(step).applyReview(noFeedback).success).toBe(false);
      }
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ValidateResult, status);

        expect(cv.applyReview(noFeedback).success).toBe(false);
      }
    });

    it('sends feedback back to composition while regenerations remain', () => {
      const cv = cvAtStep(CvStep.ValidateResult);

      cv.applyReview({ feedback: ['bad bullet'], safeDocument });

      expect(cv.currentStep).toBe(CvStep.ComposeCv);
      expect(cv.composeFeedback).toEqual(['bad bullet']);
      expect(cv.composeRegenerations).toBe(1);
      expect(cv.document).toEqual(draftDocument);
    });

    it('completes with the safe document once regenerations are used up', () => {
      const cv = cvAtStep(CvStep.ValidateResult);
      cv.composeRegenerations = MAX_COMPOSE_REGENERATIONS;

      cv.applyReview({ feedback: ['bad bullet'], safeDocument });

      expect(cv.status).toBe(CvStatus.Completed);
      expect(cv.currentStep).toBeNull();
      expect(cv.document).toBe(safeDocument);
      expect(cv.composeFeedback).toEqual([]);
    });

    it('completes right away when there is no feedback', () => {
      const cv = cvAtStep(CvStep.ValidateResult);
      cv.composeFeedback = ['old feedback'];

      cv.applyReview(noFeedback);

      expect(cv.status).toBe(CvStatus.Completed);
      expect(cv.composeFeedback).toEqual([]);
      expect(cv.composeRegenerations).toBe(0);
    });
  });

  describe('finishStep', () => {
    it('moves every step on to the next one', () => {
      for (const [step, nextStep] of Object.entries(NEXT_STEP)) {
        const cv = cvAtStep(step as CvStep);

        expect(cv.finishStep(step as CvStep).success).toBe(true);
        expect(cv.currentStep).toBe(nextStep);
        expect(cv.status).toBe(CvStatus.Processing);
      }
    });

    it('cannot complete the CV: only applyReview does that', () => {
      const stepsWithoutNext = allSteps.filter((step) => !(step in NEXT_STEP));

      for (const step of stepsWithoutNext) {
        const cv = cvAtStep(step);

        expect(cv.finishStep(step).success).toBe(false);
        expect(cv.status).toBe(CvStatus.Processing);
        expect(cv.currentStep).toBe(step);
      }
    });

    it('rejects finishing a step that is not the current one', () => {
      const cv = cvAtStep(CvStep.ComposeCv);

      expect(cv.finishStep(CvStep.ExtractFacts).success).toBe(false);
      expect(cv.finishStep(CvStep.ValidateResult).success).toBe(false);
      expect(cv.currentStep).toBe(CvStep.ComposeCv);
    });

    it('does nothing unless the CV is processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(CvStep.ComposeCv, status);

        expect(cv.finishStep(CvStep.ComposeCv).success).toBe(false);
      }
    });
  });

  describe('fail', () => {
    it('marks a processing CV as failed with the reason', () => {
      const cv = cvAtStep(CvStep.ComposeCv);

      expect(cv.fail('boom').success).toBe(true);
      expect(cv.status).toBe(CvStatus.Failed);
      expect(cv.failureReason).toBe('boom');
    });

    it('does not touch a CV that is not processing', () => {
      for (const status of notProcessing) {
        const cv = cvAtStep(null, status);

        expect(cv.fail('boom').success).toBe(false);
        expect(cv.status).toBe(status);
        expect(cv.failureReason).toBeNull();
      }
    });
  });
});
