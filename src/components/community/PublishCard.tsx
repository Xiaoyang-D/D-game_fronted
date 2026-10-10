import { Link } from 'react-router-dom'
import { FileText, Image, PenSquare, SquarePlay } from 'lucide-react'

export function PublishCard({ publishUrl = '/posts/new' }: { publishUrl?: string }) {
  return (
<section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-text">作品发布 <span className="text-sm text-text-secondary/40">POST<span className="text-primary">.</span></span></h2>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Link to={publishUrl} className="group flex flex-col items-center gap-3 rounded-lg py-1 text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-primary bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"><PenSquare className="h-8 w-8" /></span>
                发图文
              </Link>
              <button type="button" disabled title="发图集暂未开放" className="flex cursor-not-allowed flex-col items-center gap-3 rounded-lg py-1 text-sm text-text-secondary">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-primary bg-primary/10 text-primary"><Image className="h-8 w-8" /></span>
                发图集
              </button>
              <button type="button" disabled title="发视频暂未开放" className="flex cursor-not-allowed flex-col items-center gap-3 rounded-lg py-1 text-sm text-text-secondary">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-primary bg-primary/10 text-primary"><SquarePlay className="h-8 w-8" /></span>
                发视频
              </button>
            </div>
            <Link to="/posts/manage?tab=draft" className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4 text-sm text-text-secondary hover:text-primary"><FileText className="h-4 w-4" />草稿箱</Link>
          </section>
  )
}
