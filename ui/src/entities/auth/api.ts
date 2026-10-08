import { $api } from '@/shared/api/api-client'
import type { Credentials } from './types'

export const signUp = (data: Credentials) => $api.post('/auth/sign-up', data)
export const signIn = (data: Credentials) => $api.post('/auth/sign-in', data)
export const signOut = () => $api.post('/auth/sign-out')
