import { useState, useEffect, useRef } from 'react';
import styles from './EditCarModal.module.css';
import { adminFetch } from '../utils/api';
import content from '../content/siteContent.json';
import { X, UploadCloud, Check, AlertCircle } from 'lucide-react';

export default function EditCarModal({ car, onClose, onCarUpdated }) {
    const [formData, setFormData] = useState({ ...car });
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState(car.images || []);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [dragActive, setDragActive] = useState(false);
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
        setImages(prev => [...prev, ...files]);

        // Create new previews
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            setPreviewImages(prev => [...prev, { id: Math.random(), url, name: file.name }]);
        });
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    const removeExistingImage = (imgUrl) => {
        setExistingImages(prev => prev.filter(url => url !== imgUrl));
    };

    const removeNewImage = (id) => {
        setPreviewImages(prev => prev.filter(p => p.id !== id));
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
        images.forEach(file => submitData.append('images', file));

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
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                {message && (
                    <div className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isSuccess ? <Check size={18} /> : <AlertCircle size={18} />}
                            <span>{message}</span>
                        </div>
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
                            <label>{content.editCarModal.labels.variant}</label>
                            <select name="variant" className="form-control" value={formData.variant || ''} onChange={handleChange}>
                                <option value="">Välj kaross</option>
                                {content.editCarModal.bodyTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{content.editCarModal.labels.color}</label>
                            <input type="text" name="color" className="form-control" value={formData.color || ''} onChange={handleChange} />
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
                            <label>{content.editCarModal.labels.transmission}</label>
                            <select name="transmission" className="form-control" value={formData.transmission || ''} onChange={handleChange}>
                                <option value="">Välj växellåda</option>
                                {content.editCarModal.transmissionOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid-2">
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
                        
                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📸 Befintliga bilder</p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '0.75rem'
                                }}>
                                    {existingImages.map(url => (
                                        <div key={url} style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            aspectRatio: '1',
                                            border: '2px solid var(--accent)'
                                        }}>
                                            <img src={url} alt="Befintlig" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(url)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'rgba(239, 68, 68, 0.9)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(220, 38, 38, 1)'}
                                                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.9)'}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Images Preview */}
                        {previewImages.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>✨ Nya bilder</p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '0.75rem'
                                }}>
                                    {previewImages.map((preview, idx) => (
                                        <div key={preview.id} style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            aspectRatio: '1',
                                            border: '2px solid #10b981'
                                        }}>
                                            <img src={preview.url} alt="Ny" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                left: '0',
                                                right: '0',
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                                padding: '0.3rem 0.4rem',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                textAlign: 'center'
                                            }}>
                                                #{idx + 1}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(preview.id)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'rgba(239, 68, 68, 0.9)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(220, 38, 38, 1)'}
                                                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.9)'}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload Zone */}
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <div 
                            className="file-upload-zone"
                            style={{
                                marginTop: '1rem',
                                borderColor: dragActive ? 'var(--accent)' : 'var(--card-border)',
                                backgroundColor: dragActive ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud size={32} strokeWidth={1.5} />
                            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                Dra bilder här eller klicka för att välja
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                JPG, PNG, WebP
                            </p>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose}
                            style={{ minWidth: '120px' }}
                        >
                            Avbryt
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading}
                            style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {loading ? (
                                <>
                                    <span>Sparar...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Spara ändringar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
