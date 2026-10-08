import { $api } from '@/shared/api/api-client'
import type { User } from './types'

export class UserApi {
  static async getMe() {
    const { data } = await $api.get<User>('/users/me')
    return data
  }
}
