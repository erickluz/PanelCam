import { Plus } from './icons';

type AddCameraCardProps = {
  onClick: () => void;
};

export function AddCameraCard({ onClick }: AddCameraCardProps) {
  return (
    <button className="add-camera-card" type="button" onClick={onClick} title="Adicionar nova câmera">
      <span className="add-icon-orb">
        <Plus size={28} />
      </span>
      <span className="add-camera-label">Adicionar Câmera</span>
    </button>
  );
}
