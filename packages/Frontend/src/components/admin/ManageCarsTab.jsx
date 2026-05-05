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
    const [failedThumbnailIds, setFailedThumbnailIds] = useState(() => new Set());

    const getEquipmentArray = (equipment) => {
        if (!equipment) return [];
        if (Array.isArray(equipment)) return equipment;
        if (typeof equipment === 'string') {
            try {
                const parsed = JSON.parse(equipment);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const formatLastUpdated = (value) => {
        if (!value) return 'Ej tillgänglig';
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) return 'Ej tillgänglig';
        return parsedDate.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const markThumbnailAsFailed = (carId) => {
        setFailedThumbnailIds((prev) => {
            if (prev.has(carId)) return prev;
            const next = new Set(prev);
            next.add(carId);
            return next;
        });
    };

    const filteredCars = useMemo(() => {
        if (!searchQuery.trim()) return cars;
        const query = searchQuery.toLowerCase();
        return cars.filter(car =>
            String(car.listing_id || '').includes(query) ||
            String(car.brand || '').toLowerCase().includes(query) ||
            String(car.model || '').toLowerCase().includes(query) ||
            String(car.variant || '').toLowerCase().includes(query) ||
            String(car.color || '').toLowerCase().includes(query) ||
            String(car.year || '').includes(query) ||
            String(car.price || '').includes(query)
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

    if (loading) return <TableLoadingSkeleton rows={5} columns={8} />;
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
                    <Search size={16} className={styles.filterInputIcon} />
                    <input
                        type="text"
                        placeholder="Sök efter ID, märke, modell, färg, år eller pris..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Sök bilar i admin"
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
                            <th>Bild</th>
                            <th>Bil</th>
                            <th>År</th>
                            <th>Miltal</th>
                            <th>Drivmedel</th>
                            <th>Utrustning</th>
                            <th>Pris</th>
                            <th>Åtgärd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCars.map(car => {
                            const equipment = getEquipmentArray(car.equipment);
                            const imageUrl = car.images && car.images.length > 0
                                ? car.images[0]
                                : content.manageCarsTab.thumbnailPlaceholder;
                            const hasValidImage = imageUrl && !failedThumbnailIds.has(car.id);

                            return (
                                <tr key={car.id}>
                                    <td>
                                        <Link to={`/bilar/${car.listing_id || car.id}`} className={styles.thumbLink}>
                                            <div className={styles.thumbFrame}>
                                                {hasValidImage ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={`${car.brand} ${car.model}`}
                                                        className={styles.thumbImg}
                                                        loading="lazy"
                                                        onError={() => markThumbnailAsFailed(car.id)}
                                                    />
                                                ) : (
                                                    <div className={styles.thumbFallback}>Ingen bild</div>
                                                )}
                                            </div>
                                        </Link>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span className={styles.carName}>{car.brand}</span>
                                            <span className={styles.carModel}>{car.model}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '600' }}>
                                                ID: {car.listing_id || car.id}
                                            </span>
                                            {(car.variant || car.color) && (
                                                <span className={styles.carModel} style={{ marginTop: '2px' }}>
                                                    {[car.variant && `${car.variant}`, car.color && `${car.color}`].filter(Boolean).join(' • ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{car.year}</td>
                                    <td>{Number(car.mileage).toLocaleString('sv-SE')} mil</td>
                                    <td><span className={styles.fuelBadge}>{car.fuel_type}</span></td>
                                    <td>
                                        {equipment.length > 0 ? (
                                            <div className={styles.equipmentPreviewList}>
                                                {equipment.slice(0, 2).map((item, idx) => (
                                                    <span key={idx} className={styles.equipmentPreviewChip}>
                                                        {item}
                                                    </span>
                                                ))}
                                                {equipment.length > 2 && (
                                                    <span className={styles.equipmentPreviewMore}>
                                                        +{equipment.length - 2} till
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={styles.mutedText}>Ingen</span>
                                        )}
                                    </td>
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
                            );
                        })}
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