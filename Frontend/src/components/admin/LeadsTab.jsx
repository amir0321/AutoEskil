import { useState, useEffect } from 'react';
import styles from '../../pages/Admin.module.css';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';

export default function LeadsTab() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await adminFetch('/leads');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setLeads(data);
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

    const handleDelete = async (id) => {
        const res = await adminFetch(`/leads/${id}`, { method: 'DELETE' });
        if (res.ok) setLeads(prev => prev.filter(l => l.id !== id));
    };

    if (loading) return <div className={styles.loadingText}>{content.leadsTab.loading}</div>;
    if (leads.length === 0) return <div className={styles.emptyText}>{content.leadsTab.empty}</div>;

    return (
        <div className={styles.leadsList}>
            {pendingDelete && (
                <DeleteConfirmModal
                    title={content.leadsTab.deleteModal.title}
                    message={content.leadsTab.deleteModal.message}
                    confirmText={content.leadsTab.deleteModal.confirm}
                    cancelText={content.leadsTab.deleteModal.cancel}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={async () => {
                        const item = pendingDelete;
                        setPendingDelete(null);
                        await handleDelete(item.id);
                    }}
                />
            )}
            {leads.map(lead => (
                <div key={lead.id} className={`glass-card ${styles.leadCard}`}>
                    <div className={styles.leadHeader}>
                        <div>
                            <p className={styles.leadName}>{lead.customer_name}</p>
                            <p className={styles.leadContact}>{lead.customer_email} · {lead.customer_phone}</p>
                        </div>
                        <div className={styles.leadMeta}>
                            <span className={styles.leadDate}>{new Date(lead.created_at).toLocaleDateString('sv-SE')}</span>
                            {lead.matches && lead.matches.length > 0 && (
                                <span className={styles.matchBadge}>{lead.matches.length} {content.leadsTab.matchLabel}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.leadPrefs}>
                        {lead.preferred_brand && <span className={styles.prefTag}>{lead.preferred_brand} {lead.preferred_model}</span>}
                        {lead.preferred_fuel_type && <span className={styles.prefTag}>{lead.preferred_fuel_type}</span>}
                        {lead.max_budget && <span className={styles.prefTag}>Max {Number(lead.max_budget).toLocaleString('sv-SE')} kr</span>}
                        {lead.min_year && <span className={styles.prefTag}>Från {lead.min_year}</span>}
                        {lead.max_mileage && <span className={styles.prefTag}>Max {Number(lead.max_mileage).toLocaleString('sv-SE')} mil</span>}
                    </div>

                    {lead.requirements && (
                        <p className={styles.leadReq}>"{lead.requirements}"</p>
                    )}

                    {lead.matches && lead.matches.length > 0 && (
                        <div className={styles.leadMatches}>
                            <button
                                className={styles.expandBtn}
                                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                            >
                                {expanded === lead.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {expanded === lead.id ? content.leadsTab.buttons.hideMatches : content.leadsTab.buttons.showMatches.replace('{count}', lead.matches.length)}
                            </button>
                            {expanded === lead.id && (
                                <div className={styles.matchGrid}>
                                    {lead.matches.map(car => (
                                        <div key={car.id} className={styles.matchCarCard}>
                                            <img src={(car.images && car.images[0]) || content.leadsTab.placeholders.image} alt={car.brand} />
                                            <div>
                                                <p className={styles.matchBrand}>{car.brand} {car.model}</p>
                                                <p className={styles.matchInfo}>{car.year} · {car.fuel_type}</p>
                                                <p className={styles.matchPrice}>{Number(car.price).toLocaleString('sv-SE')} kr</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.leadFooter}>
                        <button className="btn btn-danger" onClick={() => setPendingDelete({ id: lead.id })}>
                            <Trash2 size={14} />
                            <span>{content.leadsTab.buttons.delete}</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}


