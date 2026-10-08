import { $api } from '@/shared/api/api-client'
import type { User } from './types'

export const getMe = async () => (await $api.get<User>('/users/me')).data
