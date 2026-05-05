import styles from '../pages/Admin.module.css';

export function TableLoadingSkeleton({ rows = 5, columns = 7 }) {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className={styles.skeletonHeader}>
                                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {Array.from({ length: columns }).map((_, j) => (
                                <td key={j} className={styles.skeletonCell}>
                                    {j === 0 ? (
                                        <div className={styles.skeletonImage} />
                                    ) : (
                                        <div className={styles.skeletonLine} />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function CardLoadingSkeleton({ count = 3 }) {
    return (
        <div className={styles.leadsList}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`glass-card ${styles.skeletonCard}`}>
                    <div className={styles.skeletonLine} style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <div className={styles.skeletonLine} style={{ width: '60%', marginBottom: '1rem' }} />
                    <div className={styles.skeletonLine} style={{ width: '100%', marginBottom: '0.5rem' }} />
                    <div className={styles.skeletonLine} style={{ width: '80%' }} />
                </div>
            ))}
        </div>
    );
}
