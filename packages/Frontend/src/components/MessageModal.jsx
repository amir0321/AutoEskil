import styles from './MessageModal.module.css';

export default function MessageModal({ message, type = 'error', onClose }) {
    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={`${styles.modal} ${styles[`modal-${type}`]}`}>
                <div className={styles.header}>
                    {type === 'error' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                    {type === 'success' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>
                <p className={styles.message}>{message}</p>
                <button className={`btn btn-primary ${styles.button}`} onClick={onClose}>
                    Okej
                </button>
            </div>
        </>
    );
}
