import { FormEvent, useState } from 'react';
import type { CameraFormValues } from '../types/camera';

type AddCameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: CameraFormValues) => Promise<void> | void;
};

export function AddCameraModal({ isOpen, onClose, onSave }: AddCameraModalProps) {
  const [name, setName] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!name.trim() || !rtspUrl.trim()) {
      setError('Informe nome e URL RTSP.');
      return;
    }

    if (!rtspUrl.trim().toLowerCase().startsWith('rtsp://')) {
      setError('A URL deve comecar com rtsp://.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name, rtspUrl });
      setName('');
      setRtspUrl('');
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-camera-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="add-camera-title">Nova camera RTSP</h2>
            <p>O app registra a URL no go2rtc e toca o stream convertido.</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            Fechar
          </button>
        </header>

        <form className="camera-form" onSubmit={handleSubmit}>
          <label>
            <span>Nome da camera</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Entrada principal"
              autoFocus
            />
          </label>

          <label>
            <span>URL RTSP</span>
            <input
              value={rtspUrl}
              onChange={(event) => setRtspUrl(event.target.value)}
              placeholder="rtsp://usuario:senha@ip:554/stream1"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar camera'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
