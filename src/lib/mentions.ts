import type { Mention } from '@/types/messages'

/** 文本编辑只保留未被改动的提及；其后的 UTF-16 位置随插入或删除移动。 */
export function moveMentions(previous: string, next: string, mentions: Mention[]): Mention[] {
  let start = 0
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++
  let oldEnd = previous.length, newEnd = next.length
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd-- }
  const delta = newEnd - oldEnd
  return mentions.flatMap(mention => {
    if (mention.end <= start) return [mention]
    if (mention.start >= oldEnd) return [{ ...mention, start: mention.start + delta, end: mention.end + delta }]
    return []
  })
}

export function mentionQuery(text: string, caret: number) {
  const prefix = text.slice(0, caret)
  const match = /(?:^|\s)@([^\s@]{1,50})$/.exec(prefix)
  return match ? { q: match[1], start: caret - match[1].length - 1 } : null
}
