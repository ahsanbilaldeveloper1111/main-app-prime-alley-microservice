import ConfirmModal from "@components/page-partials/ConfirmModal";

export type AiFaqDeleteConfirmModalProps = Readonly<{
  show: boolean;
  targetQuestion: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}>;

export function AiFaqDeleteConfirmModal({
  show,
  targetQuestion,
  onConfirm,
  onClose,
}: AiFaqDeleteConfirmModalProps) {
  if (!show) return null;

  return (
    <ConfirmModal
      show={show}
      onHide={onClose}
      title="Delete FAQ?"
      description="Are you sure you want to delete this FAQ? This action cannot be undone."
      targetName={targetQuestion}
      confirmButtonText="Delete"
      cancelButtonText="Cancel"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}
