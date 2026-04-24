import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/Admin.module.css';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { CardLoadingSkeleton } from '../LoadingSkeleton';
import { Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { adminFetch, apiFetch } from '../../utils/api';
import content from '../../content/siteContent.json';

export default function LeadsTab() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' eller 'confirmed'
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');

    const filteredLeads = useMemo(() => {
        return leads.filter(l => l.status === activeTab);
    }, [leads, activeTab]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await adminFetch('/leads');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setLeads(data.map((lead) => ({
                            ...lead,
                            status: lead.status || 'active'
                        })));
                    }
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

    const handleConfirmLead = async (id) => {
        try {
            setActionError('');
            setActionMessage('');

            let res = await adminFetch(`/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'confirmed' })
            });

            if (res.status === 404) {
                res = await apiFetch(`/api/leads/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'confirmed' })
                });
            }

            if (res.ok) {
                setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'confirmed' } : l));
                setActionMessage('Lead markerad som bekräftad.');
                setTimeout(() => setActionMessage(''), 2500);
            } else {
                let errorText = 'Kunde inte bekräfta lead.';
                try {
                    const data = await res.json();
                    if (data?.error) errorText = data.error;
                } catch {
                    // ignore parse errors
                }
                setActionError(errorText);
            }
        } catch (e) {
            console.error(e);
            setActionError('Nätverksfel vid bekräftelse. Kontrollera backend.');
        }
    };

    if (loading) return <CardLoadingSkeleton count={4} />;

    const activeCount = leads.filter(l => l.status === 'active').length;
    const confirmedCount = leads.filter(l => l.status === 'confirmed').length;

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

            {/* Flikar för Aktiva/Bekräftade */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: '1rem'
            }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        background: activeTab === 'active' ? 'var(--accent)' : 'transparent',
                        color: activeTab === 'active' ? 'white' : 'var(--text-muted)',
                        border: activeTab === 'active' ? 'none' : '1px solid var(--card-border)',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        fontSize: '0.95rem'
                    }}
                >
                    📋 Aktiva ({activeCount})
                </button>
                <button
                    onClick={() => setActiveTab('confirmed')}
                    style={{
                        background: activeTab === 'confirmed' ? 'var(--accent)' : 'transparent',
                        color: activeTab === 'confirmed' ? 'white' : 'var(--text-muted)',
                        border: activeTab === 'confirmed' ? 'none' : '1px solid var(--card-border)',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        fontSize: '0.95rem'
                    }}
                >
                    ✅ Bekräftade ({confirmedCount})
                </button>
            </div>

            {filteredLeads.length === 0 ? (
                <div className={styles.emptyText}>
                    {activeTab === 'active' ? 'Inga aktiva leads' : 'Inga bekräftade leads'}
                </div>
            ) : (
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
            {filteredLeads.map(lead => (
                <div key={lead.id} className={`glass-card ${styles.leadCard}`}>
                    <div className={styles.leadHeader}>
                        <div>
                            <p className={styles.leadName}>{lead.customer_name}</p>
                            <p className={styles.leadContact}>{lead.customer_email} · {lead.customer_phone}</p>
                        </div>
                        <div className={styles.leadMeta}>
                            <span className={styles.leadDate}>{new Date(lead.created_at).toLocaleDateString('sv-SE')}</span>
                            {lead.source === 'interested' && (
                                <span style={{
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#93c5fd',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    padding: '0.15rem 0.6rem',
                                    borderRadius: '100px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>💎 Intresse-anmälan</span>
                            )}
                            {lead.source !== 'interested' && (
                                <span style={{
                                    background: 'rgba(168, 85, 247, 0.15)',
                                    color: '#d8b4fe',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    padding: '0.15rem 0.6rem',
                                    borderRadius: '100px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>📋 Kontakt-formulär</span>
                            )}
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
                                        <Link
                                            key={car.id}
                                            to={`/bilar/${car.id}`}
                                            className={styles.matchCarCardLink}
                                        >
                                            <div className={styles.matchCarCard}>
                                                <img src={(car.images && car.images[0]) || content.leadsTab.placeholders.image} alt={car.brand} />
                                                <div>
                                                    <p className={styles.matchBrand}>{car.brand} {car.model}</p>
                                                    <p className={styles.matchInfo}>{car.year} · {car.fuel_type}</p>
                                                    <p className={styles.matchPrice}>{Number(car.price).toLocaleString('sv-SE')} kr</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.leadFooter}>
                        {activeTab === 'active' && (
                            <button 
                                className={styles.confirmBtn}
                                onClick={() => handleConfirmLead(lead.id)}
                                title="Markera som bekräftad när kunden köper bilen"
                            >
                                <Check size={14} />
                                <span>Bekräfta</span>
                            </button>
                        )}
                        <button className="btn btn-danger" onClick={() => setPendingDelete({ id: lead.id })}>
                            <Trash2 size={14} />
                            <span>{content.leadsTab.buttons.delete}</span>
                        </button>
                    </div>
                </div>
            ))}
            </div>
            )}
        </div>
    );
}

