import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa'; // Exempel med react-icons
import content from '../content/siteContent.json';

// Ikoner för sociala medier
const socialIcons = [
    { href: content.footer.socialLinks[0].href, icon: <FaFacebook />, label: 'Facebook' },
    { href: content.footer.socialLinks[1].href, icon: <FaInstagram />, label: 'Instagram' },
    { href: content.footer.socialLinks[2].href, icon: <FaTwitter />, label: 'Twitter / X' },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <Link to="/" className={styles.logo}>
                            {content.brand.shortName.slice(0, 4)}<span className={styles.logoAccent}>{content.brand.shortName.slice(4)}</span>
                        </Link>
                        <p className={styles.tagline}>
                            {content.footer.tagline}
                        </p>
                    </div>

                    <div className={styles.columns}>
                        {content.footer.columns.map(col => (
                            <div key={col.heading} className={styles.col}>
                                <p className={styles.colHeading}>{col.heading}</p>
                                {col.links && col.links.map(link => (
                                    link.to
                                        ? <Link key={link.label} to={link.to} className={styles.colLink}>{link.label}</Link>
                                        : <a key={link.label} href={link.href} className={styles.colLink}>{link.label}</a>
                                ))}
                                {col.text && col.text.map(t => (
                                    <p key={t} className={styles.colText}>{t}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copy}>© {year} {content.footer.copyrightSuffix}</p>

                    <div className={styles.socials}>
                        {socialIcons.map((social, index) => (
                            <a key={index} href={social.href} className={styles.socialLink} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
