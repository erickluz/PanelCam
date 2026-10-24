const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  checkGo2RtcHealth: (baseUrl: string) => ipcRenderer.invoke('go2rtc:health', baseUrl),
  getGo2RtcStatus: () => ipcRenderer.invoke('go2rtc:status'),
  configureGo2RtcStreams: (streams: Array<{
    id?: string;
    name?: string;
    rtspUrl: string;
    streamName: string;
    createdAt?: string;
  }>) =>
    ipcRenderer.invoke('go2rtc:configure-streams', streams),
  loadCameras: () => ipcRenderer.invoke('cameras:load'),
  saveCameras: (cameras: Array<{
    id: string;
    name: string;
    rtspUrl: string;
    streamName: string;
    createdAt: string;
  }>) => ipcRenderer.invoke('cameras:save', cameras),
  getCameraStoreStatus: () => ipcRenderer.invoke('cameras:status')
});
