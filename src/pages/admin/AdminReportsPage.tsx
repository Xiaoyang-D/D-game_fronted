import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditReport, getPendingReports } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/utils'

export function AdminReportsPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const size = 10
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'reports', page], queryFn: () => getPendingReports({ page, size }) })
  const audit = async (id: string, handled: boolean) => {
    const note = window.prompt('处理备注（可选）') || undefined
    try {
      await auditReport(id, { handled, note })
      toast(handled ? '举报已处理' : '举报已忽略')
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
    } catch (error) { toast(error instanceof Error ? error.message : '操作失败', 'error') }
  }
  return <div><h1 className="text-2xl font-bold text-text">举报处理</h1>
    <p className="mt-1 text-sm text-text-secondary">待处理举报：{data?.total ?? 0}</p>
    <div className="mt-6">{isLoading ? <Loading /> : data?.records.length ? <>
      <div className="space-y-3">{data.records.map((report) => <Card key={report.id}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-text">目标 #{report.targetId}</p>
          <p className="mt-1 text-sm text-text-secondary">{report.reason}</p><p className="mt-2 text-xs text-text-secondary">举报人 #{report.reporterId} · {formatDateTime(report.gmtCreate)}</p></div>
          <div className="flex gap-2"><Button size="sm" onClick={() => audit(report.id, true)}>已处理</Button><Button size="sm" variant="outline" onClick={() => audit(report.id, false)}>忽略</Button></div></div>
      </Card>)}</div><Pagination page={page} size={size} total={data.total} onChange={setPage} /></> : <Empty title="暂无待处理举报" />}</div>
  </div>
}
