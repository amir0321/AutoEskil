import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    BadgeDollarSign,
    Calendar,
    Car,
    Check,
    Copy,
    Fuel,
    Gauge,
    Palette,
    Scale,
    Settings,
    Share2,
    Sparkles,
} from 'lucide-react';
import CarCard from '../components/CarCard';
import useFetch from '../hooks/useFetch';
import { apiUrl } from '../utils/api';
import InterestedModal from '../components/InterestedModal';
import styles from './CarDetails.module.css';

export const route = {
    path: '/bilar/:id',
};

const colorMap = {
    black: '#111827',
    white: '#f8fafc',
    grey: '#6b7280',
    gray: '#6b7280',
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#eab308',
    orange: '#f97316',
    brown: '#92400e',
    purple: '#7c3aed',
    beige: '#d6b88d',
    svart: '#1f2937',
    vit: '#f8fafc',
    silver: '#94a3b8',
    grå: '#6b7280',
    gra: '#6b7280',
    blå: '#2563eb',
    bla: '#2563eb',
    röd: '#dc2626',
    rod: '#dc2626',
    grön: '#16a34a',
    gron: '#16a34a',
    gul: '#eab308',
    orange: '#f97316',
    brun: '#92400e',
    lila: '#7c3aed',
    beige: '#d6b88d',
};

const cssColorPattern = /^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgb\(|rgba\(|hsl\(|hsla\()/i;

function normalizeColorName(input) {
    return String(input || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getColorValue(colorName) {
    if (!colorName || typeof colorName !== 'string') {
        return '#475569';
    }

    const raw = colorName.trim();
    if (cssColorPattern.test(raw)) {
        return raw;
    }

    const normalized = normalizeColorName(raw);
    if (!normalized) {
        return '#475569';
    }

    if (colorMap[normalized]) {
        return colorMap[normalized];
    }

    const firstWord = normalized.split(' ')[0];
    if (colorMap[firstWord]) {
        return colorMap[firstWord];
    }

    const keyword = Object.keys(colorMap).find((key) => normalized.includes(key));
    if (keyword) {
        return colorMap[keyword];
    }

    return '#475569';
}

export default function CarDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [car, allCars, loading, error] = useFetch(apiUrl(`/api/cars/${id}`), apiUrl('/api/cars'));
    const [activeImage, setActiveImage] = useState(0);
    const [showInterestedModal, setShowInterestedModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
    const [isZooming, setIsZooming] = useState(false);
    const [shareMessage, setShareMessage] = useState('');

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/bilar/${id}`
        : '';

    if (loading) {
        return <div className={styles.loading}>Laddar bildata...</div>;
    }

    if (error || !car) {
        return <div className={styles.error}>Bilen kunde inte hittas.</div>;
    }

    const allImages = car.images && car.images.length > 0
        ? car.images
        : ['https://placehold.co/800x600?text=Ingen+bild'];

    const selectedColor = car.color || 'Ej angiven';
    const bodyType = car.variant || 'Ej angiven';
    const transmission = car.transmission || 'Ej angiven';

    const specs = [
        { label: 'Årsmodell', value: car.year || '—', icon: <Calendar size={18} /> },
        { label: 'Miltal', value: `${Number(car.mileage || 0).toLocaleString('sv-SE')} mil`, icon: <Gauge size={18} /> },
        { label: 'Drivmedel', value: car.fuel_type || '—', icon: <Fuel size={18} /> },
        { label: 'Pris', value: `${Number(car.price || 0).toLocaleString('sv-SE')} kr`, icon: <BadgeDollarSign size={18} /> },
        { label: 'Växellåda', value: transmission, icon: <Settings size={18} /> },
        { label: 'Kaross', value: bodyType, icon: <Sparkles size={18} /> },
        {
            label: 'Färg',
            value: selectedColor,
            icon: <Palette size={18} />,
            dot: getColorValue(selectedColor),
        },
    ];

    const relatedCars = Array.isArray(allCars)
        ? allCars
            .filter(item => item.id !== car.id)
            .sort((a, b) => {
                const scoreA = (a.brand === car.brand ? 2 : 0) + (a.fuel_type === car.fuel_type ? 1 : 0);
                const scoreB = (b.brand === car.brand ? 2 : 0) + (b.fuel_type === car.fuel_type ? 1 : 0);
                return scoreB - scoreA;
            })
            .slice(0, 3)
        : [];

    const handleImageMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const handleCompare = () => {
        try {
            const key = 'autoeskil_compare_ids';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const next = Array.from(new Set([...existing, car.id])).slice(-3);
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            return;
        }
        navigate(`/bilar?compare=${car.id}`);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareMessage('Länken är kopierad!');
            setTimeout(() => setShareMessage(''), 2400);
        } catch {
            setShareMessage('Kunde inte kopiera länk.');
            setTimeout(() => setShareMessage(''), 2400);
        }
    };

    const handleNativeShare = async () => {
        if (!navigator.share) {
            handleCopyLink();
            return;
        }
        try {
            await navigator.share({
                title: `${car.brand} ${car.model}`,
                text: `Kolla in denna ${car.brand} ${car.model} hos AutoEskil`,
                url: shareUrl,
            });
        } catch {
            return;
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div className={styles.heroInner}>
                    <Link to="/bilar" className={styles.backLink}>
                        <ArrowLeft size={16} /> Tillbaka till bilar
                    </Link>

                    <div className={styles.heroHeader}>
                        <div>
                            <p className={styles.eyebrow}>Premium urval</p>
                            <h1 className={styles.title}>{car.brand} <span className={styles.model}>{car.model}</span></h1>
                            <p className={styles.heroPrice}>{Number(car.price).toLocaleString('sv-SE')} kr</p>
                        </div>

                        <div className={styles.heroActions}>
                            <button type="button" className={`btn-secondary ${styles.actionBtn} ${styles.compareBtn}`} onClick={handleCompare}>
                                <Scale size={16} /> Jämför
                            </button>
                            <button type="button" className={`btn-secondary ${styles.actionBtn} ${styles.shareBtn}`} onClick={handleNativeShare}>
                                <Share2 size={16} /> Dela
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.contentGrid}>
                    <section className={styles.imageGallery} aria-label="Bildgalleri">
                        <div
                            className={styles.primaryImageWrapper}
                            onMouseMove={handleImageMove}
                            onMouseEnter={() => setIsZooming(true)}
                            onMouseLeave={() => setIsZooming(false)}
                        >
                            <img
                                src={allImages[activeImage]}
                                alt={`${car.brand} ${car.model}`}
                                className={styles.primaryImage}
                                style={{
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    transform: isZooming ? 'scale(1.35)' : 'scale(1)',
                                }}
                            />
                            <span className={styles.zoomHint}>Hover för zoom</span>
                        </div>

                        {allImages.length > 1 && (
                            <div className={styles.secondaryImages}>
                                {allImages.map((img, index) => (
                                    <button
                                        key={img + index}
                                        type="button"
                                        className={`${styles.thumbnailBtn} ${index === activeImage ? styles.activeThumbnail : ''}`}
                                        onClick={() => setActiveImage(index)}
                                        aria-label={`Visa bild ${index + 1}`}
                                    >
                                        <img src={img} alt={`Bild ${index + 1}`} className={styles.secondaryImage} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className={styles.detailsColumn}>
                        <section className={`solid-card ${styles.detailsCard}`}>
                            <div className={styles.badges}>
                                <span className={styles.badge}><Calendar size={14} /> {car.year}</span>
                                <span className={styles.badge}><Gauge size={14} /> {Number(car.mileage).toLocaleString('sv-SE')} mil</span>
                                <span className={styles.badge}><Fuel size={14} /> {car.fuel_type}</span>
                                {car.transmission && <span className={styles.badge}><Settings size={14} /> {car.transmission}</span>}
                                {car.variant && <span className={styles.badge}><Sparkles size={14} /> {car.variant}</span>}
                                {car.color && <span className={styles.badge}><Palette size={14} /> {car.color}</span>}
                            </div>

                            <h2 className={styles.sectionTitle}>Specifikationer</h2>
                            <div className={styles.specGrid}>
                                {specs.map((spec) => (
                                    <div key={spec.label} className={styles.specItem}>
                                        <div className={styles.specIcon}>{spec.icon}</div>
                                        <div>
                                            <p className={styles.specLabel}>{spec.label}</p>
                                            <p className={styles.specValue}>
                                                {spec.dot && (
                                                    <span
                                                        className={styles.colorDot}
                                                        style={{ backgroundColor: spec.dot }}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {spec.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h2 className={styles.sectionTitle}>Beskrivning</h2>
                            <p className={styles.description}>{car.description || 'Ingen beskrivning tillgänglig för denna bil.'}</p>

                            {successMessage && (
                                <div className={styles.successMessage}>
                                    <Check size={16} /> {successMessage}
                                </div>
                            )}

                            <div className={styles.ctaGroup}>
                                <button
                                    onClick={() => setShowInterestedModal(true)}
                                    className={`btn-primary ${styles.ctaButton} ${styles.primaryCta}`}
                                >
                                    <Car size={16} /> Intresserad av denna bil?
                                </button>

                                <div className={styles.secondaryActions}>
                                    <button
                                        type="button"
                                        className={`btn-secondary ${styles.copyBtn}`}
                                        onClick={handleCopyLink}
                                    >
                                        <Copy size={14} /> Kopiera länk
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-secondary ${styles.quickShareBtn}`}
                                        onClick={handleNativeShare}
                                    >
                                        <Share2 size={14} /> Snabbdela
                                    </button>
                                </div>
                            </div>

                            {shareMessage && <p className={styles.shareMessage}>{shareMessage}</p>}
                        </section>
                    </aside>
                </div>

                {relatedCars.length > 0 && (
                    <section className={styles.relatedSection}>
                        <h2 className={styles.relatedTitle}>Liknande bilar</h2>
                        <p className={styles.relatedSubtitle}>Jämför med fler alternativ i samma segment.</p>
                        <div className={styles.relatedGrid}>
                            {relatedCars.map((relatedCar) => (
                                <CarCard key={relatedCar.id} car={relatedCar} />
                            ))}
                        </div>
                    </section>
                )}

                {showInterestedModal && (
                    <InterestedModal
                        carId={car.id}
                        carBrand={car.brand}
                        carModel={car.model}
                        onClose={() => setShowInterestedModal(false)}
                        onSuccess={() => {
                            setSuccessMessage('Tack! Din intresse-anmälan har skickats.');
                            setShowInterestedModal(false);
                            setTimeout(() => setSuccessMessage(''), 5000);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
