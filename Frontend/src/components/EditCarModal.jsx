import { useState, useEffect, useRef } from 'react';
import styles from './EditCarModal.module.css';
import { adminFetch } from '../utils/api';
import content from '../content/siteContent.json';

export default function EditCarModal({ car, onClose, onCarUpdated }) {
    const [formData, setFormData] = useState({ ...car });
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState(car.images || []);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Lyssna efter Escape-tangenten för att stänga modalen
        const handleEsc = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);

        // Clean up previous previews
        previewImages.forEach(url => URL.revokeObjectURL(url));

        // Create new previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(newPreviews);
    };

    const handleRemoveExistingImage = (imgUrl) => {
        setExistingImages(prev => prev.filter(url => url !== imgUrl));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'images') submitData.append(key, formData[key]);
        });

        // Lägg till befintliga bilder som ska behållas
        existingImages.forEach(url => submitData.append('images', url));

        // Lägg till nya bilder
        for (let i = 0; i < images.length; i++) {
            submitData.append('images', images[i]);
        }

        try {
            const res = await adminFetch(`/cars/${car.id}`, {
                method: 'PUT',
                body: submitData
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(content.editCarModal.messages.updated);
                setIsSuccess(true);
                onCarUpdated(); // Uppdatera listan i bakgrunden
                setTimeout(onClose, 1500); // Stäng modalen efter en kort fördröjning
            } else {
                setMessage(data.error || content.editCarModal.messages.failed);
                setIsSuccess(false);
            }
        } catch {
            setMessage(content.editCarModal.messages.network);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`solid-card ${styles.modalContent}`} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{content.editCarModal.title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                {message && (
                    <div className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.editCarModal.labels.brand}</label>
                            <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>{content.editCarModal.labels.model}</label>
                            <input type="text" name="model" className="form-control" value={formData.model} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.editCarModal.labels.year}</label>
                            <input type="number" name="year" className="form-control" value={formData.year} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>{content.editCarModal.labels.price}</label>
                            <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.editCarModal.labels.mileage}</label>
                            <input type="number" name="mileage" className="form-control" value={formData.mileage} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>{content.editCarModal.labels.fuel}</label>
                            <select name="fuel_type" className="form-control" value={formData.fuel_type} onChange={handleChange}>
                                {content.editCarModal.fuelOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{content.editCarModal.labels.description}</label>
                        <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} rows="4" />
                    </div>

                    <div className="form-group">
                        <label>{content.editCarModal.labels.images}</label>
                        <div className={styles.imageManager}>
                            {existingImages.map(url => (
                                <div key={url} className={styles.imagePreview}>
                                    <img src={url} alt="Befintlig bild" />
                                    <button type="button" onClick={() => handleRemoveExistingImage(url)}>&times;</button>
                                </div>
                            ))}
                            {previewImages.map((url, index) => (
                                <div key={`new-${index}`} className={styles.imagePreview}>
                                    <img src={url} alt={content.editCarModal.messages.newPreview} style={{ border: '2px solid var(--accent)' }}/>
                                    <div style={{ position: 'absolute', bottom: '0', background: 'rgba(0,0,0,0.5)', color: '#fff', width: '100%', fontSize: '0.7rem', textAlign: 'center' }}>{content.editCarModal.actions.newImage}</div>
                                </div>
                            ))}
                        </div>
                        <div className="file-upload-zone" style={{ marginTop: '1rem' }}>
                            <input type="file" multiple accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                            <p>{content.editCarModal.actions.addImages}</p>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className="btn-secondary" onClick={onClose}>{content.editCarModal.actions.cancel}</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? content.editCarModal.actions.saving : content.editCarModal.actions.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
