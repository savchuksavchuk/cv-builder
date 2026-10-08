import { Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { CV_LIMITS, type CvQuestion } from '@/entities/cv'
import { Button } from '@/shared/ui/button'
import { CharCounter } from '@/shared/ui/char-counter'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useSubmitAnswers } from '../hooks/use-submit-answers'

type FormData = Record<string, string>

export const QuestionsForm = ({
  cvId,
  questions,
}: {
  cvId: string
  questions: CvQuestion[]
}) => {
  const { submit, isPending, error } = useSubmitAnswers(cvId)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>()
  const values = useWatch({ control })

  const onSubmit = handleSubmit((values) =>
    submit(
      questions.map((q) => ({
        questionId: q.id,
        answer: values[q.id]?.trim() || null,
      })),
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <p className="text-muted-foreground text-sm">
        Leave a field empty to skip the question.
      </p>
      {questions.map((q) => (
        <div key={q.id} className="grid gap-2">
          <Label htmlFor={q.id}>{q.question}</Label>
          <Textarea
            id={q.id}
            rows={3}
            aria-invalid={!!errors[q.id]}
            {...register(q.id, {
              maxLength: {
                value: CV_LIMITS.ANSWER,
                message: `Answer must be at most ${CV_LIMITS.ANSWER.toLocaleString('en-US')} characters`,
              },
            })}
          />
          <CharCounter
            length={values[q.id]?.length ?? 0}
            max={CV_LIMITS.ANSWER}
          />
          {errors[q.id] && (
            <p className="text-destructive text-sm">{errors[q.id]?.message}</p>
          )}
        </div>
      ))}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {isPending ? 'Submitting…' : 'Submit answers'}
      </Button>
    </form>
  )
}
