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
      streams: Array<{ streamName: string; rtspUrl: string }>
    ) => Promise<{
      running: boolean;
      binaryPath: string;
      configPath: string;
      message: string;
    }>;
  };
}
