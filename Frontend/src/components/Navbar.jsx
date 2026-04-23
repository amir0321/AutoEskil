import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { apiFetch, hasAdminSession } from '../utils/api';
import content from '../content/siteContent.json';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            // Suppress console errors during session check as 401 is expected for unauthenticated users
            const oldError = console.error;
            console.error = () => {};
            try {
                const authenticated = await hasAdminSession();
                if (isMounted) {
                    setIsAuthenticated(authenticated);
                }
            } finally {
                console.error = oldError;
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await apiFetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        setIsAuthenticated(false);
        navigate('/');
        setMenuOpen(false);
    };

    const closeMenu = () => setMenuOpen(false);

    const isActive = (path) =>
        path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

    const navLinks = content.nav.links;

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.logo} onClick={closeMenu}>
                {content.brand.shortName.slice(0, 4)}<span className={styles.logoAccent}>{content.brand.shortName.slice(4)}</span>
            </Link>

            {/* Desktop links */}
            <div className={styles.links}>
                {navLinks.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`${styles.navLink} ${isActive(link.to) ? styles.active : ''}`}
                    >
                        {link.label}
                    </Link>
                ))}

                {isAuthenticated ? (
                    <div className={styles.authSection}>
                        <Link to="/admin" className={`${styles.adminBtn} ${isActive('/admin') ? styles.adminBtnActive : ''}`}>
                            {content.nav.admin}
                        </Link>
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            {content.nav.logout}
                        </button>
                    </div>
                ) : (
                    <Link to="/hitta-bil" className={`btn-primary ${styles.ctaBtn}`}>
                        {content.nav.cta}
                    </Link>
                )}
            </div>

            {/* Hamburger */}
            <button
                className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={content.nav.ariaMenu}
            >
                <span /><span /><span />
            </button>

            {/* Mobile overlay */}
            {menuOpen && (
                <div className={styles.mobileMenu}>
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`${styles.mobileLink} ${isActive(link.to) ? styles.mobileLinkActive : ''}`}
                            onClick={closeMenu}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <>
                            <Link to="/admin" className={`${styles.mobileLink}`} onClick={closeMenu}>{content.nav.admin}</Link>
                            <button onClick={handleLogout} className={styles.mobileLogout}>{content.nav.logout}</button>
                        </>
                    ) : (
                        <Link to="/hitta-bil" className={`btn-primary ${styles.mobileCta}`} onClick={closeMenu}>
                            {content.nav.mobileCta}
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
