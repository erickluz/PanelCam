/// <reference types="vite/client" />

interface Window {
  desktopApp?: {
    platform: NodeJS.Platform;
    checkGo2RtcHealth?: (baseUrl: string) => Promise<boolean>;
    getGo2RtcStatus?: () => Promise<{
      running: boolean;
      binaryPath: string;
      configPath: string;
      message: string;
    }>;
    configureGo2RtcStreams?: (
      streams: Array<{
        id?: string;
        name?: string;
        rtspUrl: string;
        streamName: string;
        createdAt?: string;
      }>
    ) => Promise<{
      running: boolean;
      binaryPath: string;
      configPath: string;
      message: string;
    }>;
    loadCameras?: () => Promise<
      Array<{
        id: string;
        name: string;
        rtspUrl: string;
        streamName: string;
        createdAt: string;
      }>
    >;
    saveCameras?: (
      cameras: Array<{
        id: string;
        name: string;
        rtspUrl: string;
        streamName: string;
        createdAt: string;
      }>
    ) => Promise<string>;
    getCameraStoreStatus?: () => Promise<{ filePath: string }>;
  };
}
