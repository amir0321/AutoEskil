import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './InterestedModal.module.css';
import { apiUrl } from '../utils/api';
import ReCAPTCHA from "react-google-recaptcha";
import { RECAPTCHA_SITE_KEY } from "../utils/recaptcha";

export default function InterestedModal({ carId, carBrand, carModel, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        requirements: '',
        website: ''
    });
    const [formStartedAt] = useState(() => Date.now());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [recaptchaToken, setRecaptchaToken] = useState('');

    const validateForm = () => {
        const errors = {};
        if (!formData.customer_name || formData.customer_name.trim().length < 2) {
            errors.customer_name = 'Namn måste vara minst 2 tecken';
        }
        if (!formData.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
            errors.customer_email = 'Giltigt e-postformat krävs';
        }
        if (!formData.customer_phone || formData.customer_phone.trim().length < 7) {
            errors.customer_phone = 'Telefonnummer måste vara minst 7 tecken';
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setError('');
            return;
        }
        if (!recaptchaToken) {
            setError("Vänligen bekräfta att du inte är en robot.");
            return;
        }
        setFormErrors({});
        setError('');
        setLoading(true);

        try {
            const response = await fetch(apiUrl('/api/leads'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: formData.customer_name,
                    customer_email: formData.customer_email,
                    customer_phone: formData.customer_phone,
                    requirements: formData.requirements,
                    website: formData.website,
                    form_started_at: formStartedAt,
                    preferred_brand: carBrand,
                    preferred_model: carModel,
                    source: 'interested',
                    recaptchaToken: recaptchaToken
                })
            });

            if (response.ok) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Kunde inte skapa intresse-anmälan. Försök igen.');
            }
        } catch (err) {
            setError('Nätverksfel. Försök igen senare.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Intresserad av denna bil?</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.carInfo}>
                    <p><strong>{carBrand} {carModel}</strong></p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="customer_name">Namn *</label>
                        <input
                            type="text"
                            id="customer_name"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            placeholder="Ditt namn"
                            className={formErrors.customer_name ? styles.inputError : ''}
                        />
                        {formErrors.customer_name && (
                            <div className={styles.errorMessage}>❌ {formErrors.customer_name}</div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="customer_email">E-post *</label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            placeholder="din@email.se"
                            className={formErrors.customer_email ? styles.inputError : ''}
                        />
                        {formErrors.customer_email && (
                            <div className={styles.errorMessage}>❌ {formErrors.customer_email}</div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="customer_phone">Telefon *</label>
                        <input
                            type="tel"
                            id="customer_phone"
                            name="customer_phone"
                            value={formData.customer_phone}
                            onChange={handleChange}
                            placeholder="070-123 45 67"
                            className={formErrors.customer_phone ? styles.inputError : ''}
                        />
                        {formErrors.customer_phone && (
                            <div className={styles.errorMessage}>❌ {formErrors.customer_phone}</div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="website" style={{ position: 'absolute', left: '-9999px' }}>
                            Lämna detta fält tomt
                        </label>
                        <input
                            type="text"
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            tabIndex="-1"
                            autoComplete="off"
                            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                            aria-hidden="true"
                        />

                        <label htmlFor="requirements">Meddelande (valfritt)</label>
                        <textarea
                            id="requirements"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            placeholder="Säg något om intresset eller dina frågor..."
                            rows="3"
                        />
                    </div>

                    <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <ReCAPTCHA
                            sitekey={RECAPTCHA_SITE_KEY}
                            onChange={(token) => setRecaptchaToken(token)}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Avbryt
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Skickar...' : 'Skicka intresse-anmälan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
