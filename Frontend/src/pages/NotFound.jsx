import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './NotFound.module.css';
import content from '../content/siteContent.json';

export const route = {
    path: "*",
    index: 99
};

export default function NotFound() {
    return (
        <div className={styles.page}>
            <Navbar />
            <div className={styles.content}>
                <div className={styles.code}>404</div>
                <h1 className={styles.title}>{content.notFound.title}</h1>
                <p className={styles.sub}>{content.notFound.subtitle}</p>
                <Link to="/" className={`btn-primary ${styles.homeBtn}`}>
                    {content.notFound.button}
                </Link>
            </div>
        </div>
    );
}
