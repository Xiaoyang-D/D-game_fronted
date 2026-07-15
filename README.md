# D-Game 游戏社区前端

基于 React 18 + Vite + TypeScript + Tailwind CSS 构建的游戏社区平台前端，对接 D-Game 后端 API。

## 功能

- **公开访问**：首页、游戏库（分类/标签/搜索）、社区帖子浏览
- **用户功能**：注册/登录、发帖、评论、点赞/收藏、个人资料编辑、头像上传、通知中心
- **管理后台**：创建游戏、帖子/评论审核、用户封禁/解封、角色分配

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS（清爽明亮风格）
- React Router v6
- TanStack Query（数据请求与缓存）
- Zustand（登录态管理）
- React Hook Form + Zod（表单校验）
- Axios（HTTP 请求，含 Token 自动刷新）
- Lucide React（图标）

## 快速开始

### 前置条件

- Node.js 18+
- 后端服务运行在 `http://127.0.0.1:8080`

### 安装与启动

```bash
cd game_fronted
npm install
npm run dev
```

访问 http://127.0.0.1:5173

### 默认测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin@123456 | ADMIN |

## 项目结构

```
src/
├── api/          # API 接口封装
├── components/   # 通用组件（UI、布局、路由守卫）
├── hooks/        # 自定义 Hooks
├── lib/          # 工具函数与常量
├── pages/        # 页面组件
├── store/        # Zustand 状态
└── types/        # TypeScript 类型定义
```

## API 代理

开发环境通过 Vite 代理转发 API 请求：

- `/api/*` → `http://127.0.0.1:8080`
- `/files/*` → `http://127.0.0.1:8080`

## ID 处理约定

后端雪花 ID 以**字符串**返回（如 `"2062801749048246274"`），前端必须保持字符串传递：

```typescript
// 发帖成功后
const postId = await createPost(data)  // 已是字符串

// 查详情 / 评论 — 直接使用，禁止 Number() 转换
getPost(postId)
getComments({ postId })
navigate(`/posts/${postId}`)
```

**禁止**对实体 ID 使用 `Number()`、`parseInt()` 或 `+id`，否则大整数会精度丢失。

## 构建

```bash
npm run build
npm run preview
```
