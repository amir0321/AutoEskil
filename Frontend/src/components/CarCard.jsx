import { Link } from 'react-router-dom';
import styles from './CarCard.module.css';
import content from '../content/siteContent.json';


export default function CarCard({ car }) {
    const primaryImage = (car.images && car.images.length > 0)
        ? car.images[0]
        : content.carCard.placeholders.image;
    const hasDescription = Boolean(car.description && car.description.trim());
    const formattedPrice = `${Number(car.price).toLocaleString('sv-SE')} kr`;
    const formattedMileage = `${Number(car.mileage).toLocaleString('sv-SE')} mil`;

    return (
        <Link to={`/bilar/${car.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img
                    src={primaryImage}
                    alt={`${car.brand} ${car.model}`}
                    className={styles.image}
                    loading="lazy"
                />
                <div className={styles.imageOverlay} />

                <div className={styles.imageBadgesTop}>
                    {car.fuel_type && <span className={styles.fuelBadge}>{car.fuel_type}</span>}
                </div>

                <div className={styles.imageBadgesBottom}>
                    <span className={styles.yearBadge}>{car.year}</span>
                    {car.variant && <span className={styles.glassBadge}>{car.variant}</span>}
                    {car.color && <span className={styles.glassBadge}>{car.color}</span>}
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.topRow}>
                    <div className={styles.titleWrap}>
                        <h3 className={styles.brand}>{car.brand}</h3>
                        <p className={styles.model}>{car.model}</p>
                    </div>
                    <p className={styles.price}>{formattedPrice}</p>
                </div>

                <div className={styles.specsGrid}>
                    <div className={styles.specCard}>
                        <span className={styles.specLabel}>{content.carCard.labels.mileage}</span>
                        <span className={styles.specValue}>{formattedMileage}</span>
                    </div>

                    <div className={styles.specCard}>
                        <span className={styles.specLabel}>{content.carCard.labels.year}</span>
                        <span className={styles.specValue}>{car.year}</span>
                    </div>

                    <div className={styles.specCard}>
                        <span className={styles.specLabel}>{content.carCard.labels.transmission}</span>
                        <span className={styles.specValue}>{car.transmission || 'Ej angiven'}</span>
                    </div>
                </div>

                {(car.variant || car.color || car.fuel_type) && (
                    <div className={styles.metaLine}>
                        {car.variant && <span className={styles.metaTag}>Kaross: {car.variant}</span>}
                        {car.color && <span className={styles.metaTag}>Färg: {car.color}</span>}
                        {car.fuel_type && <span className={styles.metaTag}>Drivmedel: {car.fuel_type}</span>}
                    </div>
                )}

                <p className={`${styles.description} ${!hasDescription ? styles.descriptionEmpty : ''}`}>
                    {hasDescription ? car.description : 'Ingen beskrivning tillgänglig.'}
                </p>

                <div className={styles.footer}>
                    <span className={`btn-primary ${styles.ctaBtn}`}>
                        {content.carCard.labels.details}
                        <span className={styles.ctaArrow} aria-hidden="true">→</span>
                    </span>
                </div>
            </div>
        </Link>
    );
}
