import { app } from 'electron';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

type Camera = {
  id: string;
  name: string;
  rtspUrl: string;
  streamName: string;
  createdAt: string;
};

function getCameraStorePath() {
  return path.join(app.getPath('userData'), 'cameras.json');
}

function isCamera(value: unknown): value is Camera {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const camera = value as Partial<Camera>;
  return (
    typeof camera.id === 'string' &&
    typeof camera.name === 'string' &&
    typeof camera.rtspUrl === 'string' &&
    typeof camera.streamName === 'string' &&
    typeof camera.createdAt === 'string'
  );
}

export async function loadCamerasFromUserData() {
  const filePath = getCameraStorePath();

  try {
    const content = await fsPromises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCamera) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function saveCamerasToUserData(cameras: Camera[]) {
  return saveCamerasToUserDataSync(cameras);
}

export function saveCamerasToUserDataSync(cameras: Camera[]) {
  const filePath = getCameraStorePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(cameras, null, 2), 'utf8');
  return filePath;
}

export function ensureCameraStoreFile() {
  const filePath = getCameraStorePath();

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '[]', 'utf8');
  }

  return filePath;
}

export function getCameraStoreStatus() {
  return {
    filePath: getCameraStorePath()
  };
}
