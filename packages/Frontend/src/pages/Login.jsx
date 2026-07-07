import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./Login.module.css";
import {
  apiFetch,
  invalidateAdminSessionCache,
  hasAdminSession,
} from "../utils/api";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";

export const route = {
  path: "/login",
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setPageSeo({
      title: `${content.login.title} – ${content.brand.name}`,
      description: content.login.subtitle,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "/login",
      ogType: "website",
      robots: "noindex, nofollow",
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // SÄKERHETSUPPDATERING: Hantera Rate Limit (429 Too Many Requests)
      if (response.status === 429) {
        setError("För många inloggningsförsök. Du är spärrad i 15 minuter.");
        setLoading(false);
        return; // Avbryt här så vi inte försöker parsa JSON om det saknas
      }

      const data = await response.json();

      if (response.ok) {
        invalidateAdminSessionCache();

        // SÄKERHETSUPPDATERING: Vi sparar ingen token här.
        // Vi sparar bara en flagga för att UI:t ska veta att vi är inloggade.
        if (rememberMe) {
          localStorage.setItem("isLoggedIn", "true");
          sessionStorage.removeItem("isLoggedIn");
        } else {
          sessionStorage.setItem("isLoggedIn", "true");
          localStorage.removeItem("isLoggedIn");
        }

        // Hantera sparande av användarnamn
        if (rememberMe) {
          localStorage.setItem("autoeskil_username", username);
        } else {
          localStorage.removeItem("autoeskil_username");
        }

        navigate("/admin");
      } else {
        setError(data.message || content.login.messages.failed);
      }
    } catch (err) {
      setError(content.login.messages.connection);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verifyExistingSession = async () => {
      // Kolla om flaggan finns först (så slipper vi fråga servern i onödan om vi vet att vi är utloggade)
      const locallyLoggedIn =
        localStorage.getItem("isLoggedIn") ||
        sessionStorage.getItem("isLoggedIn");

      if (locallyLoggedIn) {
        // Fråga servern: "Är denna användare VERKLIGEN inloggad?"
        const isReallyLoggedIn = await hasAdminSession();

        if (isReallyLoggedIn) {
          navigate("/admin");
        } else {
          // Om servern säger nej (401), då har flaggan fastnat! Vi raderar den.
          localStorage.removeItem("isLoggedIn");
          sessionStorage.removeItem("isLoggedIn");
          invalidateAdminSessionCache();
        }
      }
    };

    verifyExistingSession();

    // Hämta sparat användarnamn (detta kan vara kvar som det var)
    const savedUsername = localStorage.getItem("autoeskil_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, [navigate]);

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.bg} />
      <div className={styles.overlay} />

      <div className={`glass-card ${styles.card}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{content.login.title}</h2>
          <p className={styles.cardSubtitle}>{content.login.subtitle}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className={styles["form-group"]}>
            <label>{content.login.labels.username}</label>
            <input
              type="text"
              className={styles["form-control"]}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={content.login.placeholders.username}
              required
            />
          </div>
          <div
            className={styles["form-group"]}
            style={{ marginBottom: "2rem" }}
          >
            <label>{content.login.labels.password}</label>
            <input
              type="password"
              className={styles["form-control"]}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={content.login.placeholders.password}
              required
            />
          </div>
          <div className={styles["form-group"]}>
            <label className={styles.customCheckbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Kom ihåg mig
            </label>
          </div>
          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading
              ? content.login.button.loading
              : content.login.button.login}
          </button>
        </form>
      </div>
    </div>
  );
}
