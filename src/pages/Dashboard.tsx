import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AddCameraCard } from '../components/AddCameraCard';
import { AddCameraModal } from '../components/AddCameraModal';
import { CameraCard } from '../components/CameraCard';
import {
  CameraIcon,
  FocusIcon,
  GridIcon,
  Plus
} from '../components/icons';
import { createCamera, loadCameras, saveCameras } from '../services/cameraStorage';
import { checkGo2RtcHealth, configureGo2RtcStreams } from '../services/go2rtc';
import type { Camera, CameraFormValues } from '../types/camera';

type FocusColumnChoice = 'auto' | 1 | 2 | 3 | 4;

export function Dashboard() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hasLoadedCameras, setHasLoadedCameras] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewayOnline, setIsGatewayOnline] = useState(false);
  const [isCheckingGateway, setIsCheckingGateway] = useState(true);
  const [isSyncingGateway, setIsSyncingGateway] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isFocusLayout, setIsFocusLayout] = useState(false);
  const [focusColumnsChoice, setFocusColumnsChoice] = useState<FocusColumnChoice>('auto');

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

  const activeFocusColumns = useMemo(() => {
    if (focusColumnsChoice !== 'auto') {
      return focusColumnsChoice;
    }
    return getFocusColumnCount(cameraCount);
  }, [focusColumnsChoice, cameraCount]);

  const focusGridStyle = isFocusLayout
    ? ({
        '--focus-columns': activeFocusColumns
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

  const gatewayStatusText = isSyncingGateway
    ? 'go2rtc: Sincronizando...'
    : isGatewayOnline
      ? 'go2rtc: Ativo'
      : isCheckingGateway
        ? 'go2rtc: Verificando...'
        : 'go2rtc: Desconectado';

  const gatewayDotClass = isSyncingGateway
    ? 'pulse-dot amber'
    : isGatewayOnline
      ? 'pulse-dot'
      : 'pulse-dot rose';

  return (
    <>
      {/* Background Liquid Ambient Mesh */}
      <div className="liquid-ambient-canvas" aria-hidden="true">
        <div className="liquid-orb liquid-orb-1" />
        <div className="liquid-orb liquid-orb-2" />
        <div className="liquid-orb liquid-orb-3" />
      </div>

      <main className={isFocusLayout ? 'dashboard focus-layout' : 'dashboard'}>
        <div className={isBooting ? 'dashboard-content is-blurred' : 'dashboard-content'}>
          {/* Floating Glass Navigation Header */}
          <header className="glass-header">
            <div className="header-brand">
              <div className="brand-icon-wrapper">
                <CameraIcon size={22} />
              </div>
              <div className="brand-info">
                <div className="brand-title-row">
                  <h1 className="brand-title">CamPanel</h1>
                  <span className="brand-badge">
                    {cameraCount} {cameraCount === 1 ? 'câmera' : 'câmeras'}
                  </span>
                </div>
                <p className="brand-subtitle">Monitoramento e streaming de vídeo de alto desempenho</p>
              </div>
            </div>

            <div className="header-actions">
              {/* Live Gateway Status */}
              <div className="status-pill" title="Status do serviço de conversão go2rtc">
                <span className={gatewayDotClass} />
                <span>{gatewayStatusText}</span>
              </div>

              {/* Layout Switcher */}
              <div className="layout-switcher" role="tablist" aria-label="Modo de visualização">
                <button
                  className={`layout-pill-btn ${!isFocusLayout ? 'active' : ''}`}
                  type="button"
                  onClick={() => setIsFocusLayout(false)}
                  title="Modo padrão com cartões expandidos"
                >
                  <GridIcon size={15} />
                  <span>Grid Padrão</span>
                </button>
                <button
                  className={`layout-pill-btn ${isFocusLayout ? 'active' : ''}`}
                  type="button"
                  onClick={() => setIsFocusLayout(true)}
                  title="Central de foco (tela de monitoramento sem bordas)"
                >
                  <FocusIcon size={15} />
                  <span>Central de Foco</span>
                </button>
              </div>

              {/* Focus Column Density Selector */}
              {isFocusLayout ? (
                <div className="density-group" title="Colunas do painel de monitoramento">
                  {(['auto', 1, 2, 3, 4] as FocusColumnChoice[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`density-btn ${focusColumnsChoice === choice ? 'active' : ''}`}
                      onClick={() => setFocusColumnsChoice(choice)}
                      title={choice === 'auto' ? 'Colunas automáticas' : `${choice} Colunas`}
                    >
                      {choice === 'auto' ? 'Auto' : `${choice}C`}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Quick Add Camera Button */}
              <button
                className="liquid-btn-primary"
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="Cadastrar nova câmera RTSP"
              >
                <Plus size={17} />
                <span>Nova Câmera</span>
              </button>
            </div>
          </header>

          {/* Camera Grid Section */}
          <section className="camera-grid" style={focusGridStyle} aria-label="Câmeras cadastradas">
            {cameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                isGatewayOnline={isGatewayOnline}
                onRename={handleRenameCamera}
                onRemove={handleRemoveCamera}
              />
            ))}

            {!isFocusLayout ? (
              cameras.length === 0 ? (
                <div className="empty-dashboard-glass">
                  <div className="brand-icon-wrapper" style={{ width: 60, height: 60, borderRadius: 18 }}>
                    <CameraIcon size={30} />
                  </div>
                  <h2>Nenhuma câmera conectada</h2>
                  <p>
                    Adicione sua primeira câmera RTSP para iniciar a visualização ao vivo com baixa latência e controles interativos.
                  </p>
                  <button
                    className="liquid-btn-primary"
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={18} />
                    <span>Adicionar Primeira Câmera</span>
                  </button>
                </div>
              ) : (
                <AddCameraCard onClick={() => setIsModalOpen(true)} />
              )
            ) : null}
          </section>
        </div>

        {/* Loading Overlay */}
        {isBooting ? (
          <div className="loading-overlay" role="status" aria-live="polite">
            <div className="liquid-spinner" />
            <span>Sincronizando painel e câmeras...</span>
          </div>
        ) : null}

        {/* Modal Dialog */}
        <AddCameraModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddCamera}
        />
      </main>
    </>
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
