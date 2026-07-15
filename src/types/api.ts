/** 后端雪花 ID，始终以字符串传递，禁止 Number() 转换 */
export type Id = string

export interface Result<T> {
  code: number
  message: string
  data: T
  requestId: string | null
}

export interface PageResult<T> {
  page: number
  size: number
  total: number
  records: T[]
}

export interface TokenResp {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserResp
}

export interface UserResp {
  id: Id
  username: string
  nickname: string
  email: string | null
  mobile: string | null
  avatarUrl: string | null
  bio: string
  status: number
  roles: string[]
  gmtCreate: string
}

export interface GameCategory {
  id: Id
  name: string
  sortOrder: number
  gmtCreate: string
  gmtModified: string
  isDeleted: number
}

export interface Tag {
  id: Id
  name: string
  gmtCreate: string
  gmtModified: string
  isDeleted: number
}

export interface GameResp {
  id: Id
  name: string
  categoryId: Id
  categoryName: string
  coverUrl: string | null
  description: string | null
  developer: string | null
  releaseDate: string | null
  avgRating: number
  ratingCount: number
  tags: string[]
}

export interface GameReviewResp {
  id: Id
  userId: Id
  userNickname: string
  score: number
  summary: string
  pros: string
  cons: string
  playtimeHours: number | null
  gmtCreate: string
}

export interface Board {
  id: Id
  name: string
  description: string
  sortOrder: number
  gmtCreate: string
  gmtModified: string
  isDeleted: number
}

export interface PostResp {
  id: Id
  boardId: Id
  boardName: string
  gameId: Id | null
  gameName: string | null
  userId: Id
  authorNickname: string
  authorUsername?: string
  authorAvatarUrl?: string | null
  authorStatus?: number
  title: string
  content: string
  status: number
  viewCount: number
  likeCount: number
  commentCount: number
  favoriteCount: number
  collectionId?: Id | null
  collectionName?: string | null
  topics?: PostTopicResp[]
  isOriginal?: boolean
  containsAiGenerated?: boolean
  scheduledPublishAt?: string | null
  gmtCreate: string
}

export interface PostTopicResp {
  id: Id
  name: string
}

export interface PostCollectionResp {
  id: Id
  name: string
}

export interface PostDraftResp {
  id: Id
  boardId: Id | null
  boardName: string | null
  gameId: Id | null
  gameName: string | null
  title: string
  content: string
  status: number
  isOriginal: boolean
  containsAiGenerated: boolean
  scheduledPublishAt: string | null
  collectionId: Id | null
  collectionName: string | null
  topics: PostTopicResp[]
  gmtModified: string
}

export type PostManageTab = 'published' | 'pending' | 'rejected' | 'draft'

export interface PostManageItem {
  id: Id
  boardId: Id | null
  boardName: string | null
  gameId: Id | null
  gameName: string | null
  collectionId: Id | null
  collectionName: string | null
  title: string
  content: string
  /** 0 draft, 1 pending, 2 approved, 3 rejected. */
  status: number
  isOriginal: boolean
  containsAiGenerated: boolean
  topics: PostTopicResp[]
  viewCount: number
  likeCount: number
  commentCount: number
  favoriteCount: number
  scheduledPublishAt: string | null
  gmtCreate: string
  /** Last edit time; drafts use this timestamp in the management list. */
  gmtModified: string
}

export interface PostManagePageResp {
  publishedCount: number
  pendingCount: number
  rejectedCount: number
  draftCount: number
  page: number
  size: number
  total: number
  records: PostManageItem[]
}

export interface UserProfileResp {
  id: Id
  nickname: string
  avatarUrl: string | null
  bio: string
  gmtCreate: string
  postCount: number
  likeCount: number
  followingCount: number
  followerCount: number
  favoriteCount: number
  isSelf: boolean
  isFollowing: boolean
}

export interface UserFavoriteResp {
  targetType: number
  targetId: Id
  title: string
  content: string | null
  coverUrl: string | null
  boardId: Id | null
  boardName: string | null
  gameId: Id | null
  gameName: string | null
  userId: Id | null
  authorNickname: string | null
  authorUsername: string | null
  authorAvatarUrl: string | null
  authorStatus: number | null
  status: number | null
  viewCount: number | null
  likeCount: number | null
  commentCount: number | null
  favoriteCount: number | null
  categoryName: string | null
  avgRating: number | null
  ratingCount: number | null
  gmtCreate: string
}

export interface BannedAuthorPostsQuery {
  authorId?: Id
  keyword?: string
  page?: number
  size?: number
}

export interface CommentResp {
  id: Id
  postId: Id
  parentId: Id
  userId: Id
  userNickname: string
  userAvatarUrl: string | null
  content: string
  likeCount: number
  gmtCreate: string
}

export type CommentSort = 'DEFAULT' | 'EARLIEST' | 'LATEST'

export interface Notification {
  id: Id
  receiverId: Id
  senderId: Id
  type: number
  title: string
  content: string
  targetType: number
  targetId: Id
  isRead: number
  gmtCreate: string
  gmtModified: string
  isDeleted: number
}

export interface FileResp {
  id: Id
  fileKey: string
  fileUrl: string
  fileName: string
  fileSize: number
  contentType: string
}

export interface SysRole {
  id: Id
  roleCode: string
  roleName: string
  description: string
  gmtCreate: string
  gmtModified: string
  isDeleted: number
}

export interface LoginReq {
  username: string
  password: string
}

export interface RegisterReq {
  username: string
  password: string
  nickname?: string
  email?: string
  mobile?: string
}

export interface UpdateProfileReq {
  nickname?: string
  email?: string
  mobile?: string
  avatarUrl?: string
  bio?: string
}

export interface CreateGameReq {
  name: string
  categoryId: Id
  coverUrl?: string
  description?: string
  developer?: string
  releaseDate?: string
  tagIds?: Id[]
}

export interface CreatePostReq {
  boardId: Id
  gameId?: Id
  title: string
  content: string
}

export interface PostDraftSaveReq {
  boardId?: Id
  gameId?: Id
  title?: string
  content?: string
  topicNames?: string[]
  collectionId?: Id
  isOriginal?: boolean
  containsAiGenerated?: boolean
  scheduledPublishAt?: string
}

export interface PostPublishReq {
  boardId: Id
  gameId?: Id
  title: string
  content: string
  topicNames?: string[]
  collectionId?: Id
  isOriginal?: boolean
  containsAiGenerated?: boolean
  scheduledPublishAt?: string
}

export interface CreateCommentReq {
  postId: Id
  parentId?: Id
  content: string
}

export interface InteractionReq {
  targetType: number
  targetId: Id
}

export interface InteractionStatusResp {
  liked: boolean
  favorited: boolean
}

export interface RatingReq {
  score: number
  summary?: string
  pros?: string
  cons?: string
  playtimeHours?: number
}

export interface AuditReq {
  approved: boolean
  reason?: string
}

export interface BatchAuditReq {
  postIds: Id[]
  approved: boolean
  reason?: string
}

export interface AssignRoleReq {
  userId: Id
  roleId: Id
}

export interface GamesQuery {
  categoryId?: Id
  tagId?: Id
  keyword?: string
  page?: number
  size?: number
}

export interface PostsQuery {
  boardId?: Id
  authorId?: Id
  gameId?: Id
  keyword?: string
  page?: number
  size?: number
}

export interface SearchQuery {
  keyword: string
  type?: 'ALL' | 'GAME' | 'POST'
  page?: number
  size?: number
}

export interface SearchResp {
  games?: PageResult<GameResp>
  posts?: PageResult<PostResp>
}

export interface ReportResp {
  id: Id
  reporterId: Id
  targetType: number
  targetId: Id
  reason: string
  status: number
  handleNote: string | null
  gmtCreate: string
}

export interface ReportAuditReq {
  handled: boolean
  note?: string
}

export interface CommentsQuery {
  postId: Id
  page?: number
  size?: number
  sort?: CommentSort
}

export interface NotificationsQuery {
  page?: number
  size?: number
}

export interface CheckInStatusResp {
  checkedInToday: boolean
  streakDays: number
  lastCheckInDate: string | null
}

export interface CheckInResultResp {
  checkInDate: string
  streakDays: number
}
