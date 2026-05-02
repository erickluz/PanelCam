import { Plus } from './icons';

type AddCameraCardProps = {
  onClick: () => void;
};

export function AddCameraCard({ onClick }: AddCameraCardProps) {
  return (
    <button className="add-camera-card" type="button" onClick={onClick}>
      <span className="add-icon">
        <Plus />
      </span>
      <span>Adicionar camera</span>
    </button>
  );
}
