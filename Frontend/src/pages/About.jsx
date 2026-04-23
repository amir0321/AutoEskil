import styles from './About.module.css';
import heroImage from '/assets/hero_bg.png';
import content from '../content/siteContent.json';

export const route = {
    path: "/om-oss"
};

export default function About() {
    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <img src={heroImage} alt="Verkstadsbild" className={styles.heroImage} />
                <div className={styles.heroText}>
                    <h1>{content.about.heroTitle}</h1>
                    <p>{content.about.heroSubtitle}</p>
                </div>
            </div>
            <div className={styles.content}>
                <div className="solid-card">
                    <h2>{content.about.aboutTitle}</h2>
                    {content.about.aboutParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>

                <div className={styles.philosophySection}>
                    <h2>{content.about.philosophyTitle}</h2>
                    <div className={styles.philosophyCards}>
                        {content.about.philosophyCards.map(card => (
                            <div key={card.title} className={styles.philosophyCard}>
                                <h3>{card.title}</h3>
                                <p>{card.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`solid-card ${styles.ctaSection}`}>
                    <h2>{content.about.ctaTitle}</h2>
                    <p>{content.about.ctaSubtitle}</p>
                    {/* Optional: Add a call-to-action button */}
                </div>
            </div>
        </div>
    );
}
