import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './CarCard.module.css';
import content from '../content/siteContent.json';

export default function CarCard({ car }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const trackRef = useRef(null);

    const images = (car.images && car.images.length > 0)
        ? car.images
        : [content.carCard.placeholders.image];

    const formattedPrice = `${Number(car.price).toLocaleString('sv-SE')} kr`;
    const formattedMileage = `${Number(car.mileage).toLocaleString('sv-SE')} mil`;
    const carRouteId = car.listing_id || car.id;
    const listingId = car.listing_id || car.id;

    const handleScroll = () => {
        if (!trackRef.current) return;
        const index = Math.round(trackRef.current.scrollLeft / trackRef.current.clientWidth);
        setCurrentIndex(index);
    };

    const scrollToIndex = (index) => {
        if (!trackRef.current) return;
        trackRef.current.scrollTo({
            left: index * trackRef.current.clientWidth,
            behavior: 'smooth'
        });
    };

    const goNext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex < images.length - 1) {
            scrollToIndex(currentIndex + 1);
        }
    };

    const goPrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex > 0) {
            scrollToIndex(currentIndex - 1);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <div 
                    className={styles.carouselTrack} 
                    ref={trackRef} 
                    onScroll={handleScroll}
                >
                    {images.map((img, idx) => (
                        <Link 
                            to={`/bilar/${carRouteId}`} 
                            className={styles.slide} 
                            key={`${img}-${idx}`}
                            tabIndex={idx === currentIndex ? "0" : "-1"}
                        >
                            <img
                                src={img}
                                alt={`${car.brand} ${car.model} - Bild ${idx + 1}`}
                                className={styles.image}
                                loading={idx === 0 ? "eager" : "lazy"}
                            />
                            <div className={styles.imageOverlay} />
                        </Link>
                    ))}
                </div>

                <div className={styles.imageBadgesTop}>
                    {car.fuel_type && <span className={styles.fuelBadge}>{car.fuel_type}</span>}
                </div>

                {images.length > 1 && (
                    <div className={styles.imageCounter}>
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                <div className={styles.imageBadgesBottom}>
                    <span className={styles.yearBadge}>{car.year}</span>
                    {car.variant && <span className={styles.glassBadge}>{car.variant}</span>}
                    {car.color && <span className={styles.glassBadge}>{car.color}</span>}
                    {car.location && <span className={styles.glassBadge}>{car.location}</span>}
                </div>

                {images.length > 1 && (
                    <div className={styles.paginationDots}>
                        {images.map((_, idx) => (
                            <span 
                                key={idx} 
                                className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`} 
                            />
                        ))}
                    </div>
                )}

                {images.length > 1 && currentIndex > 0 && (
                    <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={goPrev} aria-label="Föregående bild">
                        ‹
                    </button>
                )}
                {images.length > 1 && currentIndex < images.length - 1 && (
                    <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={goNext} aria-label="Nästa bild">
                        ›
                    </button>
                )}
            </div>

            <Link to={`/bilar/${carRouteId}`} className={styles.body}>
                <div className={styles.topRow}>
                    <div className={styles.titleWrap}>
                        <h3 className={styles.brand}>{car.brand}</h3>
                        <p className={styles.model}>{car.model}</p>
                    </div>
                    <div className={styles.priceWrap}>
                        <p className={styles.price}>{formattedPrice}</p>
                        <p className={styles.listingId}>ID: {listingId}</p>
                    </div>
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

                <div className={styles.footer}>
                    <span className={`btn-primary ${styles.ctaBtn}`}>
                        {content.carCard.labels.details}
                        <span className={styles.ctaArrow} aria-hidden="true">→</span>
                    </span>
                </div>
            </Link>
        </div>
    );
}