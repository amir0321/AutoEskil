import { useState, useEffect } from 'react';
import styles from '../../pages/Admin.module.css';
import EditCarModal from '../EditCarModal';
import MessageModal from '../MessageModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Trash2, Edit } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';

export default function ManageCarsTab() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCar, setEditingCar] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await adminFetch('/cars');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setCars(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, []);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const res = await adminFetch('/cars');
            if (res.ok) {
                const data = await res.json();
                setCars(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await adminFetch(`/cars/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCars(prev => prev.filter(c => c.id !== id));
            } else {
                setErrorMessage(content.manageCarsTab.messages.failedDelete);
            }
        } catch {
            setErrorMessage(content.manageCarsTab.messages.network);
        }
    };

    if (loading) return <div className={styles.loadingText}>{content.manageCarsTab.loading}</div>;
    if (cars.length === 0) return <div className={styles.emptyText}>{content.manageCarsTab.empty}</div>;

    return (
        <>
            {pendingDelete && (
                <DeleteConfirmModal
                    title={content.manageCarsTab.deleteModal.title.replace('{name}', pendingDelete.name)}
                    message={content.manageCarsTab.deleteModal.message}
                    confirmText={content.manageCarsTab.deleteModal.confirm}
                    cancelText={content.manageCarsTab.deleteModal.cancel}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={async () => {
                        const item = pendingDelete;
                        setPendingDelete(null);
                        await handleDelete(item.id);
                    }}
                />
            )}
            {errorMessage && (
                <MessageModal
                    message={errorMessage}
                    type="error"
                    onClose={() => setErrorMessage(null)}
                />
            )}
            <div className={styles.manageHeader}>
                <h2 className={styles.manageTitle}>{content.manageCarsTab.title}</h2>
                <p className={styles.manageSub}>{cars.length} {content.manageCarsTab.countSuffix}</p>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {content.manageCarsTab.tableHeaders.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map(car => (
                            <tr key={car.id}>
                                <td>
                                    <img
                                        src={(car.images && car.images[0]) || content.manageCarsTab.thumbnailPlaceholder}
                                        alt={car.brand}
                                        className={styles.thumbImg}
                                    />
                                </td>
                                <td>
                                    <span className={styles.carName}>{car.brand}</span>
                                    <span className={styles.carModel}>{car.model}</span>
                                </td>
                                <td>{car.year}</td>
                                <td>{Number(car.mileage).toLocaleString('sv-SE')} mil</td>
                                <td><span className={styles.fuelBadge}>{car.fuel_type}</span></td>
                                <td className={styles.priceCell}>{Number(car.price).toLocaleString('sv-SE')} kr</td>
                                <td className={styles.actionsCell}>
                                    <div className={styles.actionsRow}>
                                        <button className="btn btn-secondary" onClick={() => setEditingCar(car)}>
                                            <Edit size={14} />
                                            <span>{content.manageCarsTab.buttons.edit}</span>
                                        </button>
                                        <button className="btn btn-danger" onClick={() => setPendingDelete({ id: car.id, name: `${car.brand} ${car.model}` })}>
                                            <Trash2 size={14} />
                                            <span>{content.manageCarsTab.buttons.delete}</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingCar && (
                <EditCarModal
                    car={editingCar}
                    onClose={() => setEditingCar(null)}
                    onCarUpdated={() => {
                        setEditingCar(null);
                        fetchCars(); // Hämta billistan på nytt
                    }}
                />
            )}
        </>
    );
}


