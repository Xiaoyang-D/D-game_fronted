import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function OriginalImageDialog({ src, alt = '原图', onClose, returnFocus }: {
  src: string; alt?: string; onClose: () => void; returnFocus?: HTMLElement | null
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }
  }, [returnFocus])

  return <dialog ref={ref} aria-label="查看原图" onClose={onClose}
    className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-black/90 p-5 text-white"
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" autoFocus aria-label="关闭原图" onClick={onClose}
      className="fixed right-5 top-5 z-10 rounded-full bg-white/20 p-3"><X /></button>
    <div className="flex min-h-full items-center justify-center pointer-events-none">
      <img src={src} alt={alt} className="pointer-events-auto max-h-[90vh] max-w-full object-contain" />
    </div>
  </dialog>
}
