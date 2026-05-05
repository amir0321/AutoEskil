export function setPageSeo({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogUrl,
  ogImage,
  robots = "index, follow, max-image-preview:large",
}) {
  if (typeof document === "undefined") return;

  if (title) {
    document.title = title;
  }

  const setMeta = (attr, key, value) => {
    if (value == null) return;
    const selector =
      attr === "name" ? `meta[name="${key}"]` : `meta[property="${key}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };

  setMeta("name", "description", description);
  setMeta("name", "robots", robots);
  setMeta("property", "og:title", ogTitle || title);
  setMeta("property", "og:description", ogDescription || description);
  setMeta("property", "og:type", ogType);
  setMeta("property", "og:url", ogUrl);
  setMeta("property", "og:image", ogImage);

  if (canonical) {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }
}

export function setJsonLd(id, data) {
  if (typeof document === "undefined") return;

  const scriptId = `jsonld-${id}`;
  let el = document.getElementById(scriptId);

  if (!data) {
    if (el) {
      el.remove();
    }
    return;
  }

  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = scriptId;
    document.head.appendChild(el);
  }

  el.textContent = JSON.stringify(data);
}
