import Hls from 'hls.js';
import { MouseEvent, PointerEvent, WheelEvent, useEffect, useRef, useState } from 'react';
import { getHlsUrl, playWebRtcStream } from '../services/go2rtc';
import type { PlaybackMode } from '../types/camera';

type VideoPlayerProps = {
  streamName: string;
  isGatewayOnline: boolean;
};

export function VideoPlayer({ streamName, isGatewayOnline }: VideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragStartRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(
    null
  );
  const [mode, setMode] = useState<PlaybackMode>('webrtc');
  const [status, setStatus] = useState(
    isGatewayOnline ? 'Conectando via WebRTC...' : 'go2rtc offline'
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement !== shellRef.current) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        dragStartRef.current = null;
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        setStatus('Conectando via WebRTC...');
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
        setStatus('WebRTC indisponivel. Usando HLS...');
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
            setStatus('Ao vivo via HLS');
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setStatus('Nao foi possivel reproduzir o stream.');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsUrl;
          playSafely(video);
          setStatus('Ao vivo via HLS');
        } else {
          setStatus('Este ambiente nao suporta HLS.');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      cleanup?.();
      hls?.destroy();
    };
  }, [streamName, isGatewayOnline]);

  async function openFullscreen(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!shellRef.current || document.fullscreenElement) {
      return;
    }

    await shellRef.current.requestFullscreen().catch((error: unknown) => {
      console.warn('Nao foi possivel abrir em tela cheia.', error);
    });
  }

  async function togglePictureInPicture(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      setStatus('Picture-in-Picture indisponivel');
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
      console.warn('Nao foi possivel abrir Picture-in-Picture.', error);
      setStatus('Nao foi possivel abrir Picture-in-Picture');
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey || document.fullscreenElement !== shellRef.current) {
      return;
    }

    event.preventDefault();
    const nextZoom = Math.min(4, Math.max(1, zoom + (event.deltaY < 0 ? 0.18 : -0.18)));
    setZoom(nextZoom);
    setPan(nextZoom === 1 ? { x: 0, y: 0 } : clampPan(pan, nextZoom));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (document.fullscreenElement !== shellRef.current || zoom === 1) {
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

  function clampPan(nextPan: { x: number; y: number }, nextZoom: number) {
    const shell = shellRef.current;

    if (!shell || nextZoom === 1) {
      return { x: 0, y: 0 };
    }

    const bounds = shell.getBoundingClientRect();
    const maxX = (bounds.width * (nextZoom - 1)) / 2;
    const maxY = (bounds.height * (nextZoom - 1)) / 2;

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY)
    };
  }

  return (
    <div
      className={`video-shell ${zoom > 1 ? 'is-zoomed' : ''}`}
      ref={shellRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        controls={false}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      />
      <button
        className="video-hit-area"
        type="button"
        aria-label="Abrir camera em tela cheia"
        title="Abrir em tela cheia"
        onClick={openFullscreen}
      />
      <button
        className="video-pip-button"
        type="button"
        aria-label="Abrir camera em Picture-in-Picture"
        title="Picture-in-Picture"
        onClick={togglePictureInPicture}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6h16v12H4V6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M13 12h5v4h-5v-4Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div className="video-status">
        <span className={`live-dot ${mode}`} />
        <span>{zoom > 1 ? `${status} - ${Math.round(zoom * 100)}%` : status}</span>
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

    console.warn('Nao foi possivel iniciar o video automaticamente.', error);
  });
}
