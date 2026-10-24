import { FormEvent, useState } from 'react';
import { CloseIcon, Plus } from './icons';
import type { CameraFormValues } from '../types/camera';

type AddCameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: CameraFormValues) => Promise<void> | void;
};

const RTSP_PRESETS = [
  {
    name: 'Intelbras',
    url: 'rtsp://admin:admin123@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0'
  },
  {
    name: 'Hikvision',
    url: 'rtsp://admin:admin123@192.168.1.64:554/Streaming/Channels/101'
  },
  {
    name: 'Dahua',
    url: 'rtsp://admin:admin123@192.168.1.108:554/live'
  },
  {
    name: 'ONVIF Genérico',
    url: 'rtsp://admin:admin123@192.168.1.50:554/live/ch0'
  }
];

export function AddCameraModal({ isOpen, onClose, onSave }: AddCameraModalProps) {
  const [name, setName] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleApplyPreset(presetUrl: string, presetName: string) {
    setRtspUrl(presetUrl);
    if (!name.trim()) {
      setName(`Câmera ${presetName}`);
    }
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedUrl = rtspUrl.trim();

    if (!trimmedName || !trimmedUrl) {
      setError('Por favor, informe o nome e a URL RTSP.');
      return;
    }

    if (!trimmedUrl.toLowerCase().startsWith('rtsp://')) {
      setError('A URL deve iniciar obrigatoriamente com rtsp://');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: trimmedName, rtspUrl: trimmedUrl });
      setName('');
      setRtspUrl('');
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível registrar a câmera.');
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
            <h2 id="add-camera-title">Nova Câmera RTSP</h2>
            <p>O stream será convertido para WebRTC e HLS com latência ultrabaixa.</p>
          </div>
          <button
            className="modal-close-btn"
            type="button"
            title="Fechar"
            aria-label="Fechar modal"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {/* Quick Presets */}
        <div className="presets-section">
          <span className="presets-label">Exemplos Rápidos de Conexão</span>
          <div className="presets-grid">
            {RTSP_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="preset-chip"
                onClick={() => handleApplyPreset(preset.url, preset.name)}
                title={`Usar modelo de URL ${preset.name}`}
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form className="camera-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="camera-name-field">Nome de Identificação</label>
            <input
              id="camera-name-field"
              className="glass-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Entrada Principal, Garagem, Recepção"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="camera-url-field">URL RTSP da Câmera</label>
            <input
              id="camera-url-field"
              className="glass-input"
              value={rtspUrl}
              onChange={(event) => setRtspUrl(event.target.value)}
              placeholder="rtsp://usuario:senha@192.168.1.100:554/stream"
              spellCheck={false}
            />
            <span className="input-helper">
              Dica: Certifique-se de que o IP da câmera e a porta 554 estão acessíveis na rede.
            </span>
          </div>

          {error ? (
            <div className="form-error-glass" role="alert">
              <span>{error}</span>
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="glass-btn-secondary" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="liquid-btn-primary" type="submit" disabled={isSaving}>
              <Plus size={18} />
              <span>{isSaving ? 'Registrando...' : 'Salvar Câmera'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
