import { GO2RTC_BASE_URL } from './appConfig';

export type Go2RtcOptions = {
  baseUrl?: string;
};

function url(path: string, baseUrl = GO2RTC_BASE_URL) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function checkGo2RtcHealth(options: Go2RtcOptions = {}) {
  const baseUrl = options.baseUrl ?? GO2RTC_BASE_URL;

  if (window.desktopApp?.checkGo2RtcHealth) {
    return window.desktopApp.checkGo2RtcHealth(baseUrl);
  }

  const response = await fetch(url('/api/streams', options.baseUrl), {
    method: 'GET',
    cache: 'no-store'
  });

  return response.ok;
}

export async function configureGo2RtcStreams(
  streams: Array<{
    id?: string;
    name?: string;
    rtspUrl: string;
    streamName: string;
    createdAt?: string;
  }>
) {
  if (window.desktopApp?.configureGo2RtcStreams) {
    await window.desktopApp.configureGo2RtcStreams(streams);
  }
}

export function getHlsUrl(streamName: string, options: Go2RtcOptions = {}) {
  const endpoint = new URL(url('/api/stream.m3u8', options.baseUrl));
  endpoint.searchParams.set('src', streamName);
  endpoint.searchParams.set('mp4', '');
  return endpoint.toString();
}

function waitForIceGathering(peerConnection: RTCPeerConnection) {
  if (peerConnection.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 1800);

    peerConnection.addEventListener('icegatheringstatechange', () => {
      if (peerConnection.iceGatheringState === 'complete') {
        window.clearTimeout(timeout);
        resolve();
      }
    });
  });
}

function playVideo(videoElement: HTMLVideoElement) {
  void videoElement.play().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    console.warn('Nao foi possivel iniciar o video automaticamente.', error);
  });
}

export async function playWebRtcStream(
  streamName: string,
  videoElement: HTMLVideoElement,
  options: Go2RtcOptions = {}
) {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  peerConnection.addTransceiver('video', { direction: 'recvonly' });
  peerConnection.addTransceiver('audio', { direction: 'recvonly' });

  peerConnection.addEventListener('track', (event) => {
    const [stream] = event.streams;
    if (stream) {
      videoElement.srcObject = stream;
      playVideo(videoElement);
    }
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await waitForIceGathering(peerConnection);

  const endpoint = new URL(url('/api/webrtc', options.baseUrl));
  endpoint.searchParams.set('src', streamName);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: peerConnection.localDescription?.sdp ?? offer.sdp
  });

  if (!response.ok) {
    peerConnection.close();
    throw new Error(`WebRTC indisponivel (${response.status})`);
  }

  const answer = await response.text();
  await peerConnection.setRemoteDescription({ type: 'answer', sdp: answer });

  return () => {
    videoElement.pause();
    videoElement.srcObject = null;
    peerConnection.close();
  };
}
