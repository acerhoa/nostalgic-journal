import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { IpcChannels } from '../shared/ipcChannels';

// Built by vite-plugin-electron: main + preload live in `dist-electron/`,
// while the renderer bundle is emitted to `out/`.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 600,
    minWidth: 1100,
    minHeight: 600,
    title: 'Nostalgic Journal',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security: keep Node out of the renderer and isolate the bridge.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links in the user's browser rather than inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // --- IPC handlers ---
  ipcMain.handle(IpcChannels.GET_APP_VERSION, () => app.getVersion());

  ipcMain.on(IpcChannels.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  ipcMain.on(IpcChannels.WINDOW_START_DRAG, () => {
    // Workaround: Electron doesn't have a native startDrag for frameless windows
    // We handle this via -webkit-app-region in CSS instead
  });

  ipcMain.handle(IpcChannels.WINDOW_GET_SIZE, () => {
    if (!mainWindow) return { width: 1100, height: 720 };
    const [width, height] = mainWindow.getSize();
    return { width, height };
  });

  ipcMain.handle(IpcChannels.WINDOW_SET_SIZE, (_event, width: number, height: number) => {
    if (!mainWindow) return;
    mainWindow.setSize(Math.round(width), Math.round(height));
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
