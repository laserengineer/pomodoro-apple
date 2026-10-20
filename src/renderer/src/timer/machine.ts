// 计时器状态机(纯函数,不依赖 React,方便测试)
//
//            START              PAUSE
//   idle ─────────────▶ running ─────────▶ paused
//     ▲  ◀──── RESET ────┘  │ ▲  ◀─ START ──┘
//     │                     │ └── RESET(任意状态回到 idle)
//     └── 时间到(TICK)自动切到下一模式,并回到 idle,等用户再点开始
//
// 模式流转:专注 ─▶ 短休 ─▶ 专注 ─▶ … 每完成 4 个专注后进入一次长休,长休结束后重新计数。

export type Mode = 'focus' | 'short' | 'long'
export type Status = 'idle' | 'running' | 'paused'

export const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60 * 1000,
  short: 5 * 60 * 1000,
  long: 15 * 60 * 1000
}
export const MODE_LABELS: Record<Mode, string> = { focus: '专注', short: '短休', long: '长休' }
export const FOCUS_PER_SET = 4

export interface TimerState {
  mode: Mode
  status: Status
  remaining: number // 剩余毫秒
  endAt: number | null // 运行中:预计结束的时间戳。用时间戳而不是每秒减 1,切到后台也不会走慢
  done: number // 当前这一组已完成的专注数(0~4)
  finished: number // 累计「时间到」次数,界面据此触发提示音
}

export type Action =
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESET' }
  | { type: 'SELECT_MODE'; mode: Mode }
  | { type: 'TICK'; now: number }

export const initialState: TimerState = {
  mode: 'focus',
  status: 'idle',
  remaining: DURATIONS.focus,
  endAt: null,
  done: 0,
  finished: 0
}

function idleOf(state: TimerState, mode: Mode, patch: Partial<TimerState> = {}): TimerState {
  return { ...state, mode, status: 'idle', remaining: DURATIONS[mode], endAt: null, ...patch }
}

// 时间到之后下一个模式,以及更新后的组内计数
function next(state: TimerState): { mode: Mode; done: number } {
  if (state.mode === 'focus') {
    const done = state.done + 1
    return { mode: done >= FOCUS_PER_SET ? 'long' : 'short', done }
  }
  return { mode: 'focus', done: state.mode === 'long' ? 0 : state.done }
}

export function reducer(state: TimerState, action: Action): TimerState {
  switch (action.type) {
    case 'START':
      if (state.status === 'running') return state
      return { ...state, status: 'running', endAt: action.now + state.remaining }

    case 'PAUSE':
      if (state.status !== 'running' || state.endAt === null) return state
      return { ...state, status: 'paused', remaining: Math.max(0, state.endAt - action.now), endAt: null }

    case 'RESET':
      return idleOf(state, state.mode)

    case 'SELECT_MODE':
      return idleOf(state, action.mode)

    case 'TICK': {
      if (state.status !== 'running' || state.endAt === null) return state
      const remaining = state.endAt - action.now
      if (remaining > 0) {
        // 界面只显示到秒:同一秒内不产生新状态,避免每 200ms 重绘一次
        return Math.ceil(remaining / 1000) === Math.ceil(state.remaining / 1000) ? state : { ...state, remaining }
      }
      const n = next(state)
      return idleOf(state, n.mode, { done: n.done, finished: state.finished + 1 })
    }
  }
}
