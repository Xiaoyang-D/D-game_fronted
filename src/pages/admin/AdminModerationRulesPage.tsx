import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createModerationRule, deleteModerationRule, getModerationRules, importModerationRules, updateModerationRule } from '@/api/moderation'
import type { ModerationRuleInput } from '@/api/moderation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/ui/Pagination'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/Toast'
import type { Id, ModerationRule } from '@/types/api'

const emptyRule: ModerationRuleInput = { word: '', category: '通用', enabled: true }

export function AdminModerationRulesPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [enabled, setEnabled] = useState('')
  const [filters, setFilters] = useState({ keyword: '', category: '', enabled: '' })
  const [editingId, setEditingId] = useState<Id | null>(null)
  const [form, setForm] = useState<ModerationRuleInput>({ ...emptyRule })
  const [importText, setImportText] = useState('')
  const [importCategory, setImportCategory] = useState('通用')
  const [selectedIds, setSelectedIds] = useState<Id[]>([])
  const client = useQueryClient()
  const { toast } = useToast()
  const query = useQuery({ queryKey: ['admin', 'moderation-rules', page, filters], queryFn: () => getModerationRules({ page, size: 20, keyword: filters.keyword || undefined, category: filters.category || undefined, enabled: filters.enabled ? filters.enabled === 'true' : undefined }), staleTime: 0 })
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['admin', 'moderation-rules'] })
    const refreshed = client.getQueryData<typeof query.data>(['admin', 'moderation-rules', page, filters])
    if (page > 1 && refreshed && !refreshed.records.length) { setPage(current => current - 1); setSelectedIds([]) }
  }
  const save = useMutation({
    mutationFn: () => { const payload = { ...form, word: form.word.trim(), category: form.category.trim() }; return editingId ? updateModerationRule(editingId, payload) : createModerationRule(payload) },
    onSuccess: async () => { toast('规则已保存并生效'); setEditingId(null); setForm({ ...emptyRule }); await refresh() },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  const remove = useMutation({ mutationFn: deleteModerationRule, onSuccess: async () => { toast('规则已删除并生效'); await refresh() }, onError: (error: Error) => toast(error.message, 'error') })
  const toggle = useMutation({ mutationFn: (rule: ModerationRule) => updateModerationRule(rule.id, { word: rule.word, category: rule.category, enabled: !rule.enabled }), onSuccess: refresh, onError: (error: Error) => toast(error.message, 'error') })
  const importRules = useMutation({
    mutationFn: () => importModerationRules({ text: importText, category: importCategory.trim() }),
    onSuccess: async result => { toast(`导入 ${result.imported} 条，跳过 ${result.skipped} 条`); setImportText(''); await refresh() },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  const batchToggle = useMutation({
    mutationFn: (enabled: boolean) => Promise.allSettled((query.data?.records || []).filter(rule => selectedIds.includes(rule.id)).map(rule => updateModerationRule(rule.id, { word: rule.word, category: rule.category, enabled }))),
    onSuccess: async results => {
      const failures = results.filter(result => result.status === 'rejected').length
      toast(failures ? `已更新 ${results.length - failures} 条，${failures} 条失败，请重试` : `已更新 ${results.length} 条并立即生效`, failures ? 'error' : undefined)
      setSelectedIds([])
      await refresh()
    },
  })
  const busy = save.isPending || remove.isPending || toggle.isPending || importRules.isPending || batchToggle.isPending
  return <div>
    <datalist id="moderation-rule-categories">{["色情", "广告", "暴恐"].map(value => <option key={value} value={value} />)}</datalist>
    <h1 className="text-2xl font-bold">审核规则词</h1><p className="mt-1 text-sm text-text-secondary">规则修改后立即用于新提交和定时发布复检。历史公开内容不会自动回审。</p>
    <Card className="mt-6"><form onSubmit={event => { event.preventDefault(); setFilters({ keyword: keyword.trim(), category: category.trim(), enabled }); setPage(1); setSelectedIds([]) }} className="grid gap-3 sm:grid-cols-4"><Input label="搜索词" value={keyword} onChange={event => setKeyword(event.target.value)} /><Input label="分类" list="moderation-rule-categories" value={category} onChange={event => setCategory(event.target.value)} /><Select label="状态" value={enabled} onChange={event => setEnabled(event.target.value)} options={[{ value: '', label: '全部' }, { value: 'true', label: '启用' }, { value: 'false', label: '停用' }]} /><Button className="self-end" type="submit">筛选</Button></form></Card>
    <Card className="mt-5"><h2 className="mb-4 font-bold">{editingId ? '编辑规则' : '添加规则'}</h2><form onSubmit={event => { event.preventDefault(); if (form.word.trim() && form.category.trim()) save.mutate() }} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
      <Input label="规则词" required maxLength={200} value={form.word} onChange={event => setForm(current => ({ ...current, word: event.target.value }))} /><Input label="分类" list="moderation-rule-categories" required maxLength={64} value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))} />启用</label><div className="flex gap-2"><Button type="submit" loading={save.isPending} disabled={busy || !form.word.trim() || !form.category.trim()}>保存</Button>{editingId && <Button type="button" variant="ghost" disabled={busy} onClick={() => { setEditingId(null); setForm({ ...emptyRule }) }}>取消</Button>}</div>
    </form></Card>
    {query.isPending ? <Loading /> : query.isError ? <p className="mt-5 text-red-600">{query.error.message}<button className="ml-3 underline" onClick={() => void query.refetch()}>重试</button></p> : !query.data.records.length ? <Empty title="暂无规则" /> : <>
      <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-sm text-text-secondary">已选 {selectedIds.length} 条</span><Button size="sm" variant="outline" disabled={busy || !selectedIds.length} onClick={() => batchToggle.mutate(true)}>批量启用</Button><Button size="sm" variant="outline" disabled={busy || !selectedIds.length} onClick={() => batchToggle.mutate(false)}>批量停用</Button></div>
      <Card className="mt-3 overflow-x-auto p-0"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr><th className="px-4 py-3"><input type="checkbox" aria-label="选择本页全部规则" disabled={busy} checked={query.data.records.length > 0 && query.data.records.every(rule => selectedIds.includes(rule.id))} onChange={event => setSelectedIds(event.target.checked ? query.data.records.map(rule => rule.id) : [])} /></th>{['规则词', '分类', '状态', '操作'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{query.data.records.map(rule => <tr key={rule.id} className="border-t border-border"><td className="px-4 py-3"><input type="checkbox" aria-label={`选择规则 ${rule.word}`} disabled={busy} checked={selectedIds.includes(rule.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, rule.id] : current.filter(id => id !== rule.id))} /></td><td className="max-w-64 break-words px-4 py-3">{rule.word}</td><td className="px-4 py-3">{rule.category}</td><td className="px-4 py-3">{rule.enabled ? '启用' : '停用'}</td><td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditingId(rule.id); setForm({ word: rule.word, category: rule.category, enabled: rule.enabled }) }}>编辑</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => toggle.mutate(rule)}>{rule.enabled ? '停用' : '启用'}</Button><Button size="sm" variant="danger" disabled={busy} onClick={() => { if (window.confirm(`确定删除规则词「${rule.word}」吗？`)) remove.mutate(rule.id) }}>删除</Button></div></td></tr>)}</tbody></table></Card><Pagination page={page} size={20} total={query.data.total} onChange={next => { setPage(next); setSelectedIds([]) }} />
    </>}
    <Card className="mt-5"><h2 className="mb-4 font-bold">批量导入</h2><Input label="导入分类" list="moderation-rule-categories" maxLength={64} value={importCategory} onChange={event => setImportCategory(event.target.value)} /><Textarea label="规则词（每行一个）" className="mt-4" rows={6} value={importText} onChange={event => setImportText(event.target.value)} /><Button className="mt-4" loading={importRules.isPending} disabled={busy || !importText.trim() || !importCategory.trim()} onClick={() => importRules.mutate()}>导入并生效</Button></Card>
  </div>
}
