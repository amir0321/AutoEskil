export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (!RECAPTCHA_SITE_KEY) {
  console.error("VITE_RECAPTCHA_SITE_KEY environment variable is not set");
}
