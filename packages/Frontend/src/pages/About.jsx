import { Link } from "react-router-dom";
import { useEffect } from "react";
import styles from "./About.module.css";
import heroImage from "/assets/hero_about.svg";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";

export const route = {
  path: "/om-oss",
};

export default function About() {
  const { about } = content;

  useEffect(() => {
    setPageSeo({
      title: `${about.aboutTitle} – ${content.brand.name}`,
      description: about.heroSubtitle,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/om-oss`
          : "/om-oss",
      ogType: "website",
    });
  }, [about]);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <img src={heroImage} alt="Verkstadsbild" className={styles.heroImage} />
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>Vår resa & vision</span>
          <h1>{about.heroTitle}</h1>
          <p>{about.heroSubtitle}</p>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaPill}>Trygg bilpartner</span>
            <span className={styles.heroMetaPill}>Lokalt i Eskilstuna</span>
            <span className={styles.heroMetaPill}>Personlig service</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* ── About text ── */}
        <div className={`solid-card ${styles.aboutCard}`}>
          <h2>{about.aboutTitle}</h2>
          {about.aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {/* ── Philosophy cards ── */}
        <div className={styles.philosophySection}>
          <h2>{about.philosophyTitle}</h2>
          <div className={styles.philosophyCards}>
            {about.philosophyCards.map((card) => (
              <div key={card.title} className={styles.philosophyCard}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust bar ── */}
        <div className={styles.trustBar}>
          {about.trust.map((item) => (
            <div key={item.label} className={styles.trustItem}>
              <span className={styles.trustIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.trustStat}>{item.stat}</span>
              <span className={styles.trustLabel}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* ── Dual CTA ── */}
        <div className={`solid-card ${styles.ctaSection}`}>
          <h2>{about.ctaTitle}</h2>
          <p>{about.ctaSubtitle}</p>
          <div className={styles.ctaBtns}>
            <Link to={about.ctaPrimaryTo} className="btn-primary">
              {about.ctaPrimaryLabel}
            </Link>
            <Link to={about.ctaSecondaryTo} className="btn-ghost">
              {about.ctaSecondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
