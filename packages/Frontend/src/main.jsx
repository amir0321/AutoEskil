import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import "./index.css";
import routes from "./routes.jsx";
import { RECAPTCHA_SITE_KEY } from "./utils/recaptcha.js";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <RouterProvider router={router} />
    </GoogleReCaptchaProvider>
  </StrictMode>,
);
