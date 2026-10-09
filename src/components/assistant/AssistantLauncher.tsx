import { Bot } from 'lucide-react'
import { AssistantChatPanel } from './AssistantChatPanel'
import { useAssistant } from '@/hooks/useAssistant'

export function AssistantLauncher() {
  const { isOpen, open, close } = useAssistant()

  return (
    <>
      <button
        type="button"
        title="打开智能助手"
        aria-label="打开智能助手"
        onClick={open}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-[#1f250c] shadow-[0_8px_22px_rgba(30,35,41,0.24)] transition-colors hover:bg-primary-hover"
      >
        <Bot className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="D-Game 智能助手">
          <button type="button" aria-label="关闭智能助手" onClick={close} className="absolute inset-0 bg-black/30" />
          <aside className="relative flex h-full w-full max-w-[430px] flex-col border-l border-border bg-white shadow-2xl">
            <AssistantChatPanel variant="drawer" onClose={close} />
          </aside>
        </div>
      )}
    </>
  )
}
