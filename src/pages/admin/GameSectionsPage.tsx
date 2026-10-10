import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGameSections, getGameSection, getGameSectionBoards, saveGameSection, saveGameSectionBoard } from '@/api/gameSections'
import type { GameSection, GameSectionInput, GameBoardSetting, GameBoardInput } from '@/api/gameSections'
import { uploadFile } from '@/api/file'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'

function ImageField({ label, value, onChange, onBusy }: { label: string; value: string; onChange: (value: string) => void; onBusy: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  return <div className="space-y-2">
    <p className="text-sm font-bold">{label}</p>
    {value && <img src={value} alt={`${label}预览`} className="max-h-40 max-w-full rounded-lg object-contain" />}
    <div className="flex flex-wrap items-center gap-3">
      <label className={`rounded-lg border border-border px-3 py-2 text-sm ${busy ? 'opacity-50' : 'cursor-pointer hover:bg-muted'}`}>
        {busy ? '上传中…' : value ? '更换图片' : '上传图片'}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={busy} onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''
          if (!file) return
          setBusy(true); onBusy(true)
          try { const result = await uploadFile(file); onChange(result.fileUrl) }
          catch (error) { toast(error instanceof Error ? error.message : '上传失败', 'error') }
          finally { setBusy(false); onBusy(false) }
        }} />
      </label>
      {value && <button type="button" disabled={busy} onClick={() => onChange('')} className="text-sm text-text-secondary hover:text-red-600">清除</button>}
    </div>
    <p className="text-xs text-text-secondary">横幅建议约 4:1，完整显示，不强制裁剪。上传后点击保存生效。</p>
  </div>
}

function GameEditor({ game, onSaved }: { game?: GameSection; onSaved: (id?: string) => Promise<void> }) {
  const [form, setForm] = useState<GameSectionInput>(() => game ? { ...game } : { name: '', englishName: '', description: '', iconUrl: '', bannerUrl: '', sortOrder: 0, enabled: true })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const set = <K extends keyof GameSectionInput>(key: K, value: GameSectionInput[K]) => setForm(previous => ({ ...previous, [key]: value }))
  return <form className="space-y-4 rounded-xl bg-white p-5 shadow-sm" onSubmit={async event => {
    event.preventDefault(); setSaving(true)
    try { const id = await saveGameSection(form, game?.id); await onSaved(typeof id === 'string' ? id : game?.id); toast('版区已保存') }
    catch (error) { toast(error instanceof Error ? error.message : '保存失败', 'error') }
    finally { setSaving(false) }
  }}>
    <h2 className="text-lg font-bold">{game ? '编辑游戏版区' : '新增游戏版区'}</h2>
    <Input label="版区名称" required maxLength={64} value={form.name} onChange={event => set('name', event.target.value)} />
    <Input label="英文名称" maxLength={128} value={form.englishName} onChange={event => set('englishName', event.target.value)} />
    <Textarea label="简介" maxLength={1000} value={form.description} onChange={event => set('description', event.target.value)} />
    <ImageField label="版区图标" value={form.iconUrl} onChange={value => set('iconUrl', value)} onBusy={busy => setUploading(previous => ({ ...previous, icon: busy }))} />
    <ImageField label="默认横幅" value={form.bannerUrl} onChange={value => set('bannerUrl', value)} onBusy={busy => setUploading(previous => ({ ...previous, banner: busy }))} />
    <Input label="排序（越小越靠前）" type="number" required min={0} max={1000000} value={form.sortOrder} onChange={event => set('sortOrder', Number(event.target.value))} />
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={event => set('enabled', event.target.checked)} />启用版区</label>
    <p className="text-xs text-text-secondary">停用后隐藏入口并禁止新发布，历史帖子保留。新游戏自动创建六个默认分区。</p>
    <Button type="submit" loading={saving} disabled={Object.values(uploading).some(Boolean)}>保存版区</Button>
  </form>
}

function BoardEditor({ gameId, board, defaultBanner, onSaved }: { gameId: string; board?: GameBoardSetting; defaultBanner: string; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<GameBoardInput>(() => board ? { ...board } : { name: '', description: '', iconKey: 'forum', iconUrl: '', bannerUrl: '', sortOrder: 70, enabled: true, publishPolicy: 'LOGIN' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const set = <K extends keyof GameBoardInput>(key: K, value: GameBoardInput[K]) => setForm(previous => ({ ...previous, [key]: value }))
  return <form className="space-y-4 rounded-xl border border-border bg-white p-5" onSubmit={async event => {
    event.preventDefault(); setSaving(true)
    try { await saveGameSectionBoard(gameId, form, board?.boardId); await onSaved(); toast('分区已保存') }
    catch (error) { toast(error instanceof Error ? error.message : '保存失败', 'error') }
    finally { setSaving(false) }
  }}>
    <h3 className="font-bold">{board ? '编辑分区' : '新增分区'}</h3>
    <Input label="分区名称" required maxLength={64} value={form.name} onChange={event => set('name', event.target.value)} />
    <Textarea label="简介" maxLength={2000} value={form.description} onChange={event => set('description', event.target.value)} />
    <label className="block text-sm">默认图标<select className="ml-3 rounded border border-border p-2" value={form.iconKey} onChange={event => set('iconKey', event.target.value as GameBoardInput['iconKey'])}>{Object.entries({ forum: '论坛', official: '官方', guide: '攻略', help: '互助', art: '同人', camera: '相机' }).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
    <ImageField label="自定义分区图标" value={form.iconUrl} onChange={value => set('iconUrl', value)} onBusy={busy => setUploading(previous => ({ ...previous, icon: busy }))} />
    <ImageField label="独立横幅" value={form.bannerUrl} onChange={value => set('bannerUrl', value)} onBusy={busy => setUploading(previous => ({ ...previous, banner: busy }))} />
    {!form.bannerUrl && defaultBanner && <div><p className="mb-2 text-xs text-text-secondary">当前使用游戏默认横幅</p><img src={defaultBanner} alt="默认横幅预览" className="max-h-40 max-w-full object-contain" /></div>}
    <Input label="排序（越小越靠前）" type="number" required min={0} max={1000000} value={form.sortOrder} onChange={event => set('sortOrder', Number(event.target.value))} />
    <label className="block text-sm">发布权限<select className="ml-3 rounded border border-border p-2" value={form.publishPolicy} onChange={event => set('publishPolicy', event.target.value as GameBoardInput['publishPolicy'])}><option value="LOGIN">登录用户</option><option value="ADMIN">仅管理员</option></select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={event => set('enabled', event.target.checked)} />启用分区</label>
    <Button type="submit" loading={saving} disabled={Object.values(uploading).some(Boolean)}>保存分区</Button>
  </form>
}

export function GameSectionsPage() {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string>()
  const [boardId, setBoardId] = useState<string>()
  const [editingBoard, setEditingBoard] = useState(false)
  const [revision, setRevision] = useState(0)
  const client = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-game-sections', page], queryFn: () => getGameSections(page) })
  const { data: selected, isLoading: selectedLoading, error: selectedError } = useQuery({ queryKey: ['admin-game-section', selectedId], queryFn: () => getGameSection(selectedId!), enabled: Boolean(selectedId) })
  const { data: boards, error: boardError } = useQuery({ queryKey: ['admin-game-section-boards', selectedId], queryFn: () => getGameSectionBoards(selectedId!), enabled: Boolean(selected) })
  async function refresh() {
    await Promise.all(['admin-game-sections', 'admin-game-section', 'admin-game-section-boards', 'games', 'game', 'boards', 'nav-game-sections', 'posts'].map(key => client.invalidateQueries({ queryKey: [key] })))
    setRevision(previous => previous + 1)
  }
  return <div>
    <h1 className="text-2xl font-bold">版区管理</h1>
    <p className="mt-2 text-sm text-text-secondary">管理游戏、内部分区和展示图片，保存后前台生效。</p>
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <Button onClick={() => { setSelectedId(undefined); setEditingBoard(false); setRevision(value => value + 1) }}>新增游戏版区</Button>
        {isLoading && <p>正在加载…</p>}{error && <p className="text-red-600">{error.message}</p>}
        {data?.records.map(game => <button key={game.id} type="button" onClick={() => { setSelectedId(game.id); setEditingBoard(false) }} className={`flex w-full items-center gap-2 rounded-lg p-3 text-left ${game.id === selectedId ? 'bg-primary/10' : 'hover:bg-muted'}`}>{game.iconUrl && <img src={game.iconUrl} alt="" className="h-8 w-8 rounded object-contain" />}<span>{game.name}<small className="ml-2 text-text-secondary">{game.enabled ? '启用' : '停用'}</small></span></button>)}
        <Pagination page={page} size={20} total={data?.total || 0} onChange={value => { setPage(value); setSelectedId(undefined); setEditingBoard(false) }} />
      </section>
      <div className="space-y-5">
        {selectedLoading ? <p>正在加载版区…</p> : selectedError ? <p className="text-red-600">{selectedError.message}</p> : <GameEditor key={`${selectedId || 'new'}-${revision}`} game={selected} onSaved={async id => { await refresh(); if (id) setSelectedId(id) }} />}
        {selected && <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{selected.name} · 分区</h2><Button size="sm" onClick={() => { setBoardId(undefined); setEditingBoard(true); setRevision(value => value + 1) }}>新增分区</Button></div>
          {boardError && <p className="text-red-600">{boardError.message}</p>}
          <div className="divide-y divide-border">{boards?.map(board => <div key={board.boardId} className="flex items-center justify-between gap-3 py-3"><div><b>{board.name}</b><span className="ml-3 text-xs text-text-secondary">排序 {board.sortOrder} · {board.enabled ? '启用' : '停用'} · {board.publishPolicy === 'ADMIN' ? '仅管理员' : '登录用户'}</span></div><Button size="sm" variant="ghost" onClick={() => { setBoardId(board.boardId); setEditingBoard(true) }}>编辑</Button></div>)}</div>
          {editingBoard && <BoardEditor key={`${selected.id}-${boardId || 'new'}-${revision}`} gameId={selected.id} board={boards?.find(board => board.boardId === boardId)} defaultBanner={selected.bannerUrl} onSaved={async () => { await refresh(); setEditingBoard(false) }} />}
        </section>}
      </div>
    </div>
  </div>
}
