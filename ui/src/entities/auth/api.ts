import { $api } from '@/shared/api/api-client'
import type { Credentials } from './types'

export class AuthApi {
  static signUp(data: Credentials) {
    return $api.post('/auth/sign-up', data)
  }

  static signIn(data: Credentials) {
    return $api.post('/auth/sign-in', data)
  }

  static signOut() {
    return $api.post('/auth/sign-out')
  }
}
