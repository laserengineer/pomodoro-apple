import { motion } from 'framer-motion'

interface Props {
  progress: number // 0~1,已走过的比例
  color: string
  children: React.ReactNode
}

const SIZE = 240
const STROKE = 10
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
const circle = { cx: SIZE / 2, cy: SIZE / 2, r: R, fill: 'none', strokeWidth: STROKE } as const

// 环形进度条:底轨 + 带圆头的进度弧,进度变化用弹簧动画
export function ProgressRing({ progress, color, children }: Props): React.JSX.Element {
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle {...circle} className="stroke-black/10 dark:stroke-white/10" />
        <motion.circle
          {...circle}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - progress), stroke: color }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
