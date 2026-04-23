import { useState, useRef } from 'react';
import styles from '../../pages/Admin.module.css';
import { UploadCloud } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';

export default function AddCarTab({ dealers }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        dealer_id: dealers && dealers.length > 0 ? dealers[0].id : '',
        brand: '', model: '', year: '', price: '',
        mileage: '', fuel_type: 'Bensin', description: ''
    });
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    // Sync if loaded later
    const selectedDealerId = formData.dealer_id || (dealers.length > 0 ? dealers[0].id : '');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setMessage(''); setIsSuccess(false);

        const submitData = new FormData();
        const dataToSubmit = { ...formData, dealer_id: selectedDealerId };
        Object.keys(dataToSubmit).forEach(key => submitData.append(key, dataToSubmit[key]));
        for (let i = 0; i < images.length; i++) submitData.append('images', images[i]);

        try {
            const res = await adminFetch('/cars', {
                method: 'POST',
                body: submitData
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(content.addCarTab.messages.success);
                setIsSuccess(true);
                setFormData(prev => ({ ...prev, brand: '', model: '', year: '', price: '', mileage: '', description: '' }));
                setImages([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setMessage(data.error || content.addCarTab.messages.failed);
                setIsSuccess(false);
            }
        } catch {
            setMessage(content.addCarTab.messages.network);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {message && (
                <div className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}>
                    {message}
                </div>
            )}
            <div className="glass-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{content.addCarTab.dealer.label}</label>
                        <select name="dealer_id" className="form-control" value={selectedDealerId} onChange={handleChange} required>
                            {dealers.length === 0 && <option value="">{content.addCarTab.dealer.empty}</option>}
                            {dealers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.addCarTab.labels.brand}</label>
                            <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} required placeholder={content.addCarTab.placeholders.brand} />
                        </div>
                        <div className="form-group">
                            <label>{content.addCarTab.labels.model}</label>
                            <input type="text" name="model" className="form-control" value={formData.model} onChange={handleChange} required placeholder={content.addCarTab.placeholders.model} />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.addCarTab.labels.year}</label>
                            <input type="number" name="year" className="form-control" value={formData.year} onChange={handleChange} required placeholder={content.addCarTab.placeholders.year} />
                        </div>
                        <div className="form-group">
                            <label>{content.addCarTab.labels.price}</label>
                            <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required placeholder={content.addCarTab.placeholders.price} />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.addCarTab.labels.mileage}</label>
                            <input type="number" name="mileage" className="form-control" value={formData.mileage} onChange={handleChange} required placeholder={content.addCarTab.placeholders.mileage} />
                        </div>
                        <div className="form-group">
                            <label>{content.addCarTab.labels.fuel}</label>
                            <select name="fuel_type" className="form-control" value={formData.fuel_type} onChange={handleChange}>
                                {content.addCarTab.fuelOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{content.addCarTab.labels.description}</label>
                        <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} rows="4" placeholder={content.addCarTab.placeholders.description} />
                    </div>

                    <div className="form-group">
                        <label>{content.addCarTab.labels.images}</label>
                        <div className="file-upload-zone">
                            <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} ref={fileInputRef} required />
                            <div style={{ pointerEvents: 'none' }}>
                                <UploadCloud size={32} strokeWidth={1.5} />
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>{content.addCarTab.uploadHint}</p>
                            </div>
                        </div>
                        {images.length > 0 && (
                            <p className={styles.fileCount}>{images.length} fil(er) valda</p>
                        )}
                    </div>

                    <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                        {loading ? content.addCarTab.buttons.loading : content.addCarTab.buttons.submit}
                    </button>
                </form>
            </div>
        </div>
    );
}






