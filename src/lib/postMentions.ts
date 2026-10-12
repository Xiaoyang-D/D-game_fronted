import Mention from '@tiptap/extension-mention'
import { searchMentionUsers } from '@/api/message'
import type { UserBrief } from '@/types/messages'

type MenuState = { items: UserBrief[]; command: (props: { id: string; label: string }) => void; clientRect?: (() => DOMRect | null) | null }

export const PostMention = Mention.configure({
  HTMLAttributes: { class: 'user-mention' },
  suggestion: {
    items: async ({ query }) => query.trim() ? searchMentionUsers(query).catch(() => []) : [],
    render: () => {
      let menu: HTMLDivElement | null = null
      let current: MenuState | null = null
      let selected = 0
      const render = (props: MenuState) => {
        current = props
        if (!menu) {
          menu = document.createElement('div'); menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-label', '选择提及用户')
          menu.className = 'fixed z-50 max-h-52 min-w-52 overflow-auto rounded-lg border bg-white py-1 shadow-lg'; document.body.append(menu)
        }
        menu.replaceChildren()
        props.items.forEach((user, index) => {
          const button = document.createElement('button')
          button.type = 'button'; button.textContent = user.nickname; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(index === selected))
          button.className = `block w-full px-4 py-2 text-left text-sm ${index === selected ? 'bg-primary/10' : 'hover:bg-gray-50'}`
          button.onmousedown = event => event.preventDefault()
          button.onclick = () => props.command({ id: user.id, label: user.nickname })
          menu?.append(button)
        })
        const rect = props.clientRect?.()
        if (rect) { menu.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`; menu.style.top = `${Math.min(rect.bottom + 5, window.innerHeight - 220)}px` }
        menu.hidden = !props.items.length
      }
      return {
        onStart: (props: MenuState) => { selected = 0; render(props) },
        onUpdate: (props: MenuState) => { selected = 0; render(props) },
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
          if (event.isComposing || !current?.items.length) return false
          if (event.key === 'Escape') { menu?.remove(); menu = null; return true }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            selected = (selected + (event.key === 'ArrowDown' ? 1 : current.items.length - 1)) % current.items.length
            render(current); return true
          }
          if (event.key === 'Enter') { const user = current.items[selected]; current.command({ id: user.id, label: user.nickname }); return true }
          return false
        },
        onExit: () => { menu?.remove(); menu = null; current = null },
      }
    },
  },
})
