import { Loader2 } from 'lucide-react'
import { CV_LIMITS } from '@/entities/cv'
import { Button } from '@/shared/ui/button'
import { CharCounter } from '@/shared/ui/char-counter'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCvCreateForm } from '../hooks/use-cv-create-form'

export const CvCreateForm = () => {
  const { form, isPending, error, onSubmit } = useCvCreateForm()
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="targetRole">Target role</Label>
        <Input
          id="targetRole"
          placeholder="Senior Backend Engineer"
          aria-invalid={!!errors.targetRole}
          {...register('targetRole')}
        />
        {errors.targetRole && (
          <p className="text-destructive text-sm">
            {errors.targetRole.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="text">Your experience</Label>
        <Textarea
          id="text"
          rows={8}
          placeholder="Paste your experience, skills, education…"
          aria-invalid={!!errors.text}
          {...register('text')}
        />
        <CharCounter length={watch('text').length} max={CV_LIMITS.INPUT_TEXT} />
        {errors.text && (
          <p className="text-destructive text-sm">{errors.text.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file">PDF (optional)</Label>
        <Input
          id="file"
          type="file"
          accept="application/pdf"
          aria-invalid={!!errors.file}
          onChange={(e) =>
            setValue('file', e.target.files?.[0], { shouldValidate: true })
          }
        />
        {errors.file && (
          <p className="text-destructive text-sm">{errors.file.message}</p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {isPending ? 'Creating…' : 'Create CV'}
      </Button>
    </form>
  )
}
