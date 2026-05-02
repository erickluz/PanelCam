import { KeyboardEvent, useEffect, useState } from 'react';
import { Trash2 } from './icons';
import { VideoPlayer } from './VideoPlayer';
import type { Camera } from '../types/camera';

type CameraCardProps = {
  camera: Camera;
  isGatewayOnline: boolean;
  onRename: (cameraId: string, name: string) => void;
  onRemove: (cameraId: string) => void;
};

export function CameraCard({
  camera,
  isGatewayOnline,
  onRename,
  onRemove
}: CameraCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(camera.name);

  useEffect(() => {
    setDraftName(camera.name);
  }, [camera.name]);

  function saveName() {
    const nextName = draftName.trim();

    if (nextName && nextName !== camera.name) {
      onRename(camera.id, nextName);
    } else {
      setDraftName(camera.name);
    }

    setIsEditingName(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      saveName();
    }

    if (event.key === 'Escape') {
      setDraftName(camera.name);
      setIsEditingName(false);
    }
  }

  return (
    <article className="camera-card">
      <header className="camera-card-header">
        <div>
          {isEditingName ? (
            <input
              className="camera-name-input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={saveName}
              onKeyDown={handleNameKeyDown}
              autoFocus
            />
          ) : (
            <button
              className="camera-name-button"
              type="button"
              title="Clique para editar o nome"
              onClick={() => setIsEditingName(true)}
            >
              {camera.name}
            </button>
          )}
        </div>
        <button
          className="icon-button danger"
          type="button"
          aria-label={`Remover ${camera.name}`}
          title="Remover camera"
          onClick={() => onRemove(camera.id)}
        >
          <Trash2 />
        </button>
      </header>
      <VideoPlayer streamName={camera.streamName} isGatewayOnline={isGatewayOnline} />
    </article>
  );
}
