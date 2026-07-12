import { CONTENT_STATUS, NOTIFICATION_TYPE } from './constants'
import type { Id } from '@/types/api'

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

export function formatRating(value: number): string {
  return value.toFixed(1)
}

export function getContentStatusLabel(status: number): string {
  switch (status) {
    case CONTENT_STATUS.DRAFT:
      return '草稿'
    case CONTENT_STATUS.PENDING:
      return '待审核'
    case CONTENT_STATUS.APPROVED:
      return '已通过'
    case CONTENT_STATUS.REJECTED:
      return '已拒绝'
    default:
      return '未知'
  }
}

export function getNotificationTypeLabel(type: number): string {
  switch (type) {
    case NOTIFICATION_TYPE.LIKE:
      return '点赞'
    case NOTIFICATION_TYPE.COMMENT:
      return '评论'
    case NOTIFICATION_TYPE.FOLLOW:
      return '关注'
    case NOTIFICATION_TYPE.SYSTEM:
      return '系统通知'
    case NOTIFICATION_TYPE.AUDIT:
      return '审核通知'
    default:
      return '通知'
  }
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function isApprovedPost(status: number): boolean {
  return status === CONTENT_STATUS.APPROVED
}

/** 判断是否为顶级评论（parentId 为 "0"） */
export function isTopLevelComment(parentId: Id): boolean {
  return parentId === '0'
}

/** 校验 ID 字符串非空 */
export function isValidId(id: string | undefined | null): id is Id {
  return typeof id === 'string' && id.trim().length > 0
}
