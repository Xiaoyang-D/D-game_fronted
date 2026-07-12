import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { doCheckIn, getCheckInStatus } from '@/api/checkIn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

export function CheckInCard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['checkIn', 'status'],
    queryFn: getCheckInStatus,
  })

  const checkInMutation = useMutation({
    mutationFn: doCheckIn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checkIn', 'status'] })
      toast(`签到成功！已连续签到 ${result.streakDays} 天`)
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : '签到失败', 'error')
    },
  })

  if (isLoading) {
    return (
      <Card>
        <Loading text="加载签到状态..." />
      </Card>
    )
  }

  const checkedInToday = status?.checkedInToday ?? false
  const streakDays = status?.streakDays ?? 0

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-text">每日签到</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              已连续签到 <span className="font-medium text-primary">{streakDays}</span> 天
            </p>
          </div>
        </div>
        <Button
          onClick={() => checkInMutation.mutate()}
          loading={checkInMutation.isPending}
          disabled={checkedInToday}
          variant={checkedInToday ? 'outline' : 'primary'}
        >
          {checkedInToday ? '今日已签到' : '立即签到'}
        </Button>
      </div>
    </Card>
  )
}
