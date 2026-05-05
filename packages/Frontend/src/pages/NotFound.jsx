import { Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import styles from "./NotFound.module.css";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";

export const route = {
  path: "*",
  index: 99,
};

export default function NotFound() {
  useEffect(() => {
    setPageSeo({
      title: `404 – ${content.brand.name}`,
      description: content.notFound.subtitle,
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/404`
          : "/404",
      ogType: "website",
      robots: "noindex, nofollow",
    });
  }, []);

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
