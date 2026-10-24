import { KeyboardEvent, useEffect, useState } from 'react';
import { Check, CloseIcon, Pencil, Trash2 } from './icons';
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  function handleCancelEdit() {
    setDraftName(camera.name);
    setIsEditingName(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      saveName();
    }

    if (event.key === 'Escape') {
      handleCancelEdit();
    }
  }

  function handleConfirmDelete() {
    onRemove(camera.id);
    setIsConfirmingDelete(false);
  }

  return (
    <article className="camera-card">
      <header className="camera-card-header">
        <div className="camera-title-box">
          {isEditingName ? (
            <div className="rename-form">
              <input
                className="camera-name-input"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={saveName}
                onKeyDown={handleNameKeyDown}
                autoFocus
                placeholder="Nome da câmera"
              />
              <button
                className="rename-btn"
                type="button"
                title="Salvar nome"
                aria-label="Salvar nome"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <Check size={14} />
              </button>
              <button
                className="rename-btn cancel"
                type="button"
                title="Cancelar"
                aria-label="Cancelar"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCancelEdit();
                }}
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ) : (
            <button
              className="camera-name-button"
              type="button"
              title="Clique para editar o nome da câmera"
              onClick={() => setIsEditingName(true)}
            >
              <span>{camera.name}</span>
              <span className="pencil-cue">
                <Pencil size={13} />
              </span>
            </button>
          )}
        </div>

        <div className="card-actions">
          {isConfirmingDelete ? (
            <div className="confirm-delete-box">
              <button
                className="confirm-delete-btn"
                type="button"
                onClick={handleConfirmDelete}
                title="Confirmar remoção da câmera"
              >
                Excluir?
              </button>
              <button
                className="cancel-delete-btn"
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                title="Cancelar"
              >
                <CloseIcon size={13} />
              </button>
            </div>
          ) : (
            <button
              className="icon-glass-btn danger"
              type="button"
              aria-label={`Remover ${camera.name}`}
              title="Remover câmera"
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      <VideoPlayer streamName={camera.streamName} isGatewayOnline={isGatewayOnline} />
    </article>
  );
}
