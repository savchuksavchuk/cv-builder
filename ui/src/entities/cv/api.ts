import { $api } from '@/shared/api/api-client'
import type { Cv, CvAnswer, CvSummary, Paginated, UpdateCvBody } from './types'

export class CvApi {
  static async getList(params: { page: number; limit: number }) {
    const { data } = await $api.get<Paginated<CvSummary>>('/cvs', { params })
    return data
  }

  static async getOne(id: string) {
    const { data } = await $api.get<Cv>(`/cvs/${id}`)
    return data
  }

  static async create(body: FormData) {
    const { data } = await $api.post<{ id: string }>('/cvs', body)
    return data
  }

  static async submitAnswers(id: string, answers: CvAnswer[]) {
    const { data } = await $api.post<Cv>(`/cvs/${id}/answers`, { answers })
    return data
  }

  static async update(id: string, body: UpdateCvBody) {
    const { data } = await $api.patch<Cv>(`/cvs/${id}`, body)
    return data
  }
}
