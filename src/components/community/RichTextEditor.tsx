import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import CharacterCount from '@tiptap/extension-character-count'
import ImageExtension from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { uploadFile } from '@/api/file'
import { cn } from '@/lib/utils'
import { plainTextLength } from '@/lib/richText'
import { useToast } from '@/components/ui/Toast'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export function RichTextEditor({ value, onChange, disabled, placeholder, maxLength }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Link.configure({
        autolink: false,
        linkOnPaste: false,
        openOnClick: false,
        isAllowedUri: (url, { defaultValidate }) => /^(https?:|mailto:)/i.test(url) && defaultValidate(url),
      }),
      ImageExtension.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || '' }),
      CharacterCount.configure({ limit: maxLength ?? null, mode: 'textSize' }),
      Underline,
    ],
    content: value || '<p></p>',
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const nextContent = value || '<p></p>'
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  const runCommand = (command: () => boolean) => {
    if (!editor || disabled) return
    command()
  }

  const createLink = () => {
    if (!editor || disabled) return
    const href = window.prompt('请输入链接地址')?.trim()
    if (!href) return
    if (!/^(https?:|mailto:)/i.test(href)) {
      toast('仅支持 http、https 或 mailto 链接', 'error')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  const insertImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return
    setUploading(true)
    try {
      const uploaded = await uploadFile(file)
      editor.chain().focus().setImage({ src: uploaded.fileUrl }).run()
    } catch (error) {
      toast(error instanceof Error ? error.message : '图片上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const setBlockType = (value: string) => {
    if (!editor || disabled) return
    const chain = editor.chain().focus()
    if (value === 'paragraph') {
      chain.setParagraph().run()
      return
    }
    chain.toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run()
  }

  const currentLength = plainTextLength(value)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white focus-within:border-primary">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        <ToolbarButton label="撤销" onClick={() => runCommand(() => editor?.chain().focus().undo().run() ?? false)} disabled={disabled || !editor}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="重做" onClick={() => runCommand(() => editor?.chain().focus().redo().run() ?? false)} disabled={disabled || !editor}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarDivider />
        <select
          aria-label="文本样式"
          disabled={disabled || !editor}
          defaultValue="paragraph"
          onChange={(event) => setBlockType(event.target.value)}
          className="h-8 rounded-md border-0 bg-transparent px-2 text-xs font-bold text-text-secondary outline-none hover:bg-muted"
        >
          <option value="paragraph">正文</option>
          <option value="1">标题</option>
          <option value="2">小标题</option>
          <option value="3">三级标题</option>
        </select>
        <ToolbarButton label="粗体" onClick={() => runCommand(() => editor?.chain().focus().toggleBold().run() ?? false)} disabled={disabled || !editor}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="斜体" onClick={() => runCommand(() => editor?.chain().focus().toggleItalic().run() ?? false)} disabled={disabled || !editor}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="下划线" onClick={() => runCommand(() => editor?.chain().focus().toggleUnderline().run() ?? false)} disabled={disabled || !editor}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="删除线" onClick={() => runCommand(() => editor?.chain().focus().toggleStrike().run() ?? false)} disabled={disabled || !editor}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="引用" onClick={() => runCommand(() => editor?.chain().focus().toggleBlockquote().run() ?? false)} disabled={disabled || !editor}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="无序列表" onClick={() => runCommand(() => editor?.chain().focus().toggleBulletList().run() ?? false)} disabled={disabled || !editor}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="有序列表" onClick={() => runCommand(() => editor?.chain().focus().toggleOrderedList().run() ?? false)} disabled={disabled || !editor}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="插入链接" onClick={createLink} disabled={disabled || !editor}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label={uploading ? '上传中' : '插入图片'} onClick={() => fileRef.current?.click()} disabled={disabled || uploading || !editor}>
          <ImageIcon className={cn('h-4 w-4', uploading && 'animate-pulse')} />
        </ToolbarButton>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={insertImage} />
      </div>

      <EditorContent
        editor={editor}
        className="post-editor-content min-h-[360px] overflow-y-auto px-5 py-4 text-[15px] leading-8 text-text outline-none [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-text-secondary/50 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:my-5 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-md [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
      />
      {maxLength !== undefined && (
        <div className="border-t border-border px-5 py-2 text-right text-xs text-text-secondary">
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-200 hover:bg-muted hover:text-text disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
}
