export const TARGET_TYPE = {
  POST: 1,
  COMMENT: 2,
  GAME: 3,
} as const

export const CONTENT_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const

export const NOTIFICATION_TYPE = {
  LIKE: 1,
  COMMENT: 2,
  FOLLOW: 3,
  SYSTEM: 4,
  AUDIT: 5,
} as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
