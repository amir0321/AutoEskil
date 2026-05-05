import { useState, useEffect } from 'react';
import styles from '../../pages/Admin.module.css';
import MessageModal from '../MessageModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit as EditIcon, Save, X } from 'lucide-react';
import { CardLoadingSkeleton } from '../LoadingSkeleton';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';
import { Link } from 'react-router-dom';

export default function DealersTab({ onDealerAdded, onDealerDeleted }) {
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '' });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [editingDealerId, setEditingDealerId] = useState(null);
    const [editingDealerForm, setEditingDealerForm] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await adminFetch('/dealers');
                if (res.ok) {
                    const data = await res.json();
                    const sortedData = data.sort((a, b) => b.id - a.id);
                    if (isMounted) setDealers(sortedData);                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, []);

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const res = await adminFetch('/dealers');
            if (res.ok) {
                const data = await res.json();
                const sortedData = data.sort((a, b) => b.id - a.id);
                setDealers(sortedData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    const validateForm = (formToValidate) => {
        const errors = {};
        if (!formToValidate.name || formToValidate.name.trim().length < 2) {
            errors.name = 'Företagsnamn måste vara minst 2 tecken';
        }
        if (!formToValidate.contact_person || formToValidate.contact_person.trim().length < 2) {
            errors.contact_person = 'Kontaktperson måste vara minst 2 tecken';
        }
        if (!formToValidate.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formToValidate.email)) {
            errors.email = 'Giltigt e-postformat krävs';
        }
        if (!formToValidate.phone || formToValidate.phone.trim().length < 7) {
            errors.phone = 'Telefonnummer måste vara minst 7 siffror/tecken';
        }
        return errors;
    };

    const handleDelete = async (id) => {
        try {
            const res = await adminFetch(`/dealers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDealers(prev => prev.filter(d => d.id !== id));
                if (onDealerDeleted) onDealerDeleted();
            } else {
                const errorData = await res.json();
                setErrorMessage(content.dealersTab.messages.deleteFailed.replace('{error}', errorData.error || 'Okänt fel'));
            }
        } catch (e) {
            console.error(e);
            setErrorMessage(content.dealersTab.messages.deleteNetwork);
        }
    };

    const startEditingDealer = (dealer) => {
        setEditingDealerId(dealer.id);
        setEditingDealerForm({ ...dealer });
    };

    const cancelEditingDealer = () => {
        setEditingDealerId(null);
        setEditingDealerForm(null);
    };

    const saveEditingDealer = async (dealerId) => {
        if (!editingDealerForm) return;

        const errors = validateForm(editingDealerForm);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        try {
            const res = await adminFetch(`/dealers/${dealerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingDealerForm)
            });
            if (res.ok) {
                const data = await res.json().catch(() => null);
                const updatedDealer = data?.dealer;

                setDealers(prev => prev.map(d => {
                    if (d.id !== dealerId) return d;

                    if (updatedDealer && updatedDealer.id === dealerId) {
                        return {
                            ...d,
                            ...updatedDealer,
                            cars: Array.isArray(updatedDealer.cars) ? updatedDealer.cars : d.cars,
                        };
                    }

                    return {
                        ...d,
                        name: editingDealerForm.name,
                        contact_person: editingDealerForm.contact_person,
                        email: editingDealerForm.email,
                        phone: editingDealerForm.phone,
                    };
                }));
                setEditingDealerId(null);
                setEditingDealerForm(null);
                setMessage('Handlare uppdaterad!');
            } else {
                const errorData = await res.json();
                setErrorMessage(errorData.error || 'Kunde inte uppdatera handlare');
            }
        } catch (e) {
            console.error(e);
            setErrorMessage('Nätverksfel vid uppdatering');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});
        setSaving(true); setMessage('');
        try {
            const res = await adminFetch('/dealers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(content.dealersTab.messages.added);
                setShowForm(false);
                setForm({ name: '', contact_person: '', email: '', phone: '' });
                fetchDealers();
                if (onDealerAdded) onDealerAdded();
            } else {
                setMessage(data.error || content.dealersTab.messages.failed);
            }
        } catch {
            setMessage(content.dealersTab.messages.network);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {pendingDelete && (
                <DeleteConfirmModal
                    title={content.dealersTab.deleteModal.title.replace('{name}', pendingDelete.name)}
                    message={content.dealersTab.deleteModal.message}
                    confirmText={content.dealersTab.deleteModal.confirm}
                    cancelText={content.dealersTab.deleteModal.cancel}
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
                    onClose={() => setErrorMessage('')}
                />
            )}
            {message && <div className={`${styles.alert} ${styles.alertSuccess}`}>{message}</div>}

            <div className={styles.dealerActions}>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setFormErrors({});
                    }}
                >
                    {showForm ? content.dealersTab.buttons.cancel : <><Plus size={16} /> {content.dealersTab.buttons.add}</>}
                </button>
            </div>

            {showForm && (
                <div className={`solid-card ${styles.addDealerForm}`}>
                    <h3 className={styles.subheading}>{content.dealersTab.title}</h3>
                    <form onSubmit={handleAdd}>
                        <div className="grid-2">
                            <div className={`form-group ${formErrors.name ? styles.formGroupError : ''}`}>
                                <label>{content.dealersTab.labels.name}</label>
                                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder={content.dealersTab.placeholders.name} />
                                {formErrors.name && <div className={styles.errorMessage}>❌ {formErrors.name}</div>}
                            </div>
                            <div className={`form-group ${formErrors.contact_person ? styles.formGroupError : ''}`}>
                                <label>{content.dealersTab.labels.contactPerson}</label>
                                <input type="text" className="form-control" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} required placeholder={content.dealersTab.placeholders.contactPerson} />
                                {formErrors.contact_person && <div className={styles.errorMessage}>❌ {formErrors.contact_person}</div>}
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className={`form-group ${formErrors.email ? styles.formGroupError : ''}`}>
                                <label>{content.dealersTab.labels.email}</label>
                                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder={content.dealersTab.placeholders.email} />
                                {formErrors.email && <div className={styles.errorMessage}>❌ {formErrors.email}</div>}
                            </div>
                            <div className={`form-group ${formErrors.phone ? styles.formGroupError : ''}`}>
                                <label>{content.dealersTab.labels.phone}</label>
                                <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder={content.dealersTab.placeholders.phone} />
                                {formErrors.phone && <div className={styles.errorMessage}>❌ {formErrors.phone}</div>}
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? content.dealersTab.buttons.saving : content.dealersTab.buttons.save}</button>
                    </form>
                </div>
            )}

            {loading ? (
                <CardLoadingSkeleton count={3} />
            ) : dealers.length === 0 ? (
                <div className={styles.emptyText}>{content.dealersTab.messages.empty}</div>
            ) : (
                <div className={styles.dealerList}>
                    {dealers.map(dealer => (
                        <div 
                            key={dealer.id} 
                            className={`glass-card ${styles.dealerCard} ${editingDealerId === dealer.id ? styles.dealerEditMode : ''}`}
                        >
                            {editingDealerId === dealer.id ? (
                                <form onSubmit={(e) => { e.preventDefault(); saveEditingDealer(dealer.id); }}>
                                    <div className="grid-2">
                                        <div className={`form-group ${formErrors.name ? styles.formGroupError : ''}`}>
                                            <label>{content.dealersTab.labels.name}</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={editingDealerForm.name} 
                                                onChange={e => setEditingDealerForm({ ...editingDealerForm, name: e.target.value })} 
                                                required 
                                            />
                                            {formErrors.name && <div className={styles.errorMessage}>❌ {formErrors.name}</div>}
                                        </div>
                                        <div className={`form-group ${formErrors.contact_person ? styles.formGroupError : ''}`}>
                                            <label>{content.dealersTab.labels.contactPerson}</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={editingDealerForm.contact_person} 
                                                onChange={e => setEditingDealerForm({ ...editingDealerForm, contact_person: e.target.value })} 
                                                required 
                                            />
                                            {formErrors.contact_person && <div className={styles.errorMessage}>❌ {formErrors.contact_person}</div>}
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div className={`form-group ${formErrors.email ? styles.formGroupError : ''}`}>
                                            <label>{content.dealersTab.labels.email}</label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                value={editingDealerForm.email} 
                                                onChange={e => setEditingDealerForm({ ...editingDealerForm, email: e.target.value })} 
                                                required 
                                            />
                                            {formErrors.email && <div className={styles.errorMessage}>❌ {formErrors.email}</div>}
                                        </div>
                                        <div className={`form-group ${formErrors.phone ? styles.formGroupError : ''}`}>
                                            <label>{content.dealersTab.labels.phone}</label>
                                            <input 
                                                type="tel" 
                                                className="form-control" 
                                                value={editingDealerForm.phone} 
                                                onChange={e => setEditingDealerForm({ ...editingDealerForm, phone: e.target.value })} 
                                                required 
                                            />
                                            {formErrors.phone && <div className={styles.errorMessage}>❌ {formErrors.phone}</div>}
                                        </div>
                                    </div>
                                    <div className={styles.editActions}>
                                        <button type="submit" className={`${styles.editSaveBtn}`}>
                                            <Save size={14} style={{ marginRight: '0.3rem' }} />
                                            Spara
                                        </button>
                                        <button type="button" className={styles.editCancelBtn} onClick={cancelEditingDealer}>
                                            <X size={14} style={{ marginRight: '0.3rem' }} />
                                            Avbryt
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className={styles.dealerHeader}>
                                        <div className={styles.dealerInfo}>
                                            <p className={styles.dealerName}>{dealer.name}</p>
                                            <p className={styles.dealerContact}>{dealer.contact_person} · {dealer.email} · {dealer.phone}</p>
                                            <p className={styles.dealerCarCount}>{dealer.cars ? dealer.cars.length : 0} bil(ar) i lager</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" onClick={() => startEditingDealer(dealer)}>
                                                <EditIcon size={14} />
                                                <span>Redigera</span>
                                            </button>
                                            <button className="btn btn-danger" onClick={() => setPendingDelete({ id: dealer.id, name: dealer.name })}>
                                                <Trash2 size={14} />
                                                <span>{content.dealersTab.buttons.delete}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {dealer.cars && dealer.cars.length > 0 && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <button
                                                className={styles.expandBtn}
                                                onClick={() => setExpanded(expanded === dealer.id ? null : dealer.id)}
                                            >
                                                {expanded === dealer.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                {expanded === dealer.id ? content.dealersTab.buttons.hideCars : content.dealersTab.buttons.showCars.replace('{count}', dealer.cars.length)}
                                            </button>
                                            {expanded === dealer.id && (
                                                <div className={styles.matchGrid} style={{ marginTop: '1rem' }}>
                                                    {dealer.cars.map(car => (
                                                            <Link key={car.id} to={`/bilar/${car.listing_id || car.id}`} className={styles.matchCarCardLink}>
                                                            <div className={styles.matchCarCard}>
                                                                <img src={(car.images && car.images[0]) || 'https://placehold.co/120x80?text=Img'} alt={car.brand} />
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
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}





