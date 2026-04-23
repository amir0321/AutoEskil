import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import styles from './Home.module.css';
import content from '../content/siteContent.json';

export const route = {
    path: "/",
    index: 1
};

const featureIcons = [
    (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v4" />
            <circle cx="16" cy="17" r="2" /><circle cx="9" cy="17" r="2" />
            <path d="M5 17H3M19 17h2M11 17H7M19 15v2M3 15V5h11l4 4" />
        </svg>
    ),
    (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
    ),
    (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
];

export default function Home() {
    return (
        <>
            <Hero />

            {/* Stats bar */}
            <div className={styles.statsBar}>
                {content.home.stats.map(s => (
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
                        <p className={styles.eyebrow}>{content.home.featuresSection.eyebrow}</p>
                        <h2 className={styles.sectionTitle}>{content.home.featuresSection.title}</h2>
                        <p className={styles.sectionSub}>{content.home.featuresSection.subtitle}</p>
                    </div>

                    <div className={styles.featureGrid}>
                        {content.home.features.map((f, index) => (
                            <Link key={f.title} to={f.to} className={styles.featureCard}>
                                <div className={styles.featureIconWrap}>
                                    {featureIcons[index]}
                                </div>
                                <div className={styles.featureTag}>{f.tag}</div>
                                <h3 className={styles.featureTitle}>{f.title}</h3>
                                <p className={styles.featureText}>{f.text}</p>
                                <span className={styles.featureCta}>{f.cta} →</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className={styles.ctaBanner}>
                <div className={styles.ctaBannerInner}>
                    <div className={styles.ctaBannerGlow} />
                    <h2 className={styles.ctaBannerTitle}>{content.home.ctaBanner.title}</h2>
                    <p className={styles.ctaBannerSub}>{content.home.ctaBanner.subtitle}</p>
                    <div className={styles.ctaBannerBtns}>
                        <Link to="/hitta-bil" className="btn-primary">{content.home.ctaBanner.primaryCta}</Link>
                        <Link to="/bilar" className="btn-ghost">{content.home.ctaBanner.secondaryCta}</Link>
                    </div>
                </div>
            </section>
        </>
    );
}
