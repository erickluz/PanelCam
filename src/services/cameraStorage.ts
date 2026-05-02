import { EXAMPLE_RTSP_URL } from './appConfig';
import type { Camera, CameraFormValues } from '../types/camera';

const STORAGE_KEY = 'rtsp-dashboard:cameras';

function createCameraId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `camera-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createStreamName(cameraId: string) {
  return `camera_${cameraId.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

export function loadCameras(): Camera[] {
  const serialized = localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    return [];
  }

  try {
    const cameras = JSON.parse(serialized) as Camera[];
    if (!Array.isArray(cameras)) {
      return [];
    }

    return cameras.filter(
      (camera) => camera.id !== 'sample-camera' && camera.rtspUrl !== EXAMPLE_RTSP_URL
    );
  } catch {
    return [];
  }
}

export function saveCameras(cameras: Camera[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
}

export function createCamera(values: CameraFormValues): Camera {
  const id = createCameraId();

  return {
    id,
    name: values.name.trim(),
    rtspUrl: values.rtspUrl.trim(),
    streamName: createStreamName(id),
    createdAt: new Date().toISOString()
  };
}
