export class ApiError extends Error {
  status: number

  constructor(status: number | null, message: string | null) {
    super(message ?? 'Unknown Error')
    this.status = status ?? 500
    this.name = 'ApiError'
  }
}
