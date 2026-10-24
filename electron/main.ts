import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureCameraStoreFile,
  getCameraStoreStatus,
  loadCamerasFromUserData,
  saveCamerasToUserData
} from './cameraStore.js';
import {
  checkGo2RtcHealth,
  configureGo2RtcStreams,
  getGo2RtcStatus,
  startGo2Rtc,
  stopGo2Rtc
} from './go2rtcManager.js';
import { loadWindowState, trackWindowState } from './windowStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
app.setName('CamPanel');

function getWindowIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.png');
  }

  return path.join(app.getAppPath(), 'resources', 'icon.png');
}

ipcMain.handle('go2rtc:health', async (_event, baseUrl: string) => {
  return baseUrl === 'http://127.0.0.1:1984'
    ? checkGo2RtcHealth()
    : fetch(`${baseUrl.replace(/\/$/, '')}/api/streams`, { cache: 'no-store' })
        .then((response) => response.ok)
        .catch(() => false);
});

ipcMain.handle('go2rtc:status', () => getGo2RtcStatus());
ipcMain.handle('go2rtc:configure-streams', (_event, cameras) => {
  saveCamerasToUserData(cameras);
  return configureGo2RtcStreams(
    cameras.map((camera: { streamName: string; rtspUrl: string }) => ({
      streamName: camera.streamName,
      rtspUrl: camera.rtspUrl
    }))
  );
});
ipcMain.handle('cameras:load', () => loadCamerasFromUserData());
ipcMain.handle('cameras:save', (_event, cameras) => saveCamerasToUserData(cameras));
ipcMain.handle('cameras:status', () => getCameraStoreStatus());

function createWindow() {
  const windowState = loadWindowState();

  const mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#06090e',
    title: 'CamPanel',
    icon: getWindowIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  trackWindowState(mainWindow);

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  app.setPath('userData', path.join(app.getPath('appData'), 'CamPanel'));
  ensureCameraStoreFile();
  createWindow();
  startGo2Rtc();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopGo2Rtc();
});
