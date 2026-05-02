import { useEffect, useMemo, useState } from 'react';
import { AddCameraCard } from '../components/AddCameraCard';
import { AddCameraModal } from '../components/AddCameraModal';
import { CameraCard } from '../components/CameraCard';
import { createCamera, loadCameras, saveCameras } from '../services/cameraStorage';
import { checkGo2RtcHealth, configureGo2RtcStreams } from '../services/go2rtc';
import type { Camera, CameraFormValues } from '../types/camera';

export function Dashboard() {
  const [cameras, setCameras] = useState<Camera[]>(() => loadCameras());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewayOnline, setIsGatewayOnline] = useState(false);
  const [isCheckingGateway, setIsCheckingGateway] = useState(true);
  const [isSyncingGateway, setIsSyncingGateway] = useState(false);
  const cameraCount = cameras.length;
  const streamSignature = useMemo(
    () => cameras.map((camera) => `${camera.streamName}:${camera.rtspUrl}`).join('|'),
    [cameras]
  );

  useEffect(() => {
    saveCameras(cameras);
  }, [cameras]);

  useEffect(() => {
    void syncGatewayStreams(cameras);
  }, [streamSignature]);

  const subtitle = useMemo(() => {
    if (cameraCount === 1) {
      return '1 camera configurada';
    }

    return `${cameraCount} cameras configuradas`;
  }, [cameraCount]);

  async function handleAddCamera(values: CameraFormValues) {
    const camera = createCamera(values);
    setCameras((current) => [...current, camera]);
  }

  async function syncGatewayStreams(nextCameras: Camera[]) {
    setIsSyncingGateway(true);
    setIsCheckingGateway(true);

    try {
      await configureGo2RtcStreams(
        nextCameras.map((camera) => ({
          streamName: camera.streamName,
          rtspUrl: camera.rtspUrl
        }))
      );
      await refreshGatewayStatus();
    } finally {
      setIsSyncingGateway(false);
      setIsCheckingGateway(false);
    }
  }

  async function refreshGatewayStatus() {
    setIsCheckingGateway(true);
    try {
      setIsGatewayOnline(await checkGo2RtcHealth());
    } catch {
      setIsGatewayOnline(false);
    } finally {
      setIsCheckingGateway(false);
    }
  }

  function handleRemoveCamera(cameraId: string) {
    setCameras((current) => current.filter((camera) => camera.id !== cameraId));
  }

  function handleRenameCamera(cameraId: string, name: string) {
    setCameras((current) =>
      current.map((camera) => (camera.id === cameraId ? { ...camera, name } : camera))
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Monitoramento</span>
          <h1>Painel</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <section className="camera-grid" aria-label="Cameras cadastradas">
        {cameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            isGatewayOnline={isGatewayOnline}
            onRename={handleRenameCamera}
            onRemove={handleRemoveCamera}
          />
        ))}
        <AddCameraCard onClick={() => setIsModalOpen(true)} />
      </section>

      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCamera}
      />
    </main>
  );
}
