import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import {
  apiFetch,
  hasAdminSession,
  invalidateAdminSessionCache,
} from "../utils/api";
import content from "../content/siteContent.json";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // SÄKERHETSUPPDATERING: Vi städar bort våra nya säkerhetsflaggor, i ett finally-block
      // så de tas bort oavsett om server-anropet lyckas eller ej.
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("isLoggedIn");
      localStorage.removeItem("autoeskil_token"); // Kan ligga kvar för att rensa gamla buggar
      sessionStorage.removeItem("autoeskil_token");

      invalidateAdminSessionCache();
      setIsAuthenticated(false);
      navigate("/");
      setMenuOpen(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) =>
      path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(path);

  const navLinks = content.nav.links;

  return (
      <nav
          className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ""}`}
      >
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo} onClick={closeMenu}>
            <span className={styles.logoMark}>AE</span>
            <span>
            {content.brand.shortName.slice(0, 4)}
              <span className={styles.logoAccent}>
              {content.brand.shortName.slice(4)}
            </span>
          </span>
          </Link>

          {/* Desktop links */}
          <div className={styles.links}>
            {navLinks.map((link) =>
                link.to.startsWith("http") ? (
                    <a
                        key={link.to}
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navLink}
                    >
                      {link.label}
                    </a>
                ) : (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`${styles.navLink} ${isActive(link.to) ? styles.active : ""}`}
                    >
                      {link.label}
                    </Link>
                ),
            )}

            {/* Hitta bil-knappen visas för ALLA (både gäster och admin) */}
            <Link to="/kontakt" className={`btn-primary ${styles.ctaBtn}`}>
              {content.nav.cta}
            </Link>

            {isAuthenticated && (
                <div className={styles.authSection}>
                  <Link
                      to="/admin"
                      className={`${styles.adminBtn} ${isActive("/admin") ? styles.adminBtnActive : ""}`}
                  >
                    {content.nav.admin}
                  </Link>
                  <button onClick={handleLogout} className={styles.logoutBtn}>
                    {content.nav.logout}
                  </button>
                </div>
            )}
          </div>

          {/* Hamburger */}
          <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={content.nav.ariaMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile overlay */}
        {menuOpen && (
            <div id="mobile-navigation" className={styles.mobileMenu}>
              {navLinks.map((link) =>
                  link.to.startsWith("http") ? (
                      <a
                          key={link.to}
                          href={link.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mobileLink}
                          onClick={closeMenu}
                      >
                        {link.label}
                      </a>
                  ) : (
                      <Link
                          key={link.to}
                          to={link.to}
                          className={`${styles.mobileLink} ${isActive(link.to) ? styles.mobileLinkActive : ""}`}
                          onClick={closeMenu}
                      >
                        {link.label}
                      </Link>
                  ),
              )}

              {/* Hitta bil-knappen i mobilmenyn (visas för alla) */}
              <Link
                  to="/kontakt"
                  className={`btn-primary ${styles.mobileCta}`}
                  onClick={closeMenu}
              >
                {content.nav.mobileCta}
              </Link>

              {/* Admin och Logga ut i mobilmenyn (visas bara för inloggade) */}
              {isAuthenticated && (
                  <>
                    <Link
                        to="/admin"
                        className={`${styles.mobileLink}`}
                        style={{ marginTop: "20px" }}
                        onClick={closeMenu}
                    >
                      {content.nav.admin}
                    </Link>
                    <button onClick={handleLogout} className={styles.mobileLogout}>
                      {content.nav.logout}
                    </button>
                  </>
              )}
            </div>
        )}
      </nav>
  );
}