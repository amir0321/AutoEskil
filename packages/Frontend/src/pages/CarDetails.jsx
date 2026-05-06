import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";
import CarCard from "../components/CarCard";
import useFetch from "../hooks/useFetch";
import { apiUrl } from "../utils/api";
import InterestedModal from "../components/InterestedModal";
import content from "../content/siteContent.json";
import { setJsonLd, setPageSeo } from "../utils/seo";
import styles from "./CarDetails.module.css";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { RECAPTCHA_SITE_KEY } from "../utils/recaptcha";

export const route = {
  path: "/bilar/:id",
};

// ... (colorMap och hjälpfunktioner för färg är desamma)
const colorMap = {
  black: "#111827",
  white: "#f8fafc",
  grey: "#6b7280",
  gray: "#6b7280",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#f97316",
  brown: "#92400e",
  purple: "#7c3aed",
  beige: "#d6b88d",
  svart: "#1f2937",
  vit: "#f8fafc",
  silver: "#94a3b8",
  grå: "#6b7280",
  gra: "#6b7280",
  blå: "#2563eb",
  bla: "#2563eb",
  röd: "#dc2626",
  rod: "#dc2626",
  grön: "#16a34a",
  gron: "#16a34a",
  gul: "#eab308",
  brun: "#92400e",
  lila: "#7c3aed",
};

const cssColorPattern =
  /^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgb\(|rgba\(|hsl\(|hsla\()/i;

function normalizeColorName(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getColorValue(colorName) {
  if (!colorName || typeof colorName !== "string") return "#475569";
  const raw = colorName.trim();
  if (cssColorPattern.test(raw)) return raw;
  const normalized = normalizeColorName(raw);
  if (!normalized) return "#475569";
  if (colorMap[normalized]) return colorMap[normalized];
  const firstWord = normalized.split(" ")[0];
  if (colorMap[firstWord]) return colorMap[firstWord];
  const keyword = Object.keys(colorMap).find((key) => normalized.includes(key));
  if (keyword) return colorMap[keyword];
  return "#475569";
}

function formatLastUpdated(value) {
  if (!value) return "Ej tillgänglig";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Ej tillgänglig";
  return parsedDate.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "" &&
    String(value).trim() !== "Ej angiven" &&
    String(value).trim() !== "Ej angivet" &&
    String(value).trim() !== "—"
  );
}

function CarDetailsInner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car, allCars, loading, error] = useFetch(
    apiUrl(`/api/cars/${id}`),
    apiUrl("/api/cars"),
  );
  const [activeImage, setActiveImage] = useState(0);
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!car) return;
    const title =
      `${car.brand || ""} ${car.model || ""} – ${content?.brand?.name || "AutoEskil"}`.trim();
    const desc =
      (car.description && car.description.slice(0, 160)) ||
      `${car.brand || ""} ${car.model || ""} – ${content?.cars?.heroSubtitle || ""}`;

    setPageSeo({
      title,
      description: desc,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/bilar/${car?.listing_id || id}`
          : `/bilar/${car?.listing_id || id}`,
      ogType: "article",
      ogUrl: typeof window !== "undefined" ? window.location.href : "",
      ogImage:
        (car.images && car.images[0]) ||
        `${typeof window !== "undefined" ? window.location.origin : ""}/assets/hero_home.svg`,
    });

    const carUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/bilar/${car?.listing_id || id}`
        : `/bilar/${car?.listing_id || id}`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Car",
      name: `${car.brand || ""} ${car.model || ""}`.trim(),
      brand: car.brand
        ? {
            "@type": "Brand",
            name: car.brand,
          }
        : undefined,
      model: car.model || undefined,
      vehicleModelDate: car.year || undefined,
      description: desc,
      image: Array.isArray(car.images) ? car.images : [],
      color: car.color || undefined,
      fuelType: car.fuel_type || undefined,
      vehicleTransmission: car.transmission || undefined,
      mileageFromOdometer: car.mileage
        ? {
            "@type": "QuantitativeValue",
            value: Number(car.mileage),
            unitText: "SMI",
          }
        : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "SEK",
        price: Number(car.price || 0),
        availability: "https://schema.org/InStock",
        url: carUrl,
      },
      sku: String(car.listing_id || car.id || ""),
      url: carUrl,
    };

    setJsonLd("car-details", structuredData);

    return () => {
      setJsonLd("car-details", null);
    };
  }, [car, id]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/bilar/${car?.listing_id || id}`
      : "";

  if (loading) {
    return <div className={styles.loading}>Laddar bildata...</div>;
  }

  if (error || !car) {
    return <div className={styles.error}>Bilen kunde inte hittas.</div>;
  }

  const allImages =
    car.images && car.images.length > 0
      ? car.images
      : ["https://placehold.co/800x600?text=Ingen+bild"];

  const selectedColor = hasValue(car.color) ? car.color : null;
  const bodyType = hasValue(car.variant) ? car.variant : null;
  const transmission = hasValue(car.transmission) ? car.transmission : null;
  const horsepower = hasValue(car.horsepower) ? `${car.horsepower} hk` : null;
  const registrationNumber = hasValue(car.registration_number)
    ? car.registration_number
    : null;
  const registrationDate = hasValue(car.registration_date)
    ? car.registration_date
    : null;
  const maxTrailerWeight = hasValue(car.max_trailer_weight)
    ? `${Number(car.max_trailer_weight).toLocaleString("sv-SE")} kg`
    : null;
  const drivetrain = hasValue(car.drivetrain) ? car.drivetrain : null;
  const seats = hasValue(car.seats) ? car.seats : null;
  const parsedEngineVolume = car.engine_volume
    ? Number(String(car.engine_volume).replace(",", "."))
    : null;
  const engineVolume = Number.isFinite(parsedEngineVolume)
    ? `${parsedEngineVolume.toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l`
    : null;
  const wltpRange = hasValue(car.range_wltp)
    ? `${Number(car.range_wltp).toLocaleString("sv-SE")} km`
    : null;
  const location = hasValue(car.location) ? car.location : null;
  const weight = hasValue(car.weight)
    ? `${Number(car.weight).toLocaleString("sv-SE")} kg`
    : null;
  const fuelConsumption = hasValue(car.fuel_consumption)
    ? `${Number(car.fuel_consumption).toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} l/100km`
    : null;
  const numberOfOwners = hasValue(car.number_of_owners) ? car.number_of_owners : null;
  const nextInspectionDate = hasValue(car.next_inspection_date) ? car.next_inspection_date : null;
  
  const listingId = car.listing_id || car.id;
  const lastUpdated = formatLastUpdated(car.updated_at || car.created_at);

  const specs = [
    hasValue(car.year) && {
      label: "Årsmodell",
      value: car.year,
      icon: <Calendar size={18} />,
    },
    hasValue(car.mileage) && {
      label: "Miltal",
      value: `${Number(car.mileage).toLocaleString("sv-SE")} mil`,
      icon: <Gauge size={18} />,
    },
    hasValue(car.fuel_type) && {
      label: "Drivmedel",
      value: car.fuel_type,
      icon: <Fuel size={18} />,
    },
    hasValue(car.price) && {
      label: "Pris",
      value: `${Number(car.price).toLocaleString("sv-SE")} kr`,
      icon: <BadgeDollarSign size={18} />,
    },
    transmission && {
      label: "Växellåda",
      value: transmission,
      icon: <Settings size={18} />,
    },
    bodyType && {
      label: "Kaross",
      value: bodyType,
      icon: <Sparkles size={18} />,
    },
    selectedColor && {
      label: "Färg",
      value: selectedColor,
      icon: <Palette size={18} />,
      dot: getColorValue(selectedColor),
    },
    horsepower && {
      label: "Hästkrafter",
      value: horsepower,
      icon: <Gauge size={18} />,
    },
    registrationNumber && {
      label: "Regnummer",
      value: registrationNumber,
      icon: <Car size={18} />,
    },
    registrationDate && {
      label: "Registreringsdatum",
      value: registrationDate,
      icon: <Calendar size={18} />,
    },
    maxTrailerWeight && {
      label: "Max trailervikt",
      value: maxTrailerWeight,
      icon: <Scale size={18} />,
    },
    drivetrain && {
      label: "Drifthjul",
      value: drivetrain,
      icon: <Settings size={18} />,
    },
    seats && { label: "Säten", value: seats, icon: <Car size={18} /> },
    wltpRange && {
      label: "Räckvidd (WLTP)",
      value: wltpRange,
      icon: <Gauge size={18} />,
    },
    engineVolume && {
      label: "Motorvolym",
      value: engineVolume,
      icon: <Fuel size={18} />,
    },
    weight && {
      label: "Vikt",
      value: weight,
      icon: <Scale size={18} />,
    },
    fuelConsumption && {
      label: "Bränsleförbrukning",
      value: fuelConsumption,
      icon: <Fuel size={18} />,
    },
    numberOfOwners && {
      label: "Antal ägare",
      value: numberOfOwners,
      icon: <Users size={18} />,
    },
    nextInspectionDate && {
      label: "Nästa besiktning",
      value: nextInspectionDate,
      icon: <Calendar size={18} />,
    },
  ].filter(Boolean);
  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 7);

  const getEquipmentArray = () => {
    if (!car.equipment) return [];
    if (Array.isArray(car.equipment)) return car.equipment;
    if (typeof car.equipment === "string") {
      try {
        const parsed = JSON.parse(car.equipment);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const equipmentArray = getEquipmentArray();

  const relatedCars = Array.isArray(allCars)
    ? allCars
        .filter((item) => item.id !== car.id)
        .sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          if (a.brand === car.brand) scoreA += 10;
          if (a.model === car.model) scoreA += 5;
          if (a.fuel_type === car.fuel_type) scoreA += 2;
          if (a.variant === car.variant) scoreA += 1;

          if (b.brand === car.brand) scoreB += 10;
          if (b.model === car.model) scoreB += 5;
          if (b.fuel_type === car.fuel_type) scoreB += 2;
          if (b.variant === car.variant) scoreB += 1;

          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          const priceDiffA = Math.abs(Number(a.price) - Number(car.price));
          const priceDiffB = Math.abs(Number(b.price) - Number(car.price));
          return priceDiffA - priceDiffB;
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
      const key = "autoeskil_compare_ids";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
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
      setShareMessage("Länken är kopierad!");
      setTimeout(() => setShareMessage(""), 2400);
    } catch {
      setShareMessage("Kunde inte kopiera länk.");
      setTimeout(() => setShareMessage(""), 2400);
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

  // --- HÄR SKAPAR VI UTRUSTNINGSKORTET SOM EN VARIABEL ---
  const equipmentContent = equipmentArray.length > 0 && (
    <section className={`solid-card ${styles.equipmentSection}`}>
      <h2 className={styles.sectionTitle}>Utrustning & Tillval</h2>
      <ul className={styles.equipmentList}>
        {(showAllEquipment ? equipmentArray : equipmentArray.slice(0, 6)).map(
          (item, index) => (
            <li key={index} className={styles.equipmentItem}>
              <Check
                size={16}
                className="text-accent"
                style={{ flexShrink: 0 }}
              />
              <span>{item}</span>
            </li>
          ),
        )}
      </ul>
      {equipmentArray.length > 6 && (
        <button
          onClick={() => setShowAllEquipment(!showAllEquipment)}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            padding: "0.5rem 0",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
            fontWeight: "500",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          {showAllEquipment
            ? "⬆ Visa mindre"
            : `⬇ Visa alla (${equipmentArray.length})`}
        </button>
      )}
    </section>
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.backLink}
          >
            <ArrowLeft size={16} /> Tillbaka
          </button>

          <div className={styles.heroHeader}>
            <div>
              {location && (
                <p className={styles.eyebrow} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <MapPin size={14} /> Finns i {location}
                </p>
              )}
              <p className={styles.eyebrow}>Premium urval</p>
              <p className={styles.eyebrow}>Annons-ID: {listingId}</p>
              <p className={styles.eyebrow}>Senast uppdaterad: {lastUpdated}</p>
              <h1 className={styles.title}>
                {car.brand} <span className={styles.model}>{car.model}</span>
              </h1>
              <p className={styles.heroPrice}>
                {Number(car.price).toLocaleString("sv-SE")} kr
              </p>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={`btn-secondary ${styles.actionBtn} ${styles.compareBtn}`}
                onClick={handleCompare}
              >
                <Scale size={16} /> Jämför
              </button>
              <button
                type="button"
                className={`btn-secondary ${styles.actionBtn} ${styles.shareBtn}`}
                onClick={handleNativeShare}
              >
                <Share2 size={16} /> Dela
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
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
                    transform: isZooming ? "scale(1.25)" : "scale(1)",
                    cursor: "zoom-in",
                  }}
                  onClick={() => {
                    setModalImageIndex(activeImage);
                    setShowImageModal(true);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Visa större bild"
                />
                <span className={styles.zoomHint}>Hover för zoom</span>
              </div>

              <div className={styles.thumbnailRow}>
                {allImages.map((img, index) => (
                  <button
                    key={img + index}
                    type="button"
                    className={`${styles.thumbnailBtn} ${index === activeImage ? styles.activeThumbnail : ""}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Visa bild ${index + 1}`}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={img}
                      alt={`Bild ${index + 1}`}
                      className={styles.secondaryImage}
                      style={{ cursor: "pointer" }}
                    />
                  </button>
                ))}
              </div>

              {showImageModal && (
                <div
                  className={styles.imageModal}
                  onClick={() => setShowImageModal(false)}
                >
                  <div
                    className={styles.imageModalContent}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.closeModalBtn}
                      onClick={() => setShowImageModal(false)}
                      aria-label="Stäng"
                    >
                      <X size={28} />
                    </button>
                    {allImages.length > 1 && (
                      <>
                        <button
                          className={styles.modalNavBtn}
                          style={{ left: 0 }}
                          onClick={() =>
                            setModalImageIndex(
                              (modalImageIndex - 1 + allImages.length) %
                                allImages.length,
                            )
                          }
                          aria-label="Föregående bild"
                        >
                          <ChevronLeft size={36} />
                        </button>
                        <button
                          className={styles.modalNavBtn}
                          style={{ right: 0 }}
                          onClick={() =>
                            setModalImageIndex(
                              (modalImageIndex + 1) % allImages.length,
                            )
                          }
                          aria-label="Nästa bild"
                        >
                          <ChevronRight size={36} />
                        </button>
                      </>
                    )}
                    <img
                      src={allImages[modalImageIndex]}
                      alt={`${car.brand} ${car.model} stor bild`}
                      className={styles.modalImage}
                    />
                  </div>
                </div>
              )}
            </section>

            <div className={styles.desktopEquipmentOnly}>
              {equipmentContent}
            </div>
          </div>

          <aside className={styles.detailsColumn}>
            <section className={`solid-card ${styles.detailsCard}`}>
              <div className={styles.badges}>
                {hasValue(car.year) && (
                  <span className={styles.badge}>
                    <Calendar size={14} /> {car.year}
                  </span>
                )}
                {hasValue(car.mileage) && (
                  <span className={styles.badge}>
                    <Gauge size={14} />{" "}
                    {Number(car.mileage).toLocaleString("sv-SE")} mil
                  </span>
                )}
                {hasValue(car.fuel_type) && (
                  <span className={styles.badge}>
                    <Fuel size={14} /> {car.fuel_type}
                  </span>
                )}
                {car.transmission && (
                  <span className={styles.badge}>
                    <Settings size={14} /> {car.transmission}
                  </span>
                )}
                {car.variant && (
                  <span className={styles.badge}>
                    <Sparkles size={14} /> {car.variant}
                  </span>
                )}
                {car.color && (
                  <span className={styles.badge}>
                    <Palette size={14} /> {car.color}
                  </span>
                )}
              </div>

              <h2 className={styles.sectionTitle}>Specifikationer</h2>
              <div className={styles.specGrid}>
                {visibleSpecs.map((spec) => (
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
              {specs.length > 7 && (
                <button
                  type="button"
                  onClick={() => setShowAllSpecs(!showAllSpecs)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    cursor: "pointer",
                    padding: "0.5rem 0",
                    marginTop: "0.4rem",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.target.style.opacity = "1")}
                >
                  {showAllSpecs
                    ? "⬆ Visa mindre"
                    : `⬇ Visa mer (${specs.length - 7})`}
                </button>
              )}

              <h2 className={styles.sectionTitle}>Beskrivning</h2>
              <div className={styles.description}>
                {(showFullDescription || !car.description || car.description.length <= 400
                  ? car.description || "Ingen beskrivning tillgänglig för denna bil."
                  : car.description.slice(0, 400) + "..."
                )
                  .split("\n")
                  .map((line, index) => (
                    <span key={index} style={{ display: "block", minHeight: line.trim() === "" ? "1rem" : "auto", marginBottom: "0.5rem" }}>
                      {line}
                    </span>
                  ))}
              </div>
              {car.description && car.description.length > 400 && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    cursor: "pointer",
                    padding: "0.5rem 0",
                    marginTop: "0.2rem",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.target.style.opacity = "1")}
                >
                  {showFullDescription ? "⬆ Visa mindre" : "⬇ Visa mer"}
                </button>
              )}

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

              {shareMessage && (
                <p className={styles.shareMessage}>{shareMessage}</p>
              )}
            </section>
          </aside>
        </div>

        {/* HÄR VISAS UTRUSTNINGEN PÅ MOBIL (GÖMS PÅ DATOR) */}
        <div className={styles.mobileEquipmentOnly}>{equipmentContent}</div>

        {relatedCars.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Liknande bilar</h2>
            <p className={styles.relatedSubtitle}>
              Jämför med fler alternativ i samma segment.
            </p>
            <div className={styles.relatedGrid}>
              {relatedCars.map((relatedCar) => (
                <CarCard key={relatedCar.id} car={relatedCar} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showInterestedModal && (
        <InterestedModal
          carId={car.id}
          carBrand={car.brand}
          carModel={car.model}
          onClose={() => setShowInterestedModal(false)}
          onSuccess={() => {
            setSuccessMessage(
              "Tack! Din intresse-anmälan har skickats. Vi kontaktar dig så fort vi kan!",
            );
            setShowInterestedModal(false);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />
      )}
    </div>
  );
}

export default function CarDetails() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <CarDetailsInner />
    </GoogleReCaptchaProvider>
  );
}
