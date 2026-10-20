import { useEffect, useReducer } from 'react'
import { DURATIONS, MODE_LABELS, initialState, reducer, type Mode, type TimerState } from './machine'

const fmt = (ms: number): string => {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// 整个应用复用同一个 AudioContext,避免每次响铃都新建一个而不释放
let audio: AudioContext | undefined

// 两声短促的提示音(WebAudio 合成,不需要音频文件)
function beep(): void {
  try {
    audio ??= new AudioContext()
    const ac = audio
    ;[0, 0.28].forEach((t) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.frequency.value = 880
      o.connect(g)
      g.connect(ac.destination)
      g.gain.setValueAtTime(0.15, ac.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.22)
      o.start(ac.currentTime + t)
      o.stop(ac.currentTime + t + 0.22)
    })
  } catch {
    // 音频不可用时静默忽略
  }
}

export function useTimer(): TimerState & {
  text: string
  progress: number
  toggle: () => void
  reset: () => void
  selectMode: (mode: Mode) => void
} {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { status, mode, remaining, finished } = state

  // 运行时每 200ms 校准一次;时间由 endAt 时间戳算出,间隔大小只影响刷新频率
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 200)
    return () => clearInterval(id)
  }, [status])

  // 时间到:响铃
  useEffect(() => {
    if (finished > 0) beep()
  }, [finished])

  const text = fmt(remaining)

  // 把状态同步到界面之外:任务栏窗口标题 + 系统托盘悬停提示
  useEffect(() => {
    const running = status === 'running'
    document.title = running ? `${text} · 番茄钟` : '番茄钟'
    window.api.updateTray(running ? `${text} · ${MODE_LABELS[mode]}` : '番茄钟')
  }, [text, status, mode])

  return {
    ...state,
    text,
    progress: 1 - remaining / DURATIONS[mode], // 已走过的比例 0~1
    toggle: () => dispatch({ type: status === 'running' ? 'PAUSE' : 'START', now: Date.now() }),
    reset: () => dispatch({ type: 'RESET' }),
    selectMode: (m) => dispatch({ type: 'SELECT_MODE', mode: m })
  }
}
