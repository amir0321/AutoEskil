import { useState, useMemo } from 'react';
import CarCard from '../components/CarCard';
import useFetch from '../hooks/useFetch';
import { apiUrl } from '../utils/api';
import styles from './Cars.module.css';
import content from '../content/siteContent.json';

export const route = {
    path: "/bilar"
};

export default function Cars() {
    const [cars, loading] = useFetch(apiUrl('/api/cars'));

    const [search, setSearch] = useState('');
    const [fuelFilter, setFuelFilter] = useState('');
    const [sortBy, setSortBy] = useState('default');

    const fuelTypes = useMemo(() => {
        if (!cars) return [];
        const types = [...new Set(cars.map(c => c.fuel_type).filter(Boolean))];
        return types.sort();
    }, [cars]);

    const filtered = useMemo(() => {
        if (!cars) return [];
        let result = [...cars];

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(c =>
                c.brand?.toLowerCase().includes(q) ||
                c.model?.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q)
            );
        }

        if (fuelFilter) {
            result = result.filter(c => c.fuel_type === fuelFilter);
        }

        if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
        else if (sortBy === 'year_desc') result.sort((a, b) => b.year - a.year);
        else if (sortBy === 'mileage_asc') result.sort((a, b) => a.mileage - b.mileage);

        return result;
    }, [cars, search, fuelFilter, sortBy]);

    const hasActiveFilter = search || fuelFilter || sortBy !== 'default';

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <h1 className={styles.pageTitle}>
                    {content.cars.heroTitleLead} <span className="text-accent">{content.cars.heroTitleAccent}</span>
                </h1>
                <p className={styles.pageSubtitle}>{content.cars.heroSubtitle}</p>
            </div>

            <div className={styles.content}>
                <div className={styles.inner}>
                    {/* Filter Bar */}
                    {!loading && cars && cars.length > 0 && (
                        <div className={styles.filterBar}>
                            <div className={styles.searchWrapper}>
                                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={content.cars.searchPlaceholder}
                                    className={styles.searchInput}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            <select className={styles.filterSelect} value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}>
                                <option value="">{content.cars.fuelFilterAll}</option>
                                {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>

                            <select className={styles.filterSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="default">{content.cars.sortLabel}</option>
                                <option value="price_asc">{content.cars.sortOptions.price_asc}</option>
                                <option value="price_desc">{content.cars.sortOptions.price_desc}</option>
                                <option value="year_desc">{content.cars.sortOptions.year_desc}</option>
                                <option value="mileage_asc">{content.cars.sortOptions.mileage_asc}</option>
                            </select>

                            {hasActiveFilter && (
                                <button
                                    className={styles.clearBtn}
                                    onClick={() => { setSearch(''); setFuelFilter(''); setSortBy('default'); }}
                                >
                                    {content.cars.clearFilters}
                                </button>
                            )}

                            <span className={styles.resultCount}>
                                {filtered.length} {filtered.length === 1 ? content.cars.resultSuffixSingular : content.cars.resultSuffixPlural}
                            </span>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <p>{content.cars.loading}</p>
                        </div>
                    )}

                    {/* No cars in DB */}
                    {!loading && (!cars || cars.length === 0) && (
                        <div className={`glass-card ${styles.empty}`}>
                            <div className={styles.emptyIcon}>🚗</div>
                            <h2>{content.cars.empty.noCarsTitle}</h2>
                            <p>{content.cars.empty.noCarsText}</p>
                        </div>
                    )}

                    {/* No filter results */}
                    {!loading && cars && cars.length > 0 && filtered.length === 0 && (
                        <div className={`glass-card ${styles.empty}`}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h2>{content.cars.empty.noResultsTitle}</h2>
                            <p>{content.cars.empty.noResultsText}</p>
                        </div>
                    )}

                    {/* Cars grid */}
                    {!loading && filtered.length > 0 && (
                        <div className={styles.grid}>
                            {filtered.map(car => (
                                <CarCard key={car.id} car={car} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
