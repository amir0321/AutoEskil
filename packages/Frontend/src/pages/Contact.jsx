import { useState, useEffect } from "react";
import styles from "./Contact.module.css";
import CarCard from "../components/CarCard";
import { apiUrl } from "../utils/api";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { RECAPTCHA_SITE_KEY } from "../utils/recaptcha";

export const route = {
  path: "/kontakt",
};

const INITIAL_MATCHES_VISIBLE = 3;

const currentYear = new Date().getFullYear();

const initialForm = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  website: "",
  preferred_brand: "",
  preferred_model: "",
  preferred_fuel_type: "",
  min_year: "",
  max_mileage: "",
  max_budget: "",
  requirements: "",
};

function ContactInner() {
  const [form, setForm] = useState(initialForm);
  const [formStartedAt] = useState(() => Date.now());
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    setPageSeo({
      title: `${content.contact.heroTitleLead} ${content.contact.heroTitleAccent} – ${content.brand.name}`,
      description: content.contact.heroSubtitle,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/kontakt`
          : "/kontakt",
      ogType: "website",
    });
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!executeRecaptcha) {
      setError("reCAPTCHA är inte redo. Försök igen om ett ögonblick.");
      return;
    }
    setLoading(true);
    setError("");
    let recaptchaToken;
    try {
      recaptchaToken = await executeRecaptcha("contact_form");
    } catch {
      setError("reCAPTCHA-verifiering misslyckades. Försök igen.");
      setLoading(false);
      return;
    }

    // 1. Kontrollera om det finns några "riktiga" sökfilter
    const hasSearchFilters =
      form.preferred_brand.trim() ||
      form.preferred_model.trim() ||
      form.preferred_fuel_type ||
      form.min_year ||
      form.max_mileage ||
      form.max_budget;

    // 2. Bygg payload - skicka bara med sökparametrar om de faktiskt finns
    const payload = {
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      website: form.website, // Honeypot
      form_started_at: formStartedAt,
      source: "contact",
      requirements: form.requirements, // Vi skickar alltid med texten så admin ser den
      recaptchaToken: recaptchaToken,
    };

    // Lägg bara till dessa i payload om användaren faktiskt fyllt i dem
    if (form.preferred_brand) payload.preferred_brand = form.preferred_brand;
    if (form.preferred_model) payload.preferred_model = form.preferred_model;
    if (form.preferred_fuel_type)
      payload.preferred_fuel_type = form.preferred_fuel_type;
    if (form.min_year) payload.min_year = Number(form.min_year);
    if (form.max_mileage) payload.max_mileage = Number(form.max_mileage);
    if (form.max_budget) payload.max_budget = Number(form.max_budget);

    try {
      const res = await fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        // Här styr vi vad som visas för användaren på skärmen direkt
        // Om inga hårda filter fanns -> visa inga bilar (matches = [])
        setMatches(hasSearchFilters ? data.matches || [] : []);

        setShowAllMatches(false);
        setSent(true);
      } else {
        setError(data.error || "Något gick fel.");
      }
    } catch {
      setError("Kunde inte ansluta till servern.");
    } finally {
      setLoading(false);
    }
  };

  // Ändra denna variabel till att bara kolla de specifika bilfälten
  const hasNoCarPreferences =
    !form.preferred_brand.trim() &&
    !form.preferred_model.trim() &&
    !form.preferred_fuel_type.trim() &&
    !form.min_year &&
    !form.max_mileage &&
    !form.max_budget;
  // Vi har tagit bort !form.requirements.trim() härifrån

  const visibleMatches = showAllMatches
    ? matches
    : matches.slice(0, INITIAL_MATCHES_VISIBLE);

  const hiddenMatchesCount = Math.max(
    matches.length - visibleMatches.length,
    0,
  );

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <span className={styles.headerBadge}>Matchning med fokus på dig</span>
          <h1 className={styles.pageTitle}>
            {content.contact.heroTitleLead}{" "}
            <span className="text-accent">
              {content.contact.heroTitleAccent}
            </span>
          </h1>
          <p className={styles.pageSubtitle}>{content.contact.heroSubtitle}</p>
          <div className={styles.headerMeta}>
            <span className={styles.metaPill}>Snabb återkoppling</span>
            <span className={styles.metaPill}>Kostnadsfri förfrågan</span>
            <span className={styles.metaPill}>Personlig matchning</span>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Kontaktinfo */}
          <div className={styles.infoList}>
            {content.contact.contactInfo.map((item) => (
              <div key={item.label} className={`glass-card ${styles.infoCard}`}>
                <span className={styles.infoIcon}>{item.icon}</span>
                <div>
                  <p className={styles.infoLabel}>{item.label}</p>
                  <p className={styles.infoValue}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formulär eller Success State */}
          <div className={`solid-card ${styles.formCard}`}>
            {sent ? (
              <div className={styles.successState}>
                {hasNoCarPreferences ? (
                  <>
                    <div className={styles.successIcon}>✅</div>
                    <h3>{content.contact.infoOnly.title}</h3>
                    <p className={styles.successSub}>
                      {content.contact.infoOnly.message}
                    </p>
                    <button
                      className={`btn-primary ${styles.resetBtn}`}
                      onClick={() => {
                        setSent(false);
                        setForm(initialForm);
                        setMatches([]);
                        setShowAllMatches(false);
                      }}
                    >
                      {content.contact.success.reset}
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.successIcon}>✅</div>
                    <h3>{content.contact.success.title}</h3>
                    <p className={styles.successSub}>
                      {matches.length > 0
                        ? matches.length === 1
                          ? content.contact.success.matchesOne
                          : content.contact.success.matchesMany.replace(
                              "{count}",
                              matches.length,
                            )
                        : content.contact.success.noMatches}
                    </p>

                    {/* Ny visuell lista för matchade bilar */}
                    {matches.length > 0 && (
                      <>
                        <div className={styles.matchGrid}>
                          {visibleMatches.map((car) => (
                            <CarCard key={car.id} car={car} />
                          ))}
                        </div>

                        {matches.length > INITIAL_MATCHES_VISIBLE && (
                          <div className={styles.matchActions}>
                            {!showAllMatches ? (
                              <button
                                type="button"
                                className={`btn-secondary ${styles.matchToggleBtn}`}
                                onClick={() => setShowAllMatches(true)}
                              >
                                Visa fler ({hiddenMatchesCount} till)
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`btn-secondary ${styles.matchToggleBtn}`}
                                onClick={() => setShowAllMatches(false)}
                              >
                                Visa färre
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      className={`btn-primary ${styles.resetBtn}`}
                      onClick={() => {
                        setSent(false);
                        setForm(initialForm);
                        setMatches([]);
                        setShowAllMatches(false);
                      }}
                    >
                      {content.contact.success.reset}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formInner}>
                <h3 className={styles.formTitle}>
                  {content.contact.form.title}
                </h3>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <p className={styles.formSection}>
                  {content.contact.form.sections.contact}
                </p>

                <div
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                  aria-hidden="true"
                >
                  <label htmlFor="website">Lämna detta fält tomt</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    autoComplete="off"
                    tabIndex="-1"
                  />
                </div>

                <div className="form-group">
                  <label>{content.contact.form.labels.name}</label>
                  <input
                    type="text"
                    name="customer_name"
                    className="form-control"
                    value={form.customer_name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    placeholder={content.contact.form.placeholders.name}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{content.contact.form.labels.email}</label>
                    <input
                      type="email"
                      name="customer_email"
                      className="form-control"
                      value={form.customer_email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      placeholder={content.contact.form.placeholders.email}
                    />
                  </div>
                  <div className="form-group">
                    <label>{content.contact.form.labels.phone}</label>
                    <input
                      type="tel"
                      name="customer_phone"
                      className="form-control"
                      value={form.customer_phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder={content.contact.form.placeholders.phone}
                    />
                  </div>
                </div>

                <p className={styles.formSection}>
                  {content.contact.form.sections.wishes}{" "}
                  <span className={styles.optional}>
                    {content.contact.form.optional}
                  </span>
                </p>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{content.contact.form.labels.brand}</label>
                    <input
                      type="text"
                      name="preferred_brand"
                      className="form-control"
                      value={form.preferred_brand}
                      onChange={handleChange}
                      placeholder={content.contact.form.placeholders.brand}
                    />
                  </div>
                  <div className="form-group">
                    <label>{content.contact.form.labels.model}</label>
                    <input
                      type="text"
                      name="preferred_model"
                      className="form-control"
                      value={form.preferred_model}
                      onChange={handleChange}
                      placeholder={content.contact.form.placeholders.model}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{content.contact.form.labels.fuel}</label>
                    <select
                      name="preferred_fuel_type"
                      className="form-control"
                      value={form.preferred_fuel_type}
                      onChange={handleChange}
                    >
                      <option value="">
                        {content.contact.form.placeholders.fuelEmpty}
                      </option>
                      {content.contact.form.fuelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{content.contact.form.labels.minYear}</label>
                    <input
                      type="number"
                      name="min_year"
                      className="form-control"
                      value={form.min_year}
                      onChange={handleChange}
                      placeholder={content.contact.form.placeholders.minYear}
                      min="1990"
                      max={currentYear}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{content.contact.form.labels.maxMileage}</label>
                    <input
                      type="number"
                      name="max_mileage"
                      className="form-control"
                      value={form.max_mileage}
                      onChange={handleChange}
                      placeholder={content.contact.form.placeholders.maxMileage}
                    />
                  </div>
                  <div className="form-group">
                    <label>{content.contact.form.labels.maxBudget}</label>
                    <input
                      type="number"
                      name="max_budget"
                      className="form-control"
                      value={form.max_budget}
                      onChange={handleChange}
                      placeholder={content.contact.form.placeholders.maxBudget}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{content.contact.form.labels.requirements}</label>
                  <textarea
                    name="requirements"
                    className="form-control"
                    value={form.requirements}
                    onChange={handleChange}
                    rows="3"
                    placeholder={content.contact.form.placeholders.requirements}
                  />
                </div>

                <button
                  type="submit"
                  className={`btn-primary ${styles.submitBtn}`}
                  disabled={loading}
                >
                  {loading
                    ? content.contact.form.submitting
                    : content.contact.form.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <ContactInner />
    </GoogleReCaptchaProvider>
  );
}
