import styles from './DeleteConfirmModal.module.css';

export default function DeleteConfirmModal({
    title,
    message,
    confirmText = 'Ta bort',
    cancelText = 'Avbryt',
    onConfirm,
    onClose,
}) {
    return (
        <>
            <button className={styles.overlay} type="button" aria-label="Stäng dialog" onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
                <div className={styles.iconWrap}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <h3 id="delete-confirm-title" className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>

                <div className={styles.actions}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button type="button" className={`btn btn-danger ${styles.confirmBtn}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </>
    );
}