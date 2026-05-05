import "./sellCars.css";
import { useState, useEffect } from "react";
import { apiUrl } from "../utils/api";
import content from "../content/siteContent.json";
import { setPageSeo } from "../utils/seo";

export const route = {
  path: "/sell-car",
};

const initialForm = {
  seller_name: "",
  seller_email: "",
  seller_phone: "",
  reg_number: "",
  car_brand: "",
  car_model: "",
  car_year: "",
  mileage: "",
  expected_price: "",
  has_damage: false,
  damage_details: "",
  condition_notes: "",
  website: "",
};

export default function SellCars() {
  const [form, setForm] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [formStartedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [yearError, setYearError] = useState("");

  useEffect(() => {
    setPageSeo({
      title: `Sälj din bil – ${content.brand.name}`,
      description:
        "Skicka in uppgifter om din bil och få ett tryggt erbjudande från AutoEskil.",
      canonical:
        typeof window !== "undefined"
          ? `${window.location.origin}/sell-car`
          : "/sell-car",
      ogType: "website",
    });
  }, []);

  const currentYear = new Date().getFullYear();

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "min_year") {
      if (value && Number(value) > currentYear) {
        setYearError(
          `Värdet måste vara mindre än eller lika med ${currentYear}`,
        );
      } else {
        setYearError("");
      }
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert(
          `Filen ${file.name} är inte ett giltigt bildformat. Använd JPG, PNG, WebP, GIF eller AVIF.`,
        );
        return false;
      }

      if (file.size > maxSize) {
        alert(`Filen ${file.name} är för stor. Maximal storlek är 5MB.`);
        return false;
      }

      return true;
    });

    // Combine with existing files, limit to 10 total
    const allFiles = [...imageFiles, ...validFiles];
    const limitedFiles = allFiles.slice(0, 10);
    if (allFiles.length > 10) {
      alert(
        `Du kan ladda upp max 10 bilder totalt. ${allFiles.length - 10} bild(er) togs bort.`,
      );
    }

    setImageFiles(limitedFiles);

    // Create previews for all files (including existing ones)
    const previews = limitedFiles.map((file) => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreviews);

    // Clear the input so user can select files again
    event.target.value = "";
  };

  const removeImage = (index) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);

    // Update the file input
    const imageInput = document.getElementById("images");
    if (imageInput && updatedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      updatedFiles.forEach((file) => dataTransfer.items.add(file));
      imageInput.files = dataTransfer.files;
    } else if (imageInput) {
      imageInput.value = "";
    }
  };

  const moveImageUp = (index) => {
    if (index === 0) return;

    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];

    // Swap
    [newFiles[index - 1], newFiles[index]] = [
      newFiles[index],
      newFiles[index - 1],
    ];
    [newPreviews[index - 1], newPreviews[index]] = [
      newPreviews[index],
      newPreviews[index - 1],
    ];

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);

    // Update file input
    const imageInput = document.getElementById("images");
    const dataTransfer = new DataTransfer();
    newFiles.forEach((file) => dataTransfer.items.add(file));
    imageInput.files = dataTransfer.files;
  };

  const moveImageDown = (index) => {
    if (index === imageFiles.length - 1) return;

    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];

    // Swap
    [newFiles[index], newFiles[index + 1]] = [
      newFiles[index + 1],
      newFiles[index],
    ];
    [newPreviews[index], newPreviews[index + 1]] = [
      newPreviews[index + 1],
      newPreviews[index],
    ];

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);

    // Update file input
    const imageInput = document.getElementById("images");
    const dataTransfer = new DataTransfer();
    newFiles.forEach((file) => dataTransfer.items.add(file));
    imageInput.files = dataTransfer.files;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = "var(--accent)";
    e.currentTarget.style.background = "rgba(14, 165, 233, 0.08)";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = "var(--card-border)";
    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = "var(--card-border)";
    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";

    const files = Array.from(e.dataTransfer.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        return false;
      }
      if (file.size > maxSize) {
        return false;
      }
      return true;
    });

    // Combine with existing files, limit to 10 total
    const allFiles = [...imageFiles, ...validFiles];
    const limitedFiles = allFiles.slice(0, 10);

    if (allFiles.length > 10) {
      alert(
        `Du kan ladda upp max 10 bilder totalt. ${allFiles.length - 10} bild(er) togs bort.`,
      );
    }

    setImageFiles(limitedFiles);

    // Create previews for all files
    const previews = limitedFiles.map((file) => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreviews);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("seller_name", form.seller_name);
    formData.append("seller_email", form.seller_email);
    formData.append("seller_phone", form.seller_phone);
    formData.append("reg_number", form.reg_number);
    formData.append("car_brand", form.car_brand);
    formData.append("car_model", form.car_model);
    formData.append("website", form.website);
    formData.append("form_started_at", formStartedAt);
    formData.append("has_damage", form.has_damage);

    if (form.car_year) formData.append("car_year", form.car_year);
    if (form.mileage) formData.append("mileage", form.mileage);
    if (form.expected_price)
      formData.append("expected_price", form.expected_price);
    if (form.damage_details)
      formData.append("damage_details", form.damage_details);
    if (form.condition_notes)
      formData.append("condition_notes", form.condition_notes);

    // Add image files
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch(apiUrl("/api/sell-requests"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Kunde inte skicka forfragan. Forsok igen.");
        return;
      }

      setSuccess(
        "Tack! Din säljförfrågan är skickad. Vi kontaktar dig inom kort.",
      );
      setForm(initialForm);
      setImageFiles([]);
      setImagePreviews([]);
    } catch {
      setError(
        "Kunde inte ansluta till servern. Kontrollera anslutningen och forsok igen.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragStartImage = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOverImage = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDropImage = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Swap images
    const newFiles = [...imageFiles];
    [newFiles[draggedIndex], newFiles[dropIndex]] = [
      newFiles[dropIndex],
      newFiles[draggedIndex],
    ];
    setImageFiles(newFiles);

    // Swap previews
    const newPreviews = [...imagePreviews];
    [newPreviews[draggedIndex], newPreviews[dropIndex]] = [
      newPreviews[dropIndex],
      newPreviews[draggedIndex],
    ];
    setImagePreviews(newPreviews);

    // Update file input
    const imageInput = document.getElementById("images");
    const dataTransfer = new DataTransfer();
    newFiles.forEach((file) => dataTransfer.items.add(file));
    imageInput.files = dataTransfer.files;

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeaveImage = () => {
    setDragOverIndex(null);
  };

  const handleDragEndImage = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section className="sellCarsPage">
      <div className="sellCarsHeader">
        <span className="sellCarsBadge">Sälj snabbt & tryggt</span>
        <h1>Sälj din bil</h1>
        <p>
          Fyll i uppgifter om bilen och ditt registreringsnummer. Vi granskar
          forfragan och aterkommer till dig.
        </p>
        <div
          className="sellCarsHighlights"
          aria-label="Fördelar med vår process"
        >
          <div className="sellCarsHighlightItem">
            <span className="sellCarsHighlightValue">24h</span>
            <span className="sellCarsHighlightLabel">Snabb återkoppling</span>
          </div>
          <div className="sellCarsHighlightItem">
            <span className="sellCarsHighlightValue">0 kr</span>
            <span className="sellCarsHighlightLabel">
              Kostnadsfri värdering
            </span>
          </div>
          <div className="sellCarsHighlightItem">
            <span className="sellCarsHighlightValue">100%</span>
            <span className="sellCarsHighlightLabel">Trygg hantering</span>
          </div>
        </div>
      </div>

      <form className="sellCarsForm solid-card" onSubmit={handleSubmit}>
        {error && (
          <div className="sellCarsAlert sellCarsAlertError">{error}</div>
        )}
        {success && (
          <div className="sellCarsAlert sellCarsAlertSuccess">{success}</div>
        )}

        <div className="sellCarsHoneypot" aria-hidden="true">
          <label htmlFor="website">Lämna detta fält tomt</label>
          <input
            id="website"
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            autoComplete="off"
            tabIndex="-1"
          />
        </div>

        <h2>Kontaktuppgifter</h2>
        <div className="sellCarsGrid">
          <div className="form-group">
            <label htmlFor="seller_name">Namn *</label>
            <input
              id="seller_name"
              className="form-control"
              name="seller_name"
              value={form.seller_name}
              onChange={handleChange}
              autoComplete="name"
              minLength={2}
              maxLength={120}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="seller_email">E-post *</label>
            <input
              id="seller_email"
              type="email"
              className="form-control"
              name="seller_email"
              value={form.seller_email}
              onChange={handleChange}
              autoComplete="email"
              maxLength={120}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="seller_phone">Telefon *</label>
            <input
              id="seller_phone"
              type="tel"
              className="form-control"
              name="seller_phone"
              value={form.seller_phone}
              onChange={handleChange}
              autoComplete="tel"
              minLength={7}
              maxLength={20}
              required
            />
          </div>
        </div>

        <h2>Biluppgifter</h2>
        <div className="sellCarsGrid">
          <div className="form-group">
            <label htmlFor="reg_number">Registreringsnummer *</label>
            <input
              id="reg_number"
              className="form-control"
              name="reg_number"
              value={form.reg_number}
              onChange={handleChange}
              placeholder="ABC123"
              autoComplete="off"
              minLength={6}
              maxLength={10}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="car_brand">Märke</label>
            <input
              id="car_brand"
              className="form-control"
              name="car_brand"
              value={form.car_brand}
              onChange={handleChange}
              maxLength={60}
              placeholder="Volvo"
            />
          </div>
          <div className="form-group">
            <label htmlFor="car_model">Modell</label>
            <input
              id="car_model"
              className="form-control"
              name="car_model"
              value={form.car_model}
              onChange={handleChange}
              maxLength={60}
              placeholder="XC60"
            />
          </div>
          <div className="form-group">
            <label htmlFor="car_year">Årsmodell</label>
            <input
              id="car_year"
              type="number"
              className="form-control"
              name="car_year"
              value={form.car_year}
              onChange={handleChange}
              min={1950}
              max={currentYear}
              placeholder="2019"
            />
            {yearError && <div className="error">{yearError}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="mileage">Miltal (mil)</label>
            <input
              id="mileage"
              type="number"
              className="form-control"
              name="mileage"
              value={form.mileage}
              onChange={handleChange}
              min={0}
              max={150000}
              placeholder="9800"
            />
          </div>
          <div className="form-group">
            <label htmlFor="expected_price">Onskat pris (kr)</label>
            <input
              id="expected_price"
              type="number"
              className="form-control"
              name="expected_price"
              value={form.expected_price}
              onChange={handleChange}
              min={0}
              max={10000000}
              placeholder="220000"
            />
          </div>
        </div>

        <label className="sellCarsCheckboxRow" htmlFor="has_damage">
          <input
            id="has_damage"
            type="checkbox"
            name="has_damage"
            checked={form.has_damage}
            onChange={handleChange}
          />
          <span className="sellCarsCheckboxTextWrap">
            <span className="sellCarsCheckboxTitle">
              Finns skador eller lackskavank?
            </span>
            <span className="sellCarsCheckboxHint">
              Markera om bilen har repor, bucklor eller andra skador.
            </span>
          </span>
        </label>

        {form.has_damage && (
          <div className="form-group space" style={{ paddingTop: "0.5rem" }}>
            <label htmlFor="damage_details">Beskriv skador *</label>
            <textarea
              id="damage_details"
              className="form-control"
              name="damage_details"
              value={form.damage_details}
              onChange={handleChange}
              rows={3}
              maxLength={1500}
              required
            />
          </div>
        )}

        <div className="form-group space">
          <label htmlFor="condition_notes">
            Övrigt om skick, servicehistorik eller utrustning
          </label>
          <textarea
            id="condition_notes"
            className="form-control"
            name="condition_notes"
            value={form.condition_notes}
            onChange={handleChange}
            rows={4}
            maxLength={1500}
          />
        </div>

        <div className="form-group">
          <label htmlFor="images">Bilder av bilen</label>
          <p className="form-help-text">
            Max 10 bilder, varje bild max 5MB. Accepterade format: JPG, PNG,
            WebP, GIF, AVIF
          </p>

          <div
            className="sellCarsDragDropZone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleImageChange}
              className="sellCarsFileInput"
            />
            <div className="sellCarsDropZoneContent">
              <div className="sellCarsDropZoneIcon">📸</div>
              <div className="sellCarsDropZoneText">
                <p className="sellCarsDropZoneMain">Dra och släpp bilder här</p>
                <p className="sellCarsDropZoneAlt">
                  eller klicka för att välja filer
                </p>
              </div>
            </div>
          </div>
        </div>

        {imagePreviews.length > 0 && (
          <div className="sellCarsImagePreviewGrid">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="sellCarsImagePreviewItem"
                draggable
                onDragStart={() => handleDragStartImage(index)}
                onDragOver={(e) => handleDragOverImage(e, index)}
                onDrop={(e) => handleDropImage(e, index)}
                onDragLeave={handleDragLeaveImage}
                onDragEnd={handleDragEndImage}
              >
                <img src={preview} alt={`Förhandsvisning ${index + 1}`} />
                <div className="sellCarsImageControls">
                  <button
                    type="button"
                    onClick={() => moveImageUp(index)}
                    className="sellCarsImageBtn sellCarsImageBtnUp"
                    title="Flytta upp"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImageDown(index)}
                    className="sellCarsImageBtn sellCarsImageBtnDown"
                    title="Flytta ner"
                    disabled={index === imagePreviews.length - 1}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="sellCarsRemoveImageBtn"
                  title="Ta bort bild"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn-primary sellCarsSubmit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Skickar..." : "Skicka saljforfragan"}
        </button>
      </form>
    </section>
  );
}
