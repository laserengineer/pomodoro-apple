import { app, shell, BrowserWindow, ipcMain, nativeImage, nativeTheme, Menu, Tray } from 'electron'
import type { Theme } from '../preload'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let quitting = false // 区分「点关闭隐藏到托盘」和「托盘菜单里真的退出」
let pinned = false // 窗口是否置顶

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 364,
    height: 544,
    show: false,
    frame: false, // 无边框
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: true, // 透明窗口:圆角和毛玻璃全部交给 CSS 绘制
    hasShadow: false, // 系统阴影在透明窗口上会画出方框,改用 CSS 阴影
    title: '番茄钟',
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // 关闭 = 隐藏到托盘,计时继续在后台运行;只有真正退出时才放行
  mainWindow.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

// notify:托盘菜单触发时要通知界面同步图钉;界面自己发起的不需要回传
function setPinned(v: boolean, notify = false): void {
  if (v === pinned) return
  pinned = v
  // 'floating' 层级:盖在普通窗口之上;macOS 上还让它跟随所有桌面空间
  mainWindow?.setAlwaysOnTop(v, 'floating')
  if (notify) mainWindow?.webContents.send('win:pinned', v)
  buildTrayMenu()
}

function buildTrayMenu(): void {
  tray?.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示窗口', click: showWindow },
      { label: '窗口置顶', type: 'checkbox', checked: pinned, click: (item) => setPinned(item.checked, true) },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          quitting = true
          app.quit()
        }
      }
    ])
  )
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('番茄钟')
  buildTrayMenu()
  // 左键点击:窗口可见就隐藏,否则显示
  tray.on('click', () => (mainWindow?.isVisible() ? mainWindow.hide() : showWindow()))
}

// 只允许运行一个实例;再次启动时唤起已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.pomodoro.apple')

    // 默认深色,不再跟随系统;仍可用界面右上角的按钮临时切换
    nativeTheme.themeSource = 'dark'

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // ---- 渲染进程发来的请求 ----
    ipcMain.on('win:close', () => mainWindow?.close()) // 实际是隐藏到托盘
    ipcMain.on('win:minimize', () => mainWindow?.minimize())
    ipcMain.on('win:pin', (_, v: boolean) => setPinned(v))
    // 倒计时显示在托盘:悬停提示;macOS 菜单栏旁直接显示文字
    ipcMain.on('tray:update', (_, text: string) => {
      tray?.setToolTip(text)
      if (process.platform === 'darwin') tray?.setTitle(text)
    })
    // 深色/浅色切换
    // 界面通过 prefers-color-scheme 跟随 themeSource,所以只需设置这一处
    ipcMain.on('theme:set', (_, t: Theme) => {
      nativeTheme.themeSource = t
    })

    createWindow()
    createTray()

    app.on('activate', showWindow)
  })

  app.on('before-quit', () => {
    quitting = true
  })
}
