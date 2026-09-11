import type { ReactNode } from "react";

type ModalProps = {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    destructive?: boolean;
};

export default function Modal({
    isOpen,
    title,
    children,
    confirmLabel,
    onConfirm,
    onCancel,
    destructive = false
}: ModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
            <section
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <h2 id="modal-title">{title}</h2>
                <div className="modal-content">{children}</div>
                <div className="modal-actions">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        className={destructive ? "danger-button" : "primary-button"}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
