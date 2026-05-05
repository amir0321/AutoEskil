import { Link } from 'react-router-dom';
import styles from './Hero.module.css';
import content from '../content/siteContent.json';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroBg} />
            <div className={styles.heroOverlay} />

            {/* Decorative orbs */}
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.heroContent}>
                <div className={styles.badge}>
                    <span className={styles.badgeDot} />
                    {content.hero.badge}
                </div>

                <h1 className={styles.heroTitle}>
                    {content.hero.titleLead}<br />
                    <span className={styles.heroGradient}>{content.hero.titleAccent}</span>
                </h1>

                <p className={styles.heroSubtitle}>
                    {content.hero.subtitle}
                </p>

                <div className={styles.heroActions}>
                    <Link to="/kontakt" className={`btn-primary ${styles.heroCta}`}>
                        {content.hero.primaryCta}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </Link>
                    <Link to="/bilar" className={`btn-ghost ${styles.heroSecondary}`}>
                        {content.hero.secondaryCta}
                    </Link>
                </div>

                <div className={styles.heroTrust}>
                    {content.hero.trustItems.map((item, index) => (
                        <div key={item} className={styles.trustCluster}>
                            <div className={styles.trustItem}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                <span>{item}</span>
                            </div>
                            {index < content.hero.trustItems.length - 1 && <div className={styles.trustDivider} />}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
