import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AddCameraCard } from '../components/AddCameraCard';
import { AddCameraModal } from '../components/AddCameraModal';
import { CameraCard } from '../components/CameraCard';
import { createCamera, loadCameras, saveCameras } from '../services/cameraStorage';
import { checkGo2RtcHealth, configureGo2RtcStreams } from '../services/go2rtc';
import type { Camera, CameraFormValues } from '../types/camera';

export function Dashboard() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hasLoadedCameras, setHasLoadedCameras] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewayOnline, setIsGatewayOnline] = useState(false);
  const [isCheckingGateway, setIsCheckingGateway] = useState(true);
  const [isSyncingGateway, setIsSyncingGateway] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isFocusLayout, setIsFocusLayout] = useState(false);
  const cameraCount = cameras.length;
  const streamSignature = useMemo(
    () => cameras.map((camera) => `${camera.streamName}:${camera.rtspUrl}`).join('|'),
    [cameras]
  );

  useEffect(() => {
    void bootDashboard();
  }, []);

  useEffect(() => {
    if (!hasLoadedCameras) {
      return;
    }

    void syncGatewayStreams(cameras);
  }, [hasLoadedCameras, streamSignature]);

  const subtitle = useMemo(() => {
    if (cameraCount === 1) {
      return '1 camera configurada';
    }

    return `${cameraCount} cameras configuradas`;
  }, [cameraCount]);
  const focusGridStyle = isFocusLayout
    ? ({
        '--focus-columns': getFocusColumnCount(cameraCount)
      } as CSSProperties)
    : undefined;

  async function handleAddCamera(values: CameraFormValues) {
    const camera = createCamera(values);
    await updateCameras([...cameras, camera]);
  }

  async function syncGatewayStreams(nextCameras: Camera[]) {
    setIsSyncingGateway(true);
    setIsCheckingGateway(true);

    try {
      await configureGo2RtcStreams(nextCameras);
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
    void updateCameras(cameras.filter((camera) => camera.id !== cameraId));
  }

  function handleRenameCamera(cameraId: string, name: string) {
    void updateCameras(
      cameras.map((camera) => (camera.id === cameraId ? { ...camera, name } : camera))
    );
  }

  async function updateCameras(nextCameras: Camera[]) {
    await saveCameras(nextCameras);
    await configureGo2RtcStreams(nextCameras);
    setCameras(nextCameras);
  }

  return (
    <main className={isFocusLayout ? 'dashboard focus-layout' : 'dashboard'}>
      <div className={isBooting ? 'dashboard-content is-blurred' : 'dashboard-content'}>
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Monitoramento</span>
            <h1>Painel</h1>
            <p>{subtitle}</p>
          </div>
          <button
            className="layout-toggle-button"
            type="button"
            onClick={() => setIsFocusLayout((current) => !current)}
          >
            {isFocusLayout ? 'Layout padrão' : 'Expandir layout'}
          </button>
        </header>

        <section className="camera-grid" style={focusGridStyle} aria-label="Cameras cadastradas">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              isGatewayOnline={isGatewayOnline}
              onRename={handleRenameCamera}
              onRemove={handleRemoveCamera}
            />
          ))}
          {!isFocusLayout ? <AddCameraCard onClick={() => setIsModalOpen(true)} /> : null}
        </section>
      </div>

      {isBooting ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <span>Carregando cameras...</span>
        </div>
      ) : null}

      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCamera}
      />
    </main>
  );

  async function bootDashboard() {
    setIsBooting(true);

    try {
      const storedCameras = await loadCameras();
      setCameras(storedCameras);
      setHasLoadedCameras(true);
      void syncGatewayStreams(storedCameras);
    } finally {
      setIsBooting(false);
      document.getElementById('boot-screen')?.remove();
    }
  }
}

function getFocusColumnCount(cameraCount: number) {
  if (cameraCount <= 1) {
    return 1;
  }

  if (cameraCount <= 4) {
    return 2;
  }

  if (cameraCount <= 6) {
    return 3;
  }

  return 4;
}
