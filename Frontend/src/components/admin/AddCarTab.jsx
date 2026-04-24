import { useState, useRef } from 'react';
import styles from '../../pages/Admin.module.css';
import { UploadCloud, X } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import content from '../../content/siteContent.json';

export default function AddCarTab({ dealers }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [formData, setFormData] = useState({
        dealer_id: dealers && dealers.length > 0 ? dealers[0].id : '',
        brand: '', model: '', variant: '', color: '', year: '', price: '',
        mileage: '', fuel_type: 'Bensin', transmission: 'Automat', description: ''
    });
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    const selectedDealerId = formData.dealer_id || (dealers.length > 0 ? dealers[0].id : '');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImageSelect = (files) => {
        const newFiles = Array.from(files);
        const totalSize = Array.from(images).reduce((acc, f) => acc + f.size, 0) + 
                         newFiles.reduce((acc, f) => acc + f.size, 0);
        
        if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
            setFormErrors(prev => ({ ...prev, images: 'Total filstorlek får inte överstiga 50MB' }));
            return;
        }

        setImages(prev => [...prev, ...newFiles]);
        
        // Create previews
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, { id: Math.random(), src: e.target.result, name: file.name }]);
            };
            reader.readAsDataURL(file);
        });

        if (formErrors.images) {
            setFormErrors(prev => ({ ...prev, images: '' }));
        }
    };

    const removeImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, i) => i !== indexToRemove));
        setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
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
            handleImageSelect(e.dataTransfer.files);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.brand || formData.brand.trim().length < 2) {
            errors.brand = 'Märke måste vara minst 2 tecken';
        }
        if (!formData.model || formData.model.trim().length < 1) {
            errors.model = 'Modell är obligatorisk';
        }
        const year = parseInt(formData.year);
        if (!formData.year || year < 1950 || year > new Date().getFullYear() + 1) {
            errors.year = `Årgången måste vara mellan 1950 och ${new Date().getFullYear() + 1}`;
        }
        const price = parseInt(formData.price);
        if (!formData.price || price <= 0) {
            errors.price = 'Pris måste vara större än 0';
        }
        const mileage = parseInt(formData.mileage);
        if (!formData.mileage || mileage < 0) {
            errors.mileage = 'Miltal kan inte vara negativt';
        }
        if (images.length === 0) {
            errors.images = 'Minst en bild är obligatorisk';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setMessage('');
            return;
        }
        setFormErrors({});
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
                setFormData(prev => ({
                    ...prev,
                    brand: '',
                    model: '',
                    variant: '',
                    color: '',
                    year: '',
                    price: '',
                    mileage: '',
                    transmission: 'Automat',
                    description: ''
                }));
                setImages([]);
                setImagePreviews([]);
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
                        <div className={`form-group ${formErrors.brand ? styles.formGroupError : ''}`}>
                            <label>{content.addCarTab.labels.brand}</label>
                            <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} required placeholder={content.addCarTab.placeholders.brand} />
                            {formErrors.brand && <div className={styles.errorMessage}>❌ {formErrors.brand}</div>}
                        </div>
                        <div className={`form-group ${formErrors.model ? styles.formGroupError : ''}`}>
                            <label>{content.addCarTab.labels.model}</label>
                            <input type="text" name="model" className="form-control" value={formData.model} onChange={handleChange} required placeholder={content.addCarTab.placeholders.model} />
                            {formErrors.model && <div className={styles.errorMessage}>❌ {formErrors.model}</div>}
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>{content.addCarTab.labels.variant}</label>
                            <select name="variant" className="form-control" value={formData.variant} onChange={handleChange}>
                                <option value="">{content.addCarTab.placeholders.variant}</option>
                                {content.addCarTab.bodyTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{content.addCarTab.labels.color}</label>
                            <input type="text" name="color" className="form-control" value={formData.color} onChange={handleChange} placeholder={content.addCarTab.placeholders.color} />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className={`form-group ${formErrors.year ? styles.formGroupError : ''}`}>
                            <label>{content.addCarTab.labels.year}</label>
                            <input type="number" name="year" className="form-control" value={formData.year} onChange={handleChange} required placeholder={content.addCarTab.placeholders.year} />
                            {formErrors.year && <div className={styles.errorMessage}>❌ {formErrors.year}</div>}
                        </div>
                        <div className={`form-group ${formErrors.price ? styles.formGroupError : ''}`}>
                            <label>{content.addCarTab.labels.price}</label>
                            <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required placeholder={content.addCarTab.placeholders.price} />
                            {formErrors.price && <div className={styles.errorMessage}>❌ {formErrors.price}</div>}
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className={`form-group ${formErrors.mileage ? styles.formGroupError : ''}`}>
                            <label>{content.addCarTab.labels.mileage}</label>
                            <input type="number" name="mileage" className="form-control" value={formData.mileage} onChange={handleChange} required placeholder={content.addCarTab.placeholders.mileage} />
                            {formErrors.mileage && <div className={styles.errorMessage}>❌ {formErrors.mileage}</div>}
                        </div>
                        <div className="form-group">
                            <label>{content.addCarTab.labels.transmission}</label>
                            <select name="transmission" className="form-control" value={formData.transmission} onChange={handleChange}>
                                {content.addCarTab.transmissionOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid-2">
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
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={(e) => handleImageSelect(e.target.files)} 
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <div 
                            className="file-upload-zone"
                            style={{
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
                            <div>
                                <UploadCloud size={32} strokeWidth={1.5} />
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Dra och släpp bilder här eller klicka för att välja
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                    Max 50MB totalt • JPG, PNG, WebP
                                </p>
                            </div>
                        </div>
                        {formErrors.images && <div className={styles.errorMessage}>❌ {formErrors.images}</div>}
                        
                        {/* Image Preview Grid */}
                        {imagePreviews.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: '0.75rem',
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px'
                            }}>
                                {imagePreviews.map((preview, idx) => (
                                    <div key={preview.id} style={{
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        aspectRatio: '1',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        border: '2px solid var(--card-border)'
                                    }}>
                                        <img 
                                            src={preview.src} 
                                            alt={preview.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
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
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            left: '0',
                                            right: '0',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                            padding: '0.5rem 0.4rem 0.2rem',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            textAlign: 'center',
                                            wordBreak: 'break-all'
                                        }}>
                                            #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <p className={styles.fileCount} style={{ marginTop: imagePreviews.length > 0 ? '0.5rem' : '0' }}>
                            {imagePreviews.length === 0 ? '0' : imagePreviews.length} bild(er) valda
                        </p>
                    </div>

                    <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading} style={{ cursor: 'pointer' }}>
                        {loading ? content.addCarTab.buttons.loading : content.addCarTab.buttons.submit}
                    </button>
                </form>
            </div>
        </div>
    );
}






