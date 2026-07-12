import api from './client'
import type { FileResp } from '@/types/api'

export async function uploadFile(file: File): Promise<FileResp> {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<FileResp>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
