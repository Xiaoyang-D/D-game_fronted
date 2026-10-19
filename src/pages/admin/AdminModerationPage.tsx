import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditModeration, getModerationSubmission, getModerationSubmissions } from '@/api/moderation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { canApproveModeration, moderationSnapshotText, moderationStatusLabel } from '@/lib/moderation'
import { formatDateTime } from '@/lib/utils'
import type { Id, ModerationStatus, ModerationTarget } from '@/types/api'

const targetLabels = { POST: '帖子', COMMENT: '评论 / 回复', BIO: '个人简介' }

function Snapshot({ json, targetType }: { json: string | null; targetType: ModerationTarget }) {
  if (!json) return <p className="text-sm text-text-secondary">尚无公开版本</p>
  const value = moderationSnapshotText(json, targetType)
  return <div className="max-h-[420px] overflow-auto rounded-lg bg-muted/40 p-4 text-sm leading-7">
    {value.title && <h3 className="mb-3 font-bold">{value.title}</h3>}
    <p className="whitespace-pre-wrap break-words">{value.body}</p>
  </div>
}

export function AdminModerationPage() {
  const [params, setParams] = useSearchParams()
  const initialTarget = params.get('targetType')
  const [targetType, setTargetType] = useState<ModerationTarget | ''>(initialTarget && initialTarget in targetLabels ? initialTarget as ModerationTarget : '')
  const [status, setStatus] = useState<ModerationStatus | ''>('PENDING')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<Id | null>(null)
  const [reason, setReason] = useState('')
  const client = useQueryClient()
  const { toast } = useToast()
  const query = useQuery({ queryKey: ['admin', 'moderation', page, targetType, status], queryFn: () => getModerationSubmissions({ page, size: 10, targetType: targetType || undefined, status: status || undefined }), staleTime: 0 })
  const detail = useQuery({ queryKey: ['admin', 'moderation-detail', selectedId], queryFn: () => getModerationSubmission(selectedId!), enabled: Boolean(selectedId), staleTime: 0 })
  const audit = useMutation({
    mutationFn: (approved: boolean) => auditModeration(selectedId!, { approved, reason: reason.trim(), ruleVersion: detail.data!.currentRuleVersion }),
    onSuccess: async (_result, approved) => {
      toast(approved ? '审核已通过，已通知作者' : '已拒绝该提交，已通知作者')
      setSelectedId(null)
      setReason('')
      await client.invalidateQueries()
    },
    onError: async (error: Error) => { toast(error.message, 'error'); await detail.refetch() },
  })
  const submit = (approved: boolean) => {
    if (approved && !canApproveModeration(detail.data)) { toast('自动检查暂不可用，请稍后再通过', 'error'); return }
    if (!approved && !reason.trim()) { toast('拒绝时请填写原因，将通知作者', 'error'); return }
    if (reason.trim().length > 500) { toast('审核理由不能超过 500 字', 'error'); return }
    audit.mutate(approved)
  }
  const choose = (id: Id) => { setSelectedId(id); setReason('') }
  return <div>
    <h1 className="text-2xl font-bold text-text">内容审核</h1>
    <p className="mt-1 text-sm text-text-secondary">审核命中规则的帖子、评论、回复与个人简介。审批针对本次提交的内容。</p>
    <Card className="mt-6"><div className="grid gap-4 sm:grid-cols-2">
      <Select label="内容类型" value={targetType} onChange={event => { const value = event.target.value as ModerationTarget | ''; setTargetType(value); setPage(1); setSelectedId(null); setParams(value ? { targetType: value } : {}) }} options={[{ value: '', label: '全部类型' }, ...Object.entries(targetLabels).map(([value, label]) => ({ value, label }))]} />
      <Select label="审核状态" value={status} onChange={event => { setStatus(event.target.value as ModerationStatus | ''); setPage(1); setSelectedId(null) }} options={[{ value: '', label: '全部状态' }, ...(['PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'CANCELLED'] as const).map(value => ({ value, label: moderationStatusLabel(value) }))]} />
    </div></Card>
    {query.isPending ? <Loading /> : query.isError ? <p role="alert" className="mt-5 text-red-600">{query.error.message}<button className="ml-3 underline" onClick={() => void query.refetch()}>重试</button></p> : !query.data.records.length ? <Empty title="暂无相关审核记录" /> : <>
      <Card className="mt-5 overflow-x-auto p-0"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr>{['类型', '内容 ID', '提交时间', '状态', '规则命中', '操作'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{query.data.records.map(item => <tr key={item.submissionId} className="border-t border-border">
        <td className="px-4 py-3">{targetLabels[item.targetType]}</td><td className="px-4 py-3">{item.targetId}</td><td className="whitespace-nowrap px-4 py-3">{formatDateTime(item.submittedAt)}</td><td className="px-4 py-3">{moderationStatusLabel(item.status)}</td><td className="max-w-64 break-words px-4 py-3">{item.matchedWords?.join('、') || '无'}</td><td className="px-4 py-3"><Button size="sm" variant="outline" onClick={() => choose(item.submissionId)}>查看提交</Button></td>
      </tr>)}</tbody></table></Card><Pagination page={page} size={10} total={query.data.total} onChange={setPage} />
    </>}
    {selectedId && <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">审核详情</h2><Button variant="ghost" size="sm" disabled={audit.isPending} onClick={() => setSelectedId(null)}>关闭</Button></div>
      {detail.isPending ? <Loading /> : detail.isError ? <p className="text-red-600">{detail.error.message}<button className="ml-3 underline" onClick={() => void detail.refetch()}>重新加载</button></p> : detail.data && <>
        <div className="mb-5 space-y-2 text-sm text-text-secondary"><p>{targetLabels[detail.data.targetType]} · {moderationStatusLabel(detail.data.status)} · 提交 ID：{detail.data.submissionId}</p><p>作者：<Link className="text-primary underline" to={`/users/${detail.data.authorId}`}>{detail.data.authorId}</Link></p><p>提交时命中：{detail.data.matchedWords?.join('、') || '无'}（规则版本 {detail.data.ruleVersion}）</p><p>当前规则命中：{detail.data.currentMatchedWords?.join('、') || '无'}（规则版本 {detail.data.currentRuleVersion}）</p>{detail.data.reviewedAt && <p>审核时间：{formatDateTime(detail.data.reviewedAt)}</p>}{detail.data.reason && <p className="whitespace-pre-wrap">审核理由：{detail.data.reason}</p>}</div>
        {detail.data.checkUnavailable && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">自动检查暂不可用，请稍后再通过；仍可查看提交内容或拒绝本次提交。<button className="ml-3 underline" disabled={detail.isFetching} onClick={() => void detail.refetch()}>重新检查</button></p>}
        <div className="grid gap-5 xl:grid-cols-2"><section><h3 className="mb-2 font-semibold">本次提交内容</h3><Snapshot json={detail.data.candidateJson} targetType={detail.data.targetType} /></section><section><h3 className="mb-2 font-semibold">当前公开版本</h3><Snapshot json={detail.data.publicSnapshotJson} targetType={detail.data.targetType} /></section></div>
        {detail.data.status === 'PENDING' ? <div className="mt-5"><Textarea label="审核备注（拒绝时必填，将通知作者）" rows={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /><div className="mt-4 flex gap-3"><Button loading={audit.isPending} disabled={!canApproveModeration(detail.data)} onClick={() => submit(true)}>通过本次提交</Button><Button variant="danger" loading={audit.isPending} disabled={!reason.trim()} onClick={() => submit(false)}>拒绝本次提交</Button></div></div> : <p className="mt-5 text-sm text-text-secondary">该提交已结束处理。</p>}
      </>}
    </Card>}
  </div>
}
