import { useId, type ReactNode } from 'react';
import ScrollableWindow from './ScrollableWindow';

type ModalProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  showCancel?: boolean;
  className?: string;
};

export default function Modal({
  isOpen,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  showCancel = true,
  className,
}: ModalProps) {
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className={`modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <ScrollableWindow className="modal-content">{children}</ScrollableWindow>
        <div className="modal-actions">
          {showCancel && (
            <button type="button" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={destructive ? 'danger-button' : 'primary-button'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
