import { useEffect, useMemo, useState } from 'react';
import { Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../../pages/Admin.module.css';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { CardLoadingSkeleton } from '../LoadingSkeleton';
import { adminFetch } from '../../utils/api';

export default function SellRequestsTab() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [pendingDelete, setPendingDelete] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [expandedImages, setExpandedImages] = useState({});
    const [sortedImages, setSortedImages] = useState({});
    const [draggedIndex, setDraggedIndex] = useState({});
    const [dragOverIndex, setDragOverIndex] = useState({});

    const filteredRequests = useMemo(() => {
        return requests.filter((item) => item.status === activeTab);
    }, [requests, activeTab]);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const res = await adminFetch('/sell-requests');
                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                if (isMounted) {
                    setRequests(
                        data.map((item) => ({
                            ...item,
                            status: item.status || 'active',
                        })),
                    );
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleDelete = async (id) => {
        const res = await adminFetch(`/sell-requests/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setRequests((prev) => prev.filter((item) => item.id !== id));
        }
    };

    const handleConfirm = async (id) => {
        try {
            setActionError('');
            setActionMessage('');

            const res = await adminFetch(`/sell-requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'confirmed' }),
            });

            if (!res.ok) {
                let errorText = 'Kunde inte bekräfta säljförfrågan.';
                try {
                    const data = await res.json();
                    if (data?.error) {
                        errorText = data.error;
                    }
                } catch {
                    // Ignore JSON parse errors
                }
                setActionError(errorText);
                return;
            }

            setRequests((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, status: 'confirmed' } : item,
                ),
            );
            setActionMessage('Säljförfrågan markerad som bekräftad.');
            setTimeout(() => setActionMessage(''), 2500);
        } catch (error) {
            console.error(error);
            setActionError('Nätverksfel vid bekräftelse.');
        }
    };

    const toggleImageGallery = (id) => {
        setExpandedImages(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
        
        // Initialize sorted images if not already done
        if (!sortedImages[id]) {
            const request = requests.find(r => r.id === id);
            if (request && request.images) {
                setSortedImages(prev => ({
                    ...prev,
                    [id]: [...request.images]
                }));
            }
        }
    };

    const handleDragStartImage = (requestId, index) => {
        setDraggedIndex(prev => ({
            ...prev,
            [requestId]: index
        }));
    };

    const handleDragOverImage = (e, requestId, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(prev => ({
            ...prev,
            [requestId]: index
        }));
    };

    const handleDropImage = (e, requestId, dropIndex) => {
        e.preventDefault();
        const dragIndex = draggedIndex[requestId];

        if (dragIndex === null || dragIndex === dropIndex) {
            setDraggedIndex(prev => ({ ...prev, [requestId]: null }));
            setDragOverIndex(prev => ({ ...prev, [requestId]: null }));
            return;
        }

        setSortedImages(prev => {
            const images = [...prev[requestId]];
            [images[dragIndex], images[dropIndex]] = [images[dropIndex], images[dragIndex]];
            return {
                ...prev,
                [requestId]: images
            };
        });

        setDraggedIndex(prev => ({ ...prev, [requestId]: null }));
        setDragOverIndex(prev => ({ ...prev, [requestId]: null }));
    };

    const handleDragLeaveImage = (requestId) => {
        setDragOverIndex(prev => ({ ...prev, [requestId]: null }));
    };

    const handleDragEndImage = (requestId) => {
        setDraggedIndex(prev => ({ ...prev, [requestId]: null }));
        setDragOverIndex(prev => ({ ...prev, [requestId]: null }));
    };

    if (loading) {
        return <CardLoadingSkeleton count={4} />;
    }

    const activeCount = requests.filter((item) => item.status === 'active').length;
    const confirmedCount = requests.filter((item) => item.status === 'confirmed').length;

    return (
        <div>
            {actionMessage && (
                <div className={`${styles.alert} ${styles.alertSuccess}`} style={{ marginBottom: '1rem' }}>
                    {actionMessage}
                </div>
            )}
            {actionError && (
                <div className={`${styles.alert} ${styles.alertError}`} style={{ marginBottom: '1rem' }}>
                    {actionError}
                </div>
            )}

            <div className={styles.segmentedBar}>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`${styles.segmentBtn} ${activeTab === 'active' ? styles.segmentBtnActive : ''}`}
                >
                    Aktiva ({activeCount})
                </button>
                <button
                    onClick={() => setActiveTab('confirmed')}
                    className={`${styles.segmentBtn} ${activeTab === 'confirmed' ? styles.segmentBtnActive : ''}`}
                >
                    Bekraftade ({confirmedCount})
                </button>
            </div>

            {pendingDelete && (
                <DeleteConfirmModal
                    title="Ta bort säljförfrågan?"
                    message="Den här förfrågan kommer att tas bort permanent och går inte att återställa."
                    confirmText="Ta bort"
                    cancelText="Avbryt"
                    onClose={() => setPendingDelete(null)}
                    onConfirm={async () => {
                        const item = pendingDelete;
                        setPendingDelete(null);
                        await handleDelete(item.id);
                    }}
                />
            )}

            {filteredRequests.length === 0 ? (
                <div className={styles.emptyText}>
                    {activeTab === 'active'
                        ? 'Inga aktiva säljförfrågningar.'
                        : 'Inga bekräftade säljförfrågningar.'}
                </div>
            ) : (
                <div className={styles.leadsList}>
                    {filteredRequests.map((item) => (
                        <div key={item.id} className={`glass-card ${styles.leadCard}`}>
                            <div className={styles.leadHeader}>
                                <div>
                                    <p className={styles.leadName}>{item.seller_name}</p>
                                    <p className={styles.leadContact}>
                                        {item.seller_email} · {item.seller_phone}
                                    </p>
                                </div>
                                <div className={styles.leadMeta}>
                                    <span className={styles.leadDate}>
                                        {new Date(item.created_at).toLocaleDateString('sv-SE')}
                                    </span>
                                    <span className={styles.matchBadge}>{item.reg_number}</span>
                                </div>
                            </div>

                            <div className={styles.leadPrefs}>
                                {item.car_brand && <span className={styles.prefTag}>{item.car_brand}</span>}
                                {item.car_model && <span className={styles.prefTag}>{item.car_model}</span>}
                                {item.car_year && <span className={styles.prefTag}>Årsmodell {item.car_year}</span>}
                                {item.mileage !== null && item.mileage !== undefined && (
                                    <span className={styles.prefTag}>Miltal {Number(item.mileage).toLocaleString('sv-SE')} mil</span>
                                )}
                                {item.expected_price !== null && item.expected_price !== undefined && (
                                    <span className={styles.prefTag}>Önskat pris {Number(item.expected_price).toLocaleString('sv-SE')} kr</span>
                                )}
                                <span className={styles.prefTag}>{item.has_damage ? 'Skador finns' : 'Inga skador uppgivna'}</span>
                            </div>

                            {item.damage_details && (
                                <p className={styles.leadReq}>
                                    Skador: "{item.damage_details}"
                                </p>
                            )}

                            {item.condition_notes && (
                                <p className={styles.leadReq}>
                                    Övrigt: "{item.condition_notes}"
                                </p>
                            )}

                            {item.images && item.images.length > 0 && (
                                <div className={styles.imageGallerySection}>
                                    <button
                                        onClick={() => toggleImageGallery(item.id)}
                                        className={styles.imageGalleryToggle}
                                    >
                                        <span>📸 Bilder ({item.images.length})</span>
                                        {expandedImages[item.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                    
                                    {expandedImages[item.id] && (
                                        <div className={styles.imageGalleryGrid}>
                                            {(sortedImages[item.id] || item.images).map((imageUrl, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={() => handleDragStartImage(item.id, idx)}
                                                    onDragOver={(e) => handleDragOverImage(e, item.id, idx)}
                                                    onDrop={(e) => handleDropImage(e, item.id, idx)}
                                                    onDragLeave={() => handleDragLeaveImage(item.id)}
                                                    onDragEnd={() => handleDragEndImage(item.id)}
                                                    style={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        aspectRatio: '1',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: dragOverIndex[item.id] === idx ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                                                        background: dragOverIndex[item.id] === idx ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                                        opacity: draggedIndex[item.id] === idx ? 0.5 : 1,
                                                        cursor: 'grab',
                                                        transition: 'all 0.2s ease',
                                                        transform: dragOverIndex[item.id] === idx ? 'scale(1.05)' : 'scale(1)',
                                                    }}
                                                >
                                                    <a
                                                        href={imageUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            height: '100%',
                                                            pointerEvents: draggedIndex[item.id] === idx ? 'none' : 'auto',
                                                        }}
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Bild ${idx + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s',
                                                                pointerEvents: 'none',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'scale(1.05)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'scale(1)';
                                                            }}
                                                            draggable={false}
                                                        />
                                                    </a>
                                                </div>
                                            ))}

                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.leadFooter}>
                                {activeTab === 'active' && (
                                    <button className={styles.confirmBtn} onClick={() => handleConfirm(item.id)}>
                                        <Check size={14} />
                                        <span>Bekräfta</span>
                                    </button>
                                )}
                                <button className="btn btn-danger" onClick={() => setPendingDelete({ id: item.id })}>
                                    <Trash2 size={14} />
                                    <span>Ta bort</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

