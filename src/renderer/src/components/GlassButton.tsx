import { motion } from 'framer-motion'
import { tapSpring } from '../springs'

interface Props {
  children: React.ReactNode
  onClick: () => void
  color?: string // 传入颜色即为主按钮(实心),否则是半透明次按钮
}

// iOS 风格弹性按钮:悬停轻微放大,按下收缩,松开回弹
export function GlassButton({ children, onClick, color }: Props): React.JSX.Element {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={tapSpring}
      style={color ? { backgroundColor: color } : undefined}
      className={`rounded-full py-3 text-[15px] font-medium outline-none ${
        color
          ? 'px-9 text-white shadow-lg'
          : 'bg-white/50 px-6 text-neutral-800 shadow-sm backdrop-blur-2xl dark:bg-white/10 dark:text-neutral-100'
      }`}
    >
      {children}
    </motion.button>
  )
}
