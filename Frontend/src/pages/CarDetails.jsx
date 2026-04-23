import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { apiUrl } from '../utils/api';
import styles from './CarDetails.module.css';

// Ikoner
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const SpeedometerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 12v-4m0 4l3.5-2M12 12l-3.5-2"/><circle cx="12" cy="12" r="10"/><path d="M18 18l-1.5-1.5"/></svg>;
const FuelIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><path d="M3.5 6h17L22 12l-1.5 6h-17L2 12l1.5-6z"/><path d="M8 12h8"/></svg>;


export const route = {
    path: "/bilar/:id",
};

export default function CarDetails() {
    const { id } = useParams();
    const [car, loading, error] = useFetch(apiUrl(`/api/cars/${id}`));
    const [activeImage, setActiveImage] = useState(0);

    if (loading) {
        return <div className={styles.loading}>Laddar bildata...</div>;
    }

    if (error || !car) {
        return <div className={styles.error}>Bilen kunde inte hittas.</div>;
    }

    const allImages = car.images && car.images.length > 0
        ? car.images
        : ['https://placehold.co/800x600?text=Ingen+bild'];

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.imageGallery}>
                    <div className={styles.primaryImageWrapper}>
                        <img src={allImages[activeImage]} alt={`${car.brand} ${car.model}`} className={styles.primaryImage} />
                    </div>
                    {allImages.length > 1 && (
                        <div className={styles.secondaryImages}>
                            {allImages.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Bild ${index + 1}`}
                                    className={`${styles.secondaryImage} ${index === activeImage ? styles.activeThumbnail : ''}`}
                                    onClick={() => setActiveImage(index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.detailsCard}>
                    <div className="solid-card">
                        <h1 className={styles.title}>{car.brand} <span className={styles.model}>{car.model}</span></h1>
                        <p className={styles.price}>{Number(car.price).toLocaleString('sv-SE')} kr</p>

                        <div className={styles.specs}>
                            <div className={styles.specItem}><CalendarIcon /> {car.year}</div>
                            <div className={styles.specItem}><SpeedometerIcon /> {Number(car.mileage).toLocaleString('sv-SE')} mil</div>
                            <div className={styles.specItem}><FuelIcon /> {car.fuel_type}</div>
                        </div>

                        <h2 className={styles.sectionTitle}>Beskrivning</h2>
                        <p className={styles.description}>{car.description || 'Ingen beskrivning tillgänglig.'}</p>

                        <a href="/hitta-bil" className={`btn-primary ${styles.ctaButton}`}>
                            Kontakta oss om denna bil
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
