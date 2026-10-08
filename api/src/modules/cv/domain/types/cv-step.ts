export enum CvStep {
  ParsePdf = 'parse_pdf',
  ExtractFacts = 'extract_facts',
  VerifyEvidence = 'verify_evidence',
  ComposeCv = 'compose_cv',
  GenerateQuestions = 'generate_questions',
  AnswerQuestions = 'answer_questions',
  ApplyAnswers = 'apply_answers',
  ValidateResult = 'validate_result',
}
