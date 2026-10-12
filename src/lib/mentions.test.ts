import { describe, expect, it } from 'vitest'
import { mentionQuery, moveMentions } from './mentions'
describe('selected user mentions', () => {
  it('recognizes an active @ query without matching email addresses', () => {
    expect(mentionQuery('hi @昵称', 6)).toEqual({ q: '昵称', start: 3 })
    expect(mentionQuery('name@example.com', 16)).toBeNull()
    expect(mentionQuery('@昵称 hello', 9)).toBeNull()
  })
  it('shifts positions with emoji and preserves stable user ids', () => {
    expect(moveMentions('@Beta hi', '😀 @Beta hi', [{ userId: '20', start: 0, end: 5 }])).toEqual([{ userId: '20', start: 3, end: 8 }])
  })
  it('removes edited tokens and retains untouched tokens', () => {
    const selected = [{ userId: '20', start: 0, end: 5 }, { userId: '30', start: 6, end: 12 }]
    expect(moveMentions('@Beta @Gamma', '@Beta @Changed', selected)).toEqual([selected[0]])
    expect(moveMentions('@Beta @Gamma', ' @Gamma', selected)).toEqual([{ userId: '30', start: 1, end: 7 }])
  })
})
