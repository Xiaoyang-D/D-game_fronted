import { Link } from 'react-router-dom'
import { Eye, Gamepad2, Heart, MessageCircle, ThumbsUp } from 'lucide-react'
import type { PostResp } from '@/types/api'
import { CardFollowButton } from './CardFollowButton'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime, cn } from '@/lib/utils'

interface PostCardProps {
  post: PostResp
  className?: string
  badgeLabel?: string
  compact?: boolean
}

export function PostCard({ post, className, badgeLabel, compact }: PostCardProps) {
  const images = extractImages(post.content).slice(0, compact ? 5 : 2)
  const excerpt = stripHtml(post.content)
  const authorName = post.authorNickname || post.authorUsername || '用户'

  return (
    <article className={cn('group rounded-lg bg-white p-5 shadow-sm transition-colors duration-200 hover:shadow-md', className)}>
      {badgeLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-primary">
            {badgeLabel}
          </span>
        </div>
      )}

      <header className="flex items-start gap-3">
        <Link to={`/users/${post.userId}`} className="shrink-0" aria-label={`查看 ${authorName} 的主页`}>
          <Avatar
            src={post.authorAvatarUrl}
            alt={`${authorName} 头像`}
            size="md"
            className="h-11 w-11 rounded-md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/users/${post.userId}`} className="font-black text-text transition-colors duration-200 hover:text-primary">
              {authorName}
            </Link>
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
        <CardFollowButton authorId={post.userId} />
      </header>

      <Link to={`/posts/${post.id}`} className="mt-4 block">
        {images.length > 0 && (
          <div className="flex items-start gap-3 overflow-hidden">
            {images.map((src) => (
              <div key={src} className={cn('min-w-0 overflow-hidden rounded-md', compact ? 'shrink-0' : images.length > 1 ? 'max-w-[calc(50%-6px)]' : 'max-w-full')}>
                <img
                  src={src}
                  alt=""
                  className={compact ? 'block h-auto max-h-40 w-auto max-w-32 object-contain' : 'block h-auto max-h-[360px] w-auto max-w-full object-contain sm:max-h-[400px]'}
                />
              </div>
            ))}
          </div>
        )}

        <h3 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-text transition-colors duration-200 group-hover:text-primary">
          {post.title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {excerpt}
          </p>
        )}
      </Link>

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
