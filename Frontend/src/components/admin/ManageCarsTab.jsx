import { useState, useEffect, useMemo } from 'react';
import styles from '../../pages/Admin.module.css';
import EditCarModal from '../EditCarModal';
import MessageModal from '../MessageModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Trash2, Edit, Search, X } from 'lucide-react';
import { TableLoadingSkeleton } from '../LoadingSkeleton';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';
import { Link } from 'react-router-dom';

export default function ManageCarsTab() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCar, setEditingCar] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCars = useMemo(() => {
        if (!searchQuery.trim()) return cars;
        const query = searchQuery.toLowerCase();
        return cars.filter(car => 
            car.brand.toLowerCase().includes(query) ||
            car.model.toLowerCase().includes(query) ||
            (car.variant || '').toLowerCase().includes(query) ||
            (car.color || '').toLowerCase().includes(query) ||
            car.year.toString().includes(query) ||
            car.price.toString().includes(query)
        );
    }, [cars, searchQuery]);

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

    if (loading) return <TableLoadingSkeleton rows={5} columns={7} />;
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
                <p className={styles.manageSub}>{filteredCars.length} {content.manageCarsTab.countSuffix}</p>
            </div>
            <div className={styles.filterBar}>
                <div className={styles.filterInput}>
                    <input
                        type="text"
                        placeholder="Sök efter märke, modell, kaross, färg, år eller pris..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {searchQuery && (
                    <button className={styles.clearButton} onClick={() => setSearchQuery('')}>
                        <X size={16} style={{ marginRight: '0.3rem' }} />
                        Rensa
                    </button>
                )}
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {content.manageCarsTab.tableHeaders.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCars.map(car => (
                            <tr key={car.id}>
                                <td>
                                    <Link to={`/bilar/${car.id}`} className={styles.thumbLink}>
                                        <img
                                            src={(car.images && car.images[0]) || content.manageCarsTab.thumbnailPlaceholder}
                                            alt={car.brand}
                                            className={styles.thumbImg}
                                        />
                                    </Link>
                                </td>
                                <td>
                                    <span className={styles.carName}>{car.brand}</span>
                                    <span className={styles.carModel}>{car.model}</span>
                                    {(car.variant || car.color) && (
                                        <span className={styles.carModel}>
                                            {[car.variant && `Kaross: ${car.variant}`, car.color && `Färg: ${car.color}`].filter(Boolean).join(' • ')}
                                        </span>
                                    )}
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


