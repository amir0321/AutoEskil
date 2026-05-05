import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Car,
  FilterX,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import CarCard from "../components/CarCard";
import useFetch from "../hooks/useFetch";
import { apiUrl } from "../utils/api";
import styles from "./Cars.module.css";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";

export const route = {
  path: "/bilar",
};

const ITEMS_PER_PAGE = 9;

export default function Cars() {
  const [cars, loading] = useFetch(apiUrl("/api/cars"));

  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [bodyTypeFilter, setBodyTypeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const [openMobileSelect, setOpenMobileSelect] = useState(null);
  const filterBarRef = useRef(null);

  useEffect(() => {
    if (!openMobileSelect) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(event.target)
      ) {
        setOpenMobileSelect(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMobileSelect]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fuelFilter, bodyTypeFilter, colorFilter, sortBy]);

  const fuelTypes = useMemo(() => {
    if (!cars) return [];
    const types = [
      ...new Set(cars.map((car) => car.fuel_type).filter(Boolean)),
    ];
    return types.sort();
  }, [cars]);

  const bodyTypes = useMemo(() => {
    if (!cars) return [];
    const allBodyTypes = [
      ...new Set(cars.map((car) => car.variant).filter(Boolean)),
    ];
    return allBodyTypes.sort((a, b) => a.localeCompare(b, "sv"));
  }, [cars]);

  const colors = useMemo(() => {
    if (!cars) return [];
    const allColors = [
      ...new Set(cars.map((car) => car.color).filter(Boolean)),
    ];
    return allColors.sort((a, b) => a.localeCompare(b, "sv"));
  }, [cars]);

  const filtered = useMemo(() => {
    if (!cars) return [];

    let result = [...cars];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (car) =>
          car.brand?.toLowerCase().includes(query) ||
          car.model?.toLowerCase().includes(query) ||
          car.variant?.toLowerCase().includes(query) ||
          car.color?.toLowerCase().includes(query) ||
          car.transmission?.toLowerCase().includes(query) ||
          car.description?.toLowerCase().includes(query),
      );
    }

    if (fuelFilter) {
      result = result.filter((car) => car.fuel_type === fuelFilter);
    }

    if (bodyTypeFilter) {
      result = result.filter((car) => car.variant === bodyTypeFilter);
    }

    if (colorFilter) {
      result = result.filter((car) => car.color === colorFilter);
    }

    if (sortBy === "price_asc")
      result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_desc")
      result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "year_desc")
      result.sort((a, b) => Number(b.year) - Number(a.year));
    else if (sortBy === "mileage_asc")
      result.sort((a, b) => Number(a.mileage) - Number(b.mileage));

    return result;
  }, [cars, search, fuelFilter, bodyTypeFilter, colorFilter, sortBy]);

  const clearSingleFilter = (key) => {
    if (key === "search") setSearch("");
    if (key === "fuel") setFuelFilter("");
    if (key === "bodyType") setBodyTypeFilter("");
    if (key === "color") setColorFilter("");
    if (key === "sort") setSortBy("default");
  };

  const clearAllFilters = () => {
    setSearch("");
    setFuelFilter("");
    setBodyTypeFilter("");
    setColorFilter("");
    setSortBy("default");
    setCurrentPage(1);
    setOpenMobileSelect(null);
  };

  const stats = useMemo(() => {
    if (!filtered.length) {
      return {
        total: 0,
        minPrice: 0,
        maxPrice: 0,
        avgYear: 0,
      };
    }

    const prices = filtered.map((car) => Number(car.price) || 0);
    const years = filtered.map((car) => Number(car.year) || 0).filter(Boolean);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleCars = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [totalPages]);

  const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString("sv-SE")} kr`;

  function Count({ value, formatter = (v) => v, duration = 600 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = Number(value) || 0;
      if (end === 0) {
        setDisplay(0);
        return;
      }
      const stepTime = 16;
      const steps = Math.max(1, Math.round(duration / stepTime));
      let current = 0;
      const increment = (end - start) / steps;
      const id = setInterval(() => {
        current++;
        const next = Math.round(start + increment * current);
        if (current >= steps) {
          setDisplay(end);
          clearInterval(id);
        } else {
          setDisplay(next);
        }
      }, stepTime);
      return () => clearInterval(id);
    }, [value]);
    return <>{formatter(display)}</>;
  }

  const hasActiveFilter = Boolean(
    search.trim() ||
    fuelFilter ||
    bodyTypeFilter ||
    colorFilter ||
    sortBy !== "default",
  );

  // 1. LÄGG IN getSortLabel HÄR UPPE ISTÄLLET
  const getSortLabel = (value) => {
    if (value === "price_asc") return content.cars.sortOptions.price_asc;
    if (value === "price_desc") return content.cars.sortOptions.price_desc;
    if (value === "year_desc") return content.cars.sortOptions.year_desc;
    if (value === "mileage_asc") return content.cars.sortOptions.mileage_asc;
    return content.cars.sortLabel;
  };

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (search.trim())
      chips.push({ key: "search", label: `Sök: ${search.trim()}` });
    if (fuelFilter)
      chips.push({ key: "fuel", label: `Drivmedel: ${fuelFilter}` });
    if (bodyTypeFilter)
      chips.push({ key: "bodyType", label: `Kaross: ${bodyTypeFilter}` });
    if (colorFilter)
      chips.push({ key: "color", label: `Färg: ${colorFilter}` });
    if (sortBy !== "default")
      chips.push({ key: "sort", label: `Sortering: ${getSortLabel(sortBy)}` });
    return chips;
  }, [search, fuelFilter, bodyTypeFilter, colorFilter, sortBy]);

  useEffect(() => {
    setPageSeo({
      title: `${content.cars.heroTitleLead} ${content.cars.heroTitleAccent} – ${content.brand.name}`,
      description: content.cars.heroSubtitle,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/bilar`
          : "/bilar",
      ogType: "website",
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.pageTitle}>
          {content.cars.heroTitleLead}{" "}
          <span className="text-accent">{content.cars.heroTitleAccent}</span>
        </h1>
        <p className={styles.pageSubtitle}>{content.cars.heroSubtitle}</p>
      </div>

      <div className={styles.content}>
        <div className={styles.inner}>
          {!loading && cars && cars.length > 0 && (
            <>
              <section
                className={styles.filterBar}
                aria-label="Sökning och filter"
                ref={filterBarRef}
              >
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} aria-hidden="true" />
                  <label
                    htmlFor="cars-search"
                    className={styles.visuallyHidden}
                  >
                    Sök bland bilar
                  </label>
                  <input
                    id="cars-search"
                    type="text"
                    placeholder={content.cars.searchPlaceholder}
                    className={styles.searchInput}
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setOpenMobileSelect(null);
                    }}
                    aria-label="Sök märke, modell eller beskrivning"
                  />
                </div>

                <div className={styles.mobileSelectWrap}>
                  <button
                    type="button"
                    className={`${styles.mobileSelectTrigger} ${openMobileSelect === "fuel" ? styles.mobileSelectTriggerOpen : ""}`}
                    onClick={() =>
                      setOpenMobileSelect((prev) =>
                        prev === "fuel" ? null : "fuel",
                      )
                    }
                    aria-haspopup="listbox"
                    aria-expanded={openMobileSelect === "fuel"}
                  >
                    <span>{fuelFilter || content.cars.fuelFilterAll}</span>
                    <span
                      className={styles.mobileSelectChevron}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {openMobileSelect === "fuel" && (
                    <div
                      className={styles.mobileSelectMenu}
                      role="listbox"
                      aria-label="Filtrera på drivmedel"
                    >
                      <button
                        type="button"
                        className={`${styles.mobileSelectOption} ${fuelFilter === "" ? styles.mobileSelectOptionActive : ""}`}
                        onClick={() => {
                          setFuelFilter("");
                          setOpenMobileSelect(null);
                        }}
                      >
                        {content.cars.fuelFilterAll}
                      </button>
                      {fuelTypes.map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          className={`${styles.mobileSelectOption} ${fuelFilter === fuel ? styles.mobileSelectOptionActive : ""}`}
                          onClick={() => {
                            setFuelFilter(fuel);
                            setOpenMobileSelect(null);
                          }}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.mobileSelectWrap}>
                  <button
                    type="button"
                    className={`${styles.mobileSelectTrigger} ${openMobileSelect === "bodyType" ? styles.mobileSelectTriggerOpen : ""}`}
                    onClick={() =>
                      setOpenMobileSelect((prev) =>
                        prev === "bodyType" ? null : "bodyType",
                      )
                    }
                    aria-haspopup="listbox"
                    aria-expanded={openMobileSelect === "bodyType"}
                  >
                    <span>
                      {bodyTypeFilter || content.cars.bodyTypeFilterAll}
                    </span>
                    <span
                      className={styles.mobileSelectChevron}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {openMobileSelect === "bodyType" && (
                    <div
                      className={styles.mobileSelectMenu}
                      role="listbox"
                      aria-label="Filtrera på kaross"
                    >
                      <button
                        type="button"
                        className={`${styles.mobileSelectOption} ${bodyTypeFilter === "" ? styles.mobileSelectOptionActive : ""}`}
                        onClick={() => {
                          setBodyTypeFilter("");
                          setOpenMobileSelect(null);
                        }}
                      >
                        {content.cars.bodyTypeFilterAll}
                      </button>
                      {bodyTypes.map((bodyType) => (
                        <button
                          key={bodyType}
                          type="button"
                          className={`${styles.mobileSelectOption} ${bodyTypeFilter === bodyType ? styles.mobileSelectOptionActive : ""}`}
                          onClick={() => {
                            setBodyTypeFilter(bodyType);
                            setOpenMobileSelect(null);
                          }}
                        >
                          {bodyType}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.mobileSelectWrap}>
                  <button
                    type="button"
                    className={`${styles.mobileSelectTrigger} ${openMobileSelect === "color" ? styles.mobileSelectTriggerOpen : ""}`}
                    onClick={() =>
                      setOpenMobileSelect((prev) =>
                        prev === "color" ? null : "color",
                      )
                    }
                    aria-haspopup="listbox"
                    aria-expanded={openMobileSelect === "color"}
                  >
                    <span>{colorFilter || content.cars.colorFilterAll}</span>
                    <span
                      className={styles.mobileSelectChevron}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {openMobileSelect === "color" && (
                    <div
                      className={styles.mobileSelectMenu}
                      role="listbox"
                      aria-label="Filtrera på färg"
                    >
                      <button
                        type="button"
                        className={`${styles.mobileSelectOption} ${colorFilter === "" ? styles.mobileSelectOptionActive : ""}`}
                        onClick={() => {
                          setColorFilter("");
                          setOpenMobileSelect(null);
                        }}
                      >
                        {content.cars.colorFilterAll}
                      </button>
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.mobileSelectOption} ${colorFilter === color ? styles.mobileSelectOptionActive : ""}`}
                          onClick={() => {
                            setColorFilter(color);
                            setOpenMobileSelect(null);
                          }}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.mobileSelectWrap}>
                  <button
                    type="button"
                    className={`${styles.mobileSelectTrigger} ${openMobileSelect === "sort" ? styles.mobileSelectTriggerOpen : ""}`}
                    onClick={() =>
                      setOpenMobileSelect((prev) =>
                        prev === "sort" ? null : "sort",
                      )
                    }
                    aria-haspopup="listbox"
                    aria-expanded={openMobileSelect === "sort"}
                  >
                    <span>{getSortLabel(sortBy)}</span>
                    <span
                      className={styles.mobileSelectChevron}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {openMobileSelect === "sort" && (
                    <div
                      className={styles.mobileSelectMenu}
                      role="listbox"
                      aria-label="Sortera resultat"
                    >
                      {[
                        { value: "default", label: content.cars.sortLabel },
                        {
                          value: "price_asc",
                          label: content.cars.sortOptions.price_asc,
                        },
                        {
                          value: "price_desc",
                          label: content.cars.sortOptions.price_desc,
                        },
                        {
                          value: "year_desc",
                          label: content.cars.sortOptions.year_desc,
                        },
                        {
                          value: "mileage_asc",
                          label: content.cars.sortOptions.mileage_asc,
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`${styles.mobileSelectOption} ${sortBy === option.value ? styles.mobileSelectOptionActive : ""}`}
                          onClick={() => {
                            setSortBy(option.value);
                            setOpenMobileSelect(null);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {hasActiveFilter && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={clearAllFilters}
                  >
                    <FilterX size={16} aria-hidden="true" />
                    <span>{content.cars.clearFilters}</span>
                  </button>
                )}

                <div className={styles.resultCount} aria-live="polite">
                  {sortBy === "price_asc" && (
                    <TrendingDown size={16} aria-hidden="true" />
                  )}
                  {sortBy === "price_desc" && (
                    <TrendingUp size={16} aria-hidden="true" />
                  )}
                  <span>
                    {filtered.length}{" "}
                    {filtered.length === 1
                      ? content.cars.resultSuffixSingular
                      : content.cars.resultSuffixPlural}
                  </span>
                </div>
              </section>

              {activeFilterChips.length > 0 && (
                <section
                  className={styles.activeFiltersRow}
                  aria-label="Aktiva filter"
                >
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className={styles.filterChip}
                      onClick={() => clearSingleFilter(chip.key)}
                      title={`Ta bort ${chip.label}`}
                    >
                      <span>{chip.label}</span>
                      <X size={14} aria-hidden="true" />
                    </button>
                  ))}
                </section>
              )}

              <section
                className={styles.statsGrid}
                aria-label="Statistik för resultat"
              >
                <article className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <BarChart3 size={18} />
                  </div>
                  <p className={styles.statLabel}>Totalt antal bilar</p>
                  <p className={styles.statValue}>
                    <Count
                      value={stats.total}
                      formatter={(v) => v.toLocaleString("sv-SE")}
                    />
                  </p>
                </article>

                <article className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <TrendingDown size={18} />
                  </div>
                  <p className={styles.statLabel}>Prisintervall</p>
                  <p className={styles.statValue}>
                    <Count
                      value={stats.minPrice}
                      formatter={(v) => formatCurrency(v)}
                    />{" "}
                    –{" "}
                    <Count
                      value={stats.maxPrice}
                      formatter={(v) => formatCurrency(v)}
                    />
                  </p>
                </article>

                <article className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <TrendingUp size={18} />
                  </div>
                  <p className={styles.statLabel}>Genomsnittlig årgång</p>
                  <p className={styles.statValue}>
                    <Count value={stats.avgYear} formatter={(v) => v || "–"} />
                  </p>
                </article>
              </section>
            </>
          )}

          {loading && (
            <section
              className={styles.loading}
              aria-live="polite"
              aria-busy="true"
            >
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
              <div className={styles.emptyIcon} aria-hidden="true">
                <Car size={42} strokeWidth={1.8} />
              </div>
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
                  onClick={clearAllFilters}
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
                {visibleCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className={styles.paginationWrap}
                  aria-label="Sidnavigering för bilar"
                >
                  <button
                    type="button"
                    className={`btn-ghost ${styles.pageBtn}`}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Föregående
                  </button>

                  <div className={styles.pageNumbers}>
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`${styles.pageNumberBtn} ${currentPage === pageNumber ? styles.pageNumberBtnActive : ""}`}
                        onClick={() => setCurrentPage(pageNumber)}
                        aria-label={`Gå till sida ${pageNumber}`}
                        aria-current={
                          currentPage === pageNumber ? "page" : undefined
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`btn-ghost ${styles.pageBtn}`}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Nästa
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
