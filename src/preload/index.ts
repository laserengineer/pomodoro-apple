import { contextBridge, ipcRenderer } from 'electron'

export type Theme = 'light' | 'dark' | 'system'

// 渲染进程能调用的全部主进程能力。新增接口只改这里,类型会自动同步到 window.api
const api = {
  close: (): void => ipcRenderer.send('win:close'),
  minimize: (): void => ipcRenderer.send('win:minimize'),
  pin: (v: boolean): void => ipcRenderer.send('win:pin', v),
  onPinned: (cb: (v: boolean) => void): (() => void) => {
    const h = (_: unknown, v: boolean): void => cb(v)
    ipcRenderer.on('win:pinned', h)
    return () => ipcRenderer.removeListener('win:pinned', h)
  },
  updateTray: (text: string): void => ipcRenderer.send('tray:update', text),
  setTheme: (t: Theme): void => ipcRenderer.send('theme:set', t)
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
