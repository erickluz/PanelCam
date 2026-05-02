const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  checkGo2RtcHealth: (baseUrl: string) => ipcRenderer.invoke('go2rtc:health', baseUrl),
  getGo2RtcStatus: () => ipcRenderer.invoke('go2rtc:status'),
  configureGo2RtcStreams: (streams: Array<{ streamName: string; rtspUrl: string }>) =>
    ipcRenderer.invoke('go2rtc:configure-streams', streams)
});
