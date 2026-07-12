import api from './client'
import type { CheckInResultResp, CheckInStatusResp } from '@/types/api'

export async function getCheckInStatus(): Promise<CheckInStatusResp> {
  return api.get<CheckInStatusResp>('/check-ins/status')
}

export async function doCheckIn(): Promise<CheckInResultResp> {
  return api.post<CheckInResultResp>('/check-ins')
}
