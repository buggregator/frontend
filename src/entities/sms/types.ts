export interface SmsPayload {
  from: string
  to: string
  message: string
  gateway: string
  warnings?: string[]
}
