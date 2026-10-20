import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressRing } from './components/ProgressRing'
import { GlassButton } from './components/GlassButton'
import { IconButton } from './components/IconButton'
import { usePersistentBool } from './hooks/usePersistentBool'
import { spring } from './springs'
import { useTimer } from './timer/useTimer'
import { FOCUS_PER_SET, MODE_LABELS, type Mode, type Status } from './timer/machine'

// 苹果系统色:红(专注)/绿(短休)/蓝(长休)
const MODES: { id: Mode; color: string }[] = [
  { id: 'focus', color: '#FF453A' },
  { id: 'short', color: '#30D158' },
  { id: 'long', color: '#0A84FF' }
]

const START_LABEL: Record<Status, string> = { idle: '开始', running: '暂停', paused: '继续' }

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

// 顶栏线性图标:跟随文字颜色,线宽统一
function Icon({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

function App(): React.JSX.Element {
  const { mode, status, text, progress, done, toggle, reset, selectMode } = useTimer()
  // 整个界面:完全不透明(0% 透明) / 半透明毛玻璃
  const [opaque, setOpaque] = usePersistentBool('opaque')
  const [pinned, setPinned] = usePersistentBool('pinned')
  const [dark, setDark] = useState(darkQuery.matches)
  const color = MODES.find((m) => m.id === mode)!.color

  // 置顶:改变后同步给主进程(启动时也会发一次,恢复上次的设置);托盘菜单改变时同步回来
  useEffect(() => window.api.pin(pinned), [pinned])
  useEffect(() => window.api.onPinned(setPinned), [setPinned])

  // 深浅色:主进程的 themeSource 决定 prefers-color-scheme,界面只负责跟随
  useEffect(() => {
    const sync = (): void => {
      setDark(darkQuery.matches)
      document.documentElement.classList.toggle('dark', darkQuery.matches)
    }
    sync()
    darkQuery.addEventListener('change', sync)
    return () => darkQuery.removeEventListener('change', sync)
  }, [])

  const bg = opaque ? 'bg-[#f5f5f7] dark:bg-[#1c1c1e]' : 'bg-[#f5f5f7]/85 dark:bg-[#1c1c1e]/85'

  return (
    <div className="h-full p-3 font-sans">
      {/* 毛玻璃卡片:大圆角 + 半透明底 + 内高光描边 + 柔和阴影 */}
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-[32px] ${bg} text-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:text-neutral-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08)]`}
      >
        {/* 背景色块:被上层半透明面板的 backdrop-blur 模糊,形成毛玻璃质感 */}
        <motion.div
          aria-hidden
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
        />

        {/* 顶栏:可拖动区域;左侧红黄绿灯,右侧置顶与主题切换 */}
        <div className="drag relative flex items-center justify-between px-5 pt-4">
          <div className="no-drag flex gap-2">
            <button onClick={() => window.api.close()} title="关闭(隐藏到托盘,计时继续)" aria-label="关闭" className="h-3 w-3 rounded-full bg-[#FF5F57] outline-none transition-transform hover:scale-125" />
            <button onClick={() => window.api.minimize()} title="最小化" aria-label="最小化" className="h-3 w-3 rounded-full bg-[#FEBC2E] outline-none transition-transform hover:scale-125" />
            {/* 绿灯:切换界面 完全不透明 / 半透明。实心=不透明,淡色=半透明 */}
            <button
              onClick={() => setOpaque((v) => !v)}
              title={opaque ? '当前:不透明(点击切换为半透明)' : '当前:半透明(点击切换为不透明)'}
              aria-label="切换不透明/半透明"
              className="h-3 w-3 rounded-full bg-[#28C840] outline-none transition-all hover:scale-125"
              style={{ opacity: opaque ? 1 : 0.4 }}
            />
          </div>
          <div className="no-drag flex items-center gap-3">
            <IconButton onClick={() => setPinned((v) => !v)} title={pinned ? '取消置顶' : '窗口置顶'} dim={!pinned}>
              <Icon>
                <path d="M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7" />
              </Icon>
            </IconButton>
            <IconButton onClick={() => window.api.setTheme(dark ? 'light' : 'dark')} title="切换深色/浅色">
              <Icon>
                {dark ? (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
                  </>
                ) : (
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
                )}
              </Icon>
            </IconButton>
          </div>
        </div>

        {/* 模式分段控件:滑动高亮块 */}
        <div className="relative px-6 pt-4">
          <div className="no-drag relative flex rounded-full bg-white/40 p-1 backdrop-blur-2xl dark:bg-white/10">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => selectMode(m.id)} className="relative z-10 flex-1 rounded-full py-1.5 text-sm font-medium outline-none">
                {mode === m.id && (
                  <motion.span layoutId="seg" transition={spring} className="absolute inset-0 -z-10 rounded-full bg-white shadow-md dark:bg-white/20" />
                )}
                <span className={mode === m.id ? '' : 'opacity-60'}>{MODE_LABELS[m.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 主视觉:环形进度 + 倒计时 */}
        <div className="relative flex flex-1 items-center justify-center">
          <ProgressRing progress={progress} color={color}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={spring}
                className="text-center"
              >
                <div className="text-[60px] font-extralight leading-none tracking-tighter tabular-nums">{text}</div>
                <div className="mt-2 text-sm opacity-60">{MODE_LABELS[mode]}</div>
                {/* 本组专注的完成进度 */}
                <div className="mt-3 flex justify-center gap-1.5">
                  {Array.from({ length: FOCUS_PER_SET }, (_, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full transition-colors"
                      style={{ backgroundColor: i < done ? color : 'rgba(128,128,128,0.3)' }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </ProgressRing>
        </div>

        {/* 控制:重置 + 开始/暂停 */}
        <div className="relative flex items-center justify-center gap-4 pb-9">
          <GlassButton onClick={reset}>重置</GlassButton>
          <GlassButton color={color} onClick={toggle}>
            {START_LABEL[status]}
          </GlassButton>
        </div>
      </div>
    </div>
  )
}

export default App
