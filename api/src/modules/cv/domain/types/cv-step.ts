export enum CvStep {
  ParsePdf = 'parse_pdf',
  ExtractFacts = 'extract_facts',
  VerifyEvidence = 'verify_evidence',
  TailorToRole = 'tailor_to_role',
  GenerateQuestions = 'generate_questions',
  AnswerQuestions = 'answer_questions',
  ApplyAnswers = 'apply_answers',
}
