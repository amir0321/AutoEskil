import { Link } from "react-router-dom";
import { useEffect } from "react";
import Hero from "../components/Hero";
import styles from "./Home.module.css";
import content from "../content/siteContent.json";

import { setPageSeo } from "../utils/seo";

export const route = {
  path: "/",
  index: 1,
};

function FeatureLink({ feature, className, children }) {
  if (feature.isExternal) {
    return (
      <a
        href={feature.to}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={feature.to} className={className}>
      {children}
    </Link>
  );
}

const featureIcons = [
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v4" />
    <circle cx="16" cy="17" r="2" />
    <circle cx="9" cy="17" r="2" />
    <path d="M5 17H3M19 17h2M11 17H7M19 15v2M3 15V5h11l4 4" />
  </svg>,
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>,
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>,
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 4v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>,
];

export default function Home() {
  const { ctaBanner } = content.home;

  useEffect(() => {
    setPageSeo({
      title: `${content.brand.name} – ${content.hero.badge}`,
      description: content.hero.subtitle,
      canonical:
        typeof window !== "undefined" ? `${window.location.origin}/` : "/",
      ogType: "website",
    });
  }, []);

  return (
    <>
      <Hero />

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {content.home.stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>
              {content.home.featuresSection.eyebrow}
            </p>
            <h2 className={styles.sectionTitle}>
              {content.home.featuresSection.title}
            </h2>
            <p className={styles.sectionSub}>
              {content.home.featuresSection.subtitle}
            </p>
          </div>

          <div className={styles.featureGrid}>
            {content.home.features.map((f, index) => (
              <FeatureLink
                key={f.title}
                feature={f}
                className={styles.featureCard}
              >
                <div className={styles.featureIconWrap}>
                  {featureIcons[index]}
                </div>
                <div className={styles.featureTag}>{f.tag}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureText}>{f.text}</p>
                <span className={styles.featureCta}>
                  {f.cta}
                  {f.isExternal ? (
                    <span
                      className={styles.featureExternalBadge}
                      aria-label="Öppnar extern sida"
                    >
                      ↗
                    </span>
                  ) : (
                    " →"
                  )}
                </span>
              </FeatureLink>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaBannerGlow} />
          <h2 className={styles.ctaBannerTitle}>{ctaBanner.title}</h2>
          <p className={styles.ctaBannerSub}>{ctaBanner.subtitle}</p>
          <div className={styles.ctaBannerBtns}>
            {/* Q1-B: buyer journey first */}
            <Link to={ctaBanner.primaryCtaTo} className="btn-primary">
              {ctaBanner.primaryCta}
            </Link>
            <Link to={ctaBanner.secondaryCtaTo} className="btn-ghost">
              {ctaBanner.secondaryCta}
            </Link>
            <Link
              to={ctaBanner.tertiaryCtaTo}
              className={`btn-ghost ${styles.ctaSellLink}`}
            >
              {ctaBanner.tertiaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
