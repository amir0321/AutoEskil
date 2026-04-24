import { useEffect, useMemo, useState } from 'react';
import { BarChart3, FilterX, Search, TrendingDown, TrendingUp } from 'lucide-react';
import CarCard from '../components/CarCard';
import useFetch from '../hooks/useFetch';
import { apiUrl } from '../utils/api';
import styles from './Cars.module.css';
import content from '../content/siteContent.json';

export const route = {
    path: '/bilar'
};

const INITIAL_VISIBLE_COUNT = 9;

export default function Cars() {
    const [cars, loading] = useFetch(apiUrl('/api/cars'));

    const [search, setSearch] = useState('');
    const [fuelFilter, setFuelFilter] = useState('');
    const [bodyTypeFilter, setBodyTypeFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        setShowAll(false);
    }, [search, fuelFilter, bodyTypeFilter, colorFilter, sortBy]);

    const fuelTypes = useMemo(() => {
        if (!cars) return [];
        const types = [...new Set(cars.map(car => car.fuel_type).filter(Boolean))];
        return types.sort();
    }, [cars]);

    const bodyTypes = useMemo(() => {
        if (!cars) return [];
        const allBodyTypes = [...new Set(cars.map(car => car.variant).filter(Boolean))];
        return allBodyTypes.sort((a, b) => a.localeCompare(b, 'sv'));
    }, [cars]);

    const colors = useMemo(() => {
        if (!cars) return [];
        const allColors = [...new Set(cars.map(car => car.color).filter(Boolean))];
        return allColors.sort((a, b) => a.localeCompare(b, 'sv'));
    }, [cars]);

    const filtered = useMemo(() => {
        if (!cars) return [];

        let result = [...cars];

        if (search.trim()) {
            const query = search.trim().toLowerCase();
            result = result.filter(car =>
                car.brand?.toLowerCase().includes(query) ||
                car.model?.toLowerCase().includes(query) ||
                car.variant?.toLowerCase().includes(query) ||
                car.color?.toLowerCase().includes(query) ||
                car.transmission?.toLowerCase().includes(query) ||
                car.description?.toLowerCase().includes(query)
            );
        }

        if (fuelFilter) {
            result = result.filter(car => car.fuel_type === fuelFilter);
        }

        if (bodyTypeFilter) {
            result = result.filter(car => car.variant === bodyTypeFilter);
        }

        if (colorFilter) {
            result = result.filter(car => car.color === colorFilter);
        }

        if (sortBy === 'price_asc') result.sort((a, b) => Number(a.price) - Number(b.price));
        else if (sortBy === 'price_desc') result.sort((a, b) => Number(b.price) - Number(a.price));
        else if (sortBy === 'year_desc') result.sort((a, b) => Number(b.year) - Number(a.year));
        else if (sortBy === 'mileage_asc') result.sort((a, b) => Number(a.mileage) - Number(b.mileage));

        return result;
    }, [cars, search, fuelFilter, bodyTypeFilter, colorFilter, sortBy]);

    const hasActiveFilter = Boolean(search.trim() || fuelFilter || bodyTypeFilter || colorFilter || sortBy !== 'default');

    const stats = useMemo(() => {
        if (!filtered.length) {
            return {
                total: 0,
                minPrice: 0,
                maxPrice: 0,
                avgYear: 0,
            };
        }

        const prices = filtered.map(car => Number(car.price) || 0);
        const years = filtered.map(car => Number(car.year) || 0).filter(Boolean);

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgYear = years.length
            ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length)
            : 0;

        return {
            total: filtered.length,
            minPrice,
            maxPrice,
            avgYear,
        };
    }, [filtered]);

    const visibleCars = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE_COUNT);
    const hiddenCount = Math.max(filtered.length - visibleCars.length, 0);

    const formatCurrency = (value) => `${Number(value || 0).toLocaleString('sv-SE')} kr`;

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
                    {!loading && cars && cars.length > 0 && (
                        <>
                            <section className={styles.filterBar} aria-label="Sökning och filter">
                                <div className={styles.searchWrapper}>
                                    <Search className={styles.searchIcon} aria-hidden="true" />
                                    <label htmlFor="cars-search" className={styles.visuallyHidden}>Sök bland bilar</label>
                                    <input
                                        id="cars-search"
                                        type="text"
                                        placeholder={content.cars.searchPlaceholder}
                                        className={styles.searchInput}
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        aria-label="Sök märke, modell eller beskrivning"
                                    />
                                </div>

                                <label htmlFor="fuel-filter" className={styles.visuallyHidden}>Filtrera på drivmedel</label>
                                <select
                                    id="fuel-filter"
                                    className={styles.filterSelect}
                                    value={fuelFilter}
                                    onChange={(event) => setFuelFilter(event.target.value)}
                                    aria-label="Filtrera på drivmedel"
                                >
                                    <option value="">{content.cars.fuelFilterAll}</option>
                                    {fuelTypes.map(fuel => (
                                        <option key={fuel} value={fuel}>{fuel}</option>
                                    ))}
                                </select>

                                <label htmlFor="body-type-filter" className={styles.visuallyHidden}>Filtrera på kaross</label>
                                <select
                                    id="body-type-filter"
                                    className={styles.filterSelect}
                                    value={bodyTypeFilter}
                                    onChange={(event) => setBodyTypeFilter(event.target.value)}
                                    aria-label="Filtrera på kaross"
                                >
                                    <option value="">{content.cars.bodyTypeFilterAll}</option>
                                    {bodyTypes.map(bodyType => (
                                        <option key={bodyType} value={bodyType}>{bodyType}</option>
                                    ))}
                                </select>

                                <label htmlFor="color-filter" className={styles.visuallyHidden}>Filtrera på färg</label>
                                <select
                                    id="color-filter"
                                    className={styles.filterSelect}
                                    value={colorFilter}
                                    onChange={(event) => setColorFilter(event.target.value)}
                                    aria-label="Filtrera på färg"
                                >
                                    <option value="">{content.cars.colorFilterAll}</option>
                                    {colors.map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>

                                <label htmlFor="sort-by" className={styles.visuallyHidden}>Sortera resultat</label>
                                <select
                                    id="sort-by"
                                    className={styles.filterSelect}
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                    aria-label="Sortera resultat"
                                >
                                    <option value="default">{content.cars.sortLabel}</option>
                                    <option value="price_asc">{content.cars.sortOptions.price_asc}</option>
                                    <option value="price_desc">{content.cars.sortOptions.price_desc}</option>
                                    <option value="year_desc">{content.cars.sortOptions.year_desc}</option>
                                    <option value="mileage_asc">{content.cars.sortOptions.mileage_asc}</option>
                                </select>

                                {hasActiveFilter && (
                                    <button
                                        type="button"
                                        className={styles.clearBtn}
                                        onClick={() => {
                                            setSearch('');
                                            setFuelFilter('');
                                            setBodyTypeFilter('');
                                            setColorFilter('');
                                            setSortBy('default');
                                        }}
                                    >
                                        <FilterX size={16} aria-hidden="true" />
                                        <span>{content.cars.clearFilters}</span>
                                    </button>
                                )}

                                <div className={styles.resultCount} aria-live="polite">
                                    {sortBy === 'price_asc' && <TrendingDown size={16} aria-hidden="true" />}
                                    {sortBy === 'price_desc' && <TrendingUp size={16} aria-hidden="true" />}
                                    <span>
                                        {filtered.length} {filtered.length === 1 ? content.cars.resultSuffixSingular : content.cars.resultSuffixPlural}
                                    </span>
                                </div>
                            </section>

                            <section className={styles.statsGrid} aria-label="Statistik för resultat">
                                <article className={styles.statCard}>
                                    <div className={styles.statIcon}><BarChart3 size={18} /></div>
                                    <p className={styles.statLabel}>Totalt antal bilar</p>
                                    <p className={styles.statValue}>{stats.total}</p>
                                </article>

                                <article className={styles.statCard}>
                                    <div className={styles.statIcon}><TrendingDown size={18} /></div>
                                    <p className={styles.statLabel}>Prisintervall</p>
                                    <p className={styles.statValue}>{formatCurrency(stats.minPrice)} – {formatCurrency(stats.maxPrice)}</p>
                                </article>

                                <article className={styles.statCard}>
                                    <div className={styles.statIcon}><TrendingUp size={18} /></div>
                                    <p className={styles.statLabel}>Genomsnittlig årgång</p>
                                    <p className={styles.statValue}>{stats.avgYear || '–'}</p>
                                </article>
                            </section>
                        </>
                    )}

                    {loading && (
                        <section className={styles.loading} aria-live="polite" aria-busy="true">
                            <div className={styles.spinner} />
                            <p>{content.cars.loading}</p>

                            <div className={styles.skeletonGrid}>
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className={styles.skeletonCard}>
                                        <div className={styles.skeletonImage} />
                                        <div className={styles.skeletonLine} />
                                        <div className={styles.skeletonLineShort} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {!loading && (!cars || cars.length === 0) && (
                        <div className={`solid-card ${styles.empty}`}>
                            <div className={styles.emptyIcon}>🚗</div>
                            <h2>{content.cars.empty.noCarsTitle}</h2>
                            <p>{content.cars.empty.noCarsText}</p>
                        </div>
                    )}

                    {!loading && cars && cars.length > 0 && filtered.length === 0 && (
                        <div className={`solid-card ${styles.empty}`}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h2>{content.cars.empty.noResultsTitle}</h2>
                            <p>{content.cars.empty.noResultsText}</p>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    className={`btn-secondary ${styles.emptyAction}`}
                                    onClick={() => {
                                        setSearch('');
                                        setFuelFilter('');
                                        setBodyTypeFilter('');
                                        setColorFilter('');
                                        setSortBy('default');
                                    }}
                                >
                                    <FilterX size={16} aria-hidden="true" />
                                    Rensa filter
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <>
                            <div className={styles.grid}>
                                {visibleCars.map(car => (
                                    <CarCard key={car.id} car={car} />
                                ))}
                            </div>

                            {filtered.length > INITIAL_VISIBLE_COUNT && (
                                <div className={styles.showMoreWrap}>
                                    {!showAll ? (
                                        <button
                                            type="button"
                                            className={`btn-ghost ${styles.showMoreBtn}`}
                                            onClick={() => setShowAll(true)}
                                        >
                                            Visa mer ({hiddenCount} till)
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`btn-ghost ${styles.showMoreBtn}`}
                                            onClick={() => setShowAll(false)}
                                        >
                                            Visa mindre
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
