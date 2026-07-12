import { Link } from 'react-router-dom'
import { Eye, Gamepad2, Heart, MessageCircle, ThumbsUp } from 'lucide-react'
import type { PostResp } from '@/types/api'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: PostResp
  className?: string
}

export function PostCard({ post, className }: PostCardProps) {
  const images = extractImages(post.content).slice(0, 2)
  const excerpt = stripHtml(post.content)

  return (
    <Link to={`/posts/${post.id}`} className={cn('block', className)}>
      <article className="group rounded-lg bg-white p-5 shadow-sm transition-colors duration-200 hover:bg-white hover:shadow-md">
        <header className="flex items-start gap-3">
          <Avatar
            src={post.authorAvatarUrl}
            alt={post.authorNickname || post.authorUsername || '用户头像'}
            size="md"
            className="h-11 w-11 shrink-0 rounded-md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-black text-text">{post.authorNickname || post.authorUsername}</span>
              <span className="text-xs font-medium text-text-secondary">{formatDateTime(post.gmtCreate)}</span>
              <span className="text-xs font-medium text-text-secondary">· {post.boardName}</span>
            </div>
            {post.gameName && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                <Gamepad2 className="h-3 w-3" />
                {post.gameName}
              </span>
            )}
          </div>
        </header>

        {images.length > 0 && (
          <div className={cn('mt-4 grid gap-3', images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {images.map((src) => (
              <div key={src} className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
              </div>
            ))}
          </div>
        )}

        <h3 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-text group-hover:text-primary">
          {post.title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {excerpt}
          </p>
        )}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-text-secondary">
              #{post.boardName}
            </span>
            {post.gameName && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-text-secondary">
                #{post.gameName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-text-secondary">
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.viewCount}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{post.commentCount}</span>
            <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{post.likeCount}</span>
            <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.favoriteCount}</span>
          </div>
        </footer>
      </article>
    </Link>
  )
}

function extractImages(html: string): string[] {
  return Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi), (match) => match[1])
}

function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
