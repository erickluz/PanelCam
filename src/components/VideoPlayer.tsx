import Hls from 'hls.js';
import { MouseEvent, PointerEvent, WheelEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  PipIcon,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from './icons';
import { getHlsUrl, playWebRtcStream } from '../services/go2rtc';
import type { PlaybackMode } from '../types/camera';

type VideoPlayerProps = {
  streamName: string;
  isGatewayOnline: boolean;
};

export function VideoPlayer({ streamName, isGatewayOnline }: VideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [mode, setMode] = useState<PlaybackMode>('webrtc');
  const [status, setStatus] = useState(
    isGatewayOnline ? 'Conectando WebRTC...' : 'go2rtc offline'
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Monitor fullscreen state
  useEffect(() => {
    function handleFullscreenChange() {
      const active = document.fullscreenElement === shellRef.current;
      setIsFullscreen(active);
      if (!active) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        dragStartRef.current = null;
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // WebRTC / HLS Stream Connection
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let hls: Hls | undefined;
    let cancelled = false;

    async function start() {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      if (!isGatewayOnline) {
        video.pause();
        video.srcObject = null;
        video.removeAttribute('src');
        setStatus('go2rtc offline');
        return;
      }

      try {
        setMode('webrtc');
        setStatus('Conectando...');
        cleanup = await playWebRtcStream(streamName, video);

        if (!cancelled) {
          setStatus('Ao vivo');
        }
      } catch {
        if (cancelled) {
          return;
        }

        const hlsUrl = getHlsUrl(streamName);
        setMode('hls');
        setStatus('WebRTC off. Alternando HLS...');
        video.srcObject = null;

        if (Hls.isSupported()) {
          hls = new Hls({
            lowLatencyMode: true,
            liveSyncDurationCount: 2
          });
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            playSafely(video);
            setStatus('Ao vivo (HLS)');
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setStatus('Falha no stream');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsUrl;
          playSafely(video);
          setStatus('Ao vivo (HLS)');
        } else {
          setStatus('Ambiente sem suporte HLS');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      cleanup?.();
      hls?.destroy();
    };
  }, [streamName, isGatewayOnline, reconnectCount]);

  const clampPan = useCallback((nextPan: { x: number; y: number }, nextZoom: number) => {
    const shell = shellRef.current;
    if (!shell || nextZoom <= 1) {
      return { x: 0, y: 0 };
    }

    const bounds = shell.getBoundingClientRect();
    const maxX = (bounds.width * (nextZoom - 1)) / 2;
    const maxY = (bounds.height * (nextZoom - 1)) / 2;

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY)
    };
  }, []);

  async function toggleFullscreen(event?: MouseEvent) {
    event?.stopPropagation();

    if (!shellRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === shellRef.current) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await shellRef.current.requestFullscreen();
      }
    } catch (error) {
      console.warn('Erro ao alternar tela cheia', error);
    }
  }

  async function togglePictureInPicture(event: MouseEvent) {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      setStatus('PiP indisponível');
      return;
    }

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await video.requestPictureInPicture();
    } catch (error) {
      console.warn('Erro ao ativar Picture-in-Picture', error);
      setStatus('Falha ao abrir PiP');
    }
  }

  function handleReconnect(event: MouseEvent) {
    event.stopPropagation();
    setReconnectCount((c) => c + 1);
  }

  function handleZoomIn(event: MouseEvent) {
    event.stopPropagation();
    const nextZoom = Math.min(4, Math.round((zoom + 0.25) * 100) / 100);
    setZoom(nextZoom);
    setPan(clampPan(pan, nextZoom));
  }

  function handleZoomOut(event: MouseEvent) {
    event.stopPropagation();
    const nextZoom = Math.max(1, Math.round((zoom - 0.25) * 100) / 100);
    setZoom(nextZoom);
    setPan(nextZoom === 1 ? { x: 0, y: 0 } : clampPan(pan, nextZoom));
  }

  function handleResetZoom(event: MouseEvent) {
    event.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    const nextZoom = Math.min(4, Math.max(1, zoom + (event.deltaY < 0 ? 0.2 : -0.2)));
    setZoom(nextZoom);
    setPan(nextZoom === 1 ? { x: 0, y: 0 } : clampPan(pan, nextZoom));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) {
      return;
    }

    dragStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) {
      return;
    }

    setPan(
      clampPan(
        {
          x: dragStart.panX + event.clientX - dragStart.x,
          y: dragStart.panY + event.clientY - dragStart.y
        },
        zoom
      )
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  const liveDotClass = !isGatewayOnline
    ? 'live-dot offline'
    : mode === 'hls'
      ? 'live-dot hls'
      : 'live-dot';

  return (
    <div
      className={`video-shell ${zoom > 1 ? 'is-zoomed' : ''}`}
      ref={shellRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={() => void toggleFullscreen()}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        controls={false}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      />

      {/* Floating Glass Video Controls Dock */}
      <div className="video-control-dock" role="toolbar" aria-label="Controles de vídeo">
        <button
          className="dock-btn"
          type="button"
          title="Reconectar stream"
          aria-label="Reconectar stream"
          onClick={handleReconnect}
        >
          <RefreshCw size={15} />
        </button>

        <span className="dock-separator" />

        <button
          className="dock-btn"
          type="button"
          title="Aproximar zoom"
          aria-label="Aproximar zoom"
          disabled={zoom >= 4}
          onClick={handleZoomIn}
        >
          <ZoomIn size={15} />
        </button>

        {zoom > 1 ? (
          <button
            className="dock-btn"
            type="button"
            title="Resetar zoom (100%)"
            aria-label="Resetar zoom"
            onClick={handleResetZoom}
          >
            <RotateCcw size={14} />
          </button>
        ) : null}

        <button
          className="dock-btn"
          type="button"
          title="Afastar zoom"
          aria-label="Afastar zoom"
          disabled={zoom <= 1}
          onClick={handleZoomOut}
        >
          <ZoomOut size={15} />
        </button>

        <span className="dock-separator" />

        <button
          className="dock-btn"
          type="button"
          title="Picture-in-Picture"
          aria-label="Picture-in-Picture"
          onClick={togglePictureInPicture}
        >
          <PipIcon size={16} />
        </button>

        <button
          className="dock-btn"
          type="button"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia (duplo clique)'}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          onClick={(e) => void toggleFullscreen(e)}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Floating Status Pill */}
      <div className="video-status-pill">
        <span className={liveDotClass} />
        <span>
          {zoom > 1 ? `${status} • ${Math.round(zoom * 100)}%` : status}
        </span>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function playSafely(video: HTMLVideoElement) {
  void video.play().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    console.warn('Não foi possível iniciar o vídeo automaticamente.', error);
  });
}
