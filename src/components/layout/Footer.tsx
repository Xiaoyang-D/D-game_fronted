import { Gamepad2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-transparent">
      <div className="mx-auto flex max-w-[1190px] flex-col items-center gap-2 px-4 py-8 text-center sm:px-0">
        <div className="flex items-center gap-2 text-text-secondary">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">D-Game 游戏社区</span>
        </div>
        <p className="text-xs text-text-secondary">
          发现好游戏，分享游戏心得，与玩家一起成长。
        </p>
      </div>
    </footer>
  )
}
