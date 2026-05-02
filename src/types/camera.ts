export type Camera = {
  id: string;
  name: string;
  rtspUrl: string;
  streamName: string;
  createdAt: string;
};

export type CameraFormValues = {
  name: string;
  rtspUrl: string;
};

export type PlaybackMode = 'webrtc' | 'hls';
