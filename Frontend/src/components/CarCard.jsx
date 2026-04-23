import { Link } from 'react-router-dom';
import styles from './CarCard.module.css';
import content from '../content/siteContent.json';

// Ikoner för specifikationer
const SpeedometerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12v-4"/><path d="M12 12l3.5-2"/><path d="M12 12l-3.5-2"/><circle cx="12" cy="12" r="10"/><path d="M18 18l-1.5-1.5"/></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;


export default function CarCard({ car }) {
    const primaryImage = (car.images && car.images.length > 0)
        ? car.images[0]
        : content.carCard.placeholders.image;

    return (
        <Link to={`/bilar/${car.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img
                    src={primaryImage}
                    alt={`${car.brand} ${car.model}`}
                    className={styles.image}
                    loading="lazy"
                />
                <span className={styles.yearBadge}>{car.year}</span>
                <span className={styles.fuelBadge}>{car.fuel_type}</span>
            </div>

            <div className={styles.body}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.brand}>{car.brand}</h3>
                        <p className={styles.model}>{car.model}</p>
                    </div>
                    <p className={styles.price}>
                        {Number(car.price).toLocaleString('sv-SE')} kr
                    </p>
                </div>

                <div className={styles.specs}>
                    <div className={styles.specItem}>
                        <div className={styles.specIcon}><SpeedometerIcon /></div>
                        <div className={styles.specText}>
                            <span className={styles.specLabel}>{content.carCard.labels.mileage}</span>
                            <span className={styles.specValue}>{Number(car.mileage).toLocaleString('sv-SE')} mil</span>
                        </div>
                    </div>
                    <div className={styles.specItem}>
                        <div className={styles.specIcon}><CalendarIcon /></div>
                        <div className={styles.specText}>
                            <span className={styles.specValue}>{car.year}</span>
                            <span className={styles.specLabel}>{content.carCard.labels.year}</span>
                        </div>
                    </div>
                </div>

                {car.description && (
                    <p className={styles.description}>{car.description}</p>
                )}

                <div className={styles.footer}>
                    <span className={`btn-primary ${styles.ctaBtn}`}>
                        {content.carCard.labels.details}
                    </span>
                </div>
            </div>
        </Link>
    );
}
