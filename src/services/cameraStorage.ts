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

function sanitizeCameras(cameras: Camera[]) {
  return cameras.filter(
    (camera) => camera.id !== 'sample-camera' && camera.rtspUrl !== EXAMPLE_RTSP_URL
  );
}

function loadLegacyLocalStorageCameras(): Camera[] {
  const serialized = localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    return [];
  }

  try {
    const cameras = JSON.parse(serialized) as Camera[];
    if (!Array.isArray(cameras)) {
      return [];
    }

    return sanitizeCameras(cameras);
  } catch {
    return [];
  }
}

export async function loadCameras(): Promise<Camera[]> {
  const legacyCameras = loadLegacyLocalStorageCameras();

  if (window.desktopApp?.loadCameras) {
    const cameras = sanitizeCameras(await window.desktopApp.loadCameras());

    if (cameras.length === 0 && legacyCameras.length > 0) {
      await saveCameras(legacyCameras);
      return legacyCameras;
    }

    return cameras;
  }

  return legacyCameras;
}

export async function saveCameras(cameras: Camera[]) {
  const sanitizedCameras = sanitizeCameras(cameras);

  if (window.desktopApp?.saveCameras) {
    await window.desktopApp.saveCameras(sanitizedCameras);
  } else {
    console.warn('API desktopApp.saveCameras indisponivel; usando localStorage como fallback.');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedCameras));
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
