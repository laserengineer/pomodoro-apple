import { motion } from 'framer-motion'
import { tapSpring } from '../springs'

interface Props {
  children: React.ReactNode
  onClick: () => void
  title: string
  dim?: boolean // 关闭状态时变淡
}

// 顶栏图标按钮:悬停放大、按下收缩的弹性动画
export function IconButton({ children, onClick, title, dim }: Props): React.JSX.Element {
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      transition={tapSpring}
      onClick={onClick}
      title={title}
      className="text-lg outline-none"
      style={{ opacity: dim ? 0.4 : 1 }}
    >
      {children}
    </motion.button>
  )
}
