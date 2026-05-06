import { useState, useEffect, useRef } from "react";
import styles from "./EditCarModal.module.css";
import { adminFetch } from "../utils/api";
import content from "../content/siteContent.json";
import { X, UploadCloud, Check, AlertCircle, Search } from "lucide-react";
import adminStyles from "../pages/Admin.module.css";

const EQUIPMENT_OPTIONS = [
  "ABS",
  "ACC",
  "ACC 2 klimatzoner",
  "Airbag fram",
  "Android Auto",
  "Antispinn",
  "Apple CarPlay",
  "Förarassistans",
  "Avbländande innerbackspegel",
  "Avstängningsbar airbag passagerare",
  "Backkamera",
  "Backstartshjälp",
  "Barnlås",
  "Handsfree-anslutning",
  "Broms-assistans",
  "Centrallås",
  "Delbart baksäte",
  "Radio DAB+",
  "Dimljus fram",
  "Elhissar (fram och bak)",
  "Elinfällbara sidospeglar",
  "Elektriska sidospeglar",
  "Euro 6",
  "Euro NCAP 5",
  "Fartbegränsare",
  "Adaptiv farthållare",
  "Fotgängardetektion",
  "Fällbara baksäten",
  "Färddator",
  "Navigation",
  "Helljusassistent",
  "Isofix",
  "Keyless go",
  "LED-ljus",
  "Ljussensor",
  "Läslampa",
  "Multifunktionsratt",
  "Parkeringsassistans",
  "Parkeringssensor fram",
  "Plant lastutrymme",
  "Rails",
  "Rattvärme",
  "Rear Traffic Alert",
  "Regnsensor",
  "Reservhjul",
  "Servostyrning",
  "Sidoairbags",
  "Sidokrockgardiner",
  "Sminkspegel",
  "Start-/stoppfunktion",
  "Startspärr",
  "Larm",
  "Svensksåld",
  "Uppvärmda säten bak",
  "Uppvärmda säten fram",
  "Touch-/Pekskärm",
  "Trötthetsvarnare",
  "USB-uttag",
  "Yttertemperaturmätare",
  "ACC klimatanläggning",
  "Antisladdsystem",
  "Airbag förare/passagerare",
  "Bluetooth",
  "Aluminiumfälgar",
  "Mörk tonade bakrutor",
  "Sätesvärme bak",
  "Sätesvärme fram",
  "Aircondition",
  "Farthållare",
  "Uppvärmda säten, fram",
  "Fällbart baksäte",
  "12V-uttag",
  "Justerbart svankstöd",
  "Klimatanläggning",
  "CD-spelare",
  "Elektriska fönster",
  "El-sidospeglar m. värme",
  "ESC"
].sort();

export default function EditCarModal({ car, onClose, onCarUpdated }) {
  // Normalisera equipment från DB när komponenten monteras
  const normalizeEquipment = (equipment) => {
    if (!equipment) return [];
    if (Array.isArray(equipment)) return equipment;
    if (typeof equipment === "string") {
      try {
        const parsed = JSON.parse(equipment);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [formData, setFormData] = useState({
    ...car,
    equipment: normalizeEquipment(car.equipment),
  });
  const [equipmentSearch, setEquipmentSearch] = useState("");

  // Bild-states
  const [existingImages, setExistingImages] = useState(car.images || []);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // UI-states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Drag-states för BEFINTLIGA bilder
  const [draggedExistingIndex, setDraggedExistingIndex] = useState(null);
  const [dragOverExistingIndex, setDragOverExistingIndex] = useState(null);

  // Drag-states för NYA bilder
  const [draggedNewIndex, setDraggedNewIndex] = useState(null);
  const [dragOverNewIndex, setDragOverNewIndex] = useState(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const getEquipmentArray = () => {
    if (!formData.equipment) return [];
    if (Array.isArray(formData.equipment)) return formData.equipment;
    if (typeof formData.equipment === "string") {
      try {
        const parsed = JSON.parse(formData.equipment);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    const currentEquipment = getEquipmentArray();

    setFormData((prevForm) => {
      if (checked) {
        return { ...prevForm, equipment: [...currentEquipment, value] };
      } else {
        return {
          ...prevForm,
          equipment: currentEquipment.filter((item) => item !== value),
        };
      }
    });
  };

  // --- FILHANTERING & VALIDEING ---
  const handleFileChange = (files) => {
    const newFiles = Array.from(files);

    const validFiles = newFiles.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          images: `Filen "${file.name}" är inte ett giltigt bildformat.`,
        }));
        return false;
      }

      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          images: `Filen "${file.name}" är för stor. Max är 5MB.`,
        }));
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Uppdatera filer för uppladdning
    setImages((prev) => [...prev, ...validFiles]);

    // Skapa snabba previews med URL.createObjectURL
    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviewImages((prev) => [
        ...prev,
        { id: Math.random(), url, name: file.name },
      ]);
    });

    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeExistingImage = (imgUrl) => {
    setExistingImages((prev) => prev.filter((url) => url !== imgUrl));
  };

  const removeNewImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    setPreviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // --- DRAG & DROP FÖR BEFINTLIGA BILDER ---
  const handleDragStartExisting = (index) => setDraggedExistingIndex(index);

  const handleDragOverExisting = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverExistingIndex(index);
  };

  const handleDropExisting = (e, dropIndex) => {
    e.preventDefault();
    if (draggedExistingIndex === null || draggedExistingIndex === dropIndex) {
      setDraggedExistingIndex(null);
      setDragOverExistingIndex(null);
      return;
    }
    const newImages = [...existingImages];
    [newImages[draggedExistingIndex], newImages[dropIndex]] = [
      newImages[dropIndex],
      newImages[draggedExistingIndex],
    ];
    setExistingImages(newImages);
    setDraggedExistingIndex(null);
    setDragOverExistingIndex(null);
  };

  const handleDragLeaveExisting = () => setDragOverExistingIndex(null);
  const handleDragEndExisting = () => {
    setDraggedExistingIndex(null);
    setDragOverExistingIndex(null);
  };

  // --- DRAG & DROP FÖR NYA BILDER ---
  const handleDragStartNew = (index) => setDraggedNewIndex(index);

  const handleDragOverNew = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverNewIndex(index);
  };

  const handleDropNew = (e, dropIndex) => {
    e.preventDefault();
    if (draggedNewIndex === null || draggedNewIndex === dropIndex) {
      setDraggedNewIndex(null);
      setDragOverNewIndex(null);
      return;
    }

    // Byt plats på själva filerna
    const newImagesList = [...images];
    [newImagesList[draggedNewIndex], newImagesList[dropIndex]] = [
      newImagesList[dropIndex],
      newImagesList[draggedNewIndex],
    ];
    setImages(newImagesList);

    // Byt plats på previews så gränssnittet synkar
    const newPreviewsList = [...previewImages];
    [newPreviewsList[draggedNewIndex], newPreviewsList[dropIndex]] = [
      newPreviewsList[dropIndex],
      newPreviewsList[draggedNewIndex],
    ];
    setPreviewImages(newPreviewsList);

    setDraggedNewIndex(null);
    setDragOverNewIndex(null);
  };

  const handleDragLeaveNew = () => setDragOverNewIndex(null);
  const handleDragEndNew = () => {
    setDraggedNewIndex(null);
    setDragOverNewIndex(null);
  };

  // --- DRAG & DROP FÖR UPPLADDNINGSZONEN ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  // --- SKICKA FORMULÄR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "images") {
        // Skip images, handled separately
      } else if (key === "equipment") {
        // Konvertera equipment-array till JSON-sträng
        submitData.append(key, JSON.stringify(formData[key]));
      } else {
        submitData.append(key, formData[key]);
      }
    });

    // Backend tar emot befintliga URLs och nya Filer i den ordning de läggs till
    existingImages.forEach((url) => submitData.append("images", url));
    images.forEach((file) => submitData.append("images", file));

    try {
      const res = await adminFetch(`/cars/${car.id}`, {
        method: "PUT",
        body: submitData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(content.editCarModal.messages.updated);
        setIsSuccess(true);
        onCarUpdated();
        setTimeout(onClose, 1500);
      } else {
        setMessage(data.error || content.editCarModal.messages.failed);
        setIsSuccess(false);
      }
    } catch {
      setMessage(content.editCarModal.messages.network);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={`solid-card ${styles.modalContent}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>{content.editCarModal.title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {message && (
          <div
            className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {isSuccess ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="grid-2">
            <div className="form-group">
              <label>{content.editCarModal.labels.brand}</label>
              <input
                type="text"
                name="brand"
                className="form-control"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{content.editCarModal.labels.model}</label>
              <input
                type="text"
                name="model"
                className="form-control"
                value={formData.model}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.editCarModal.labels.variant}</label>
              <select
                name="variant"
                className="form-control"
                value={formData.variant || ""}
                onChange={handleChange}
              >
                <option value="">Välj kaross</option>
                {content.editCarModal.bodyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{content.editCarModal.labels.color}</label>
              <input
                type="text"
                name="color"
                className="form-control"
                value={formData.color || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.editCarModal.labels.year}</label>
              <input
                type="number"
                name="year"
                className="form-control"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{content.editCarModal.labels.price}</label>
              <input
                type="number"
                name="price"
                className="form-control"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.editCarModal.labels.mileage}</label>
              <input
                type="number"
                name="mileage"
                className="form-control"
                value={formData.mileage}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{content.editCarModal.labels.transmission}</label>
              <select
                name="transmission"
                className="form-control"
                value={formData.transmission || ""}
                onChange={handleChange}
              >
                <option value="">Välj växellåda</option>
                {content.editCarModal.transmissionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.editCarModal.labels.fuel}</label>
              <select
                name="fuel_type"
                className="form-control"
                value={formData.fuel_type}
                onChange={handleChange}
              >
                {content.editCarModal.fuelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Hästkrafter (hk)</label>
              <input
                type="number"
                name="horsepower"
                className="form-control"
                value={formData.horsepower || ""}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Registreringsnummer</label>
              <input
                type="text"
                name="registration_number"
                className="form-control"
                value={formData.registration_number || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Registreringsdatum</label>
              <input
                type="date"
                name="registration_date"
                className="form-control"
                value={formData.registration_date || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Max trailervikt (kg)</label>
              <input
                type="number"
                name="max_trailer_weight"
                className="form-control"
                value={formData.max_trailer_weight || ""}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Drifthjul</label>
              <select
                name="drivetrain"
                className="form-control"
                value={formData.drivetrain || ""}
                onChange={handleChange}
              >
                <option value="">Välj drifthjul</option>
                <option value="Framhjulsdrift">Framhjulsdrift</option>
                <option value="Bakhjulsdrift">Bakhjulsdrift</option>
                <option value="Fyrhjulsdrift">Fyrhjulsdrift</option>
              </select>
            </div>
            <div className="form-group">
              <label>Säten</label>
              <input
                type="number"
                name="seats"
                className="form-control"
                value={formData.seats || ""}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Motorvolym (liter)</label>
              <input
                type="text"
                name="engine_volume"
                className="form-control"
                value={formData.engine_volume || ""}
                onChange={handleChange}
                placeholder="T.ex. 1,6"
                inputMode="decimal"
              />
            </div>
            <div className="form-group">
              <label>Räckvidd (WLTP) (km)</label>
              <input
                type="number"
                name="range_wltp"
                className="form-control"
                value={formData.range_wltp || ""}
                onChange={handleChange}
                placeholder="T.ex. 520"
                min="0"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Plats (Stad)</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="T.ex. Eskilstuna"
              />
            </div>
            <div className="form-group">
              <label>Vikt (kg)</label>
              <input
                type="number"
                name="weight"
                className="form-control"
                value={formData.weight || ""}
                onChange={handleChange}
                placeholder="T.ex. 1500"
                min="0"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Bränsleförbrukning (l/100km)</label>
              <input
                type="text"
                name="fuel_consumption"
                className="form-control"
                value={formData.fuel_consumption || ""}
                onChange={handleChange}
                placeholder="T.ex. 0.5"
                inputMode="decimal"
              />
            </div>
            <div className="form-group">
              <label>Antal ägare</label>
              <input
                type="number"
                name="number_of_owners"
                className="form-control"
                value={formData.number_of_owners || ""}
                onChange={handleChange}
                placeholder="T.ex. 2"
                min="0"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Nästa besiktningsdatum</label>
              <input
                type="date"
                name="next_inspection_date"
                className="form-control"
                value={formData.next_inspection_date || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              {/* Tom div för att fylla ut grid */}
            </div>
          </div>

          <div className="form-group">
            <label>{content.editCarModal.labels.description}</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className={`${adminStyles.equipmentSection}`}>
            <div className={adminStyles.equipmentHeader}>
              <label className={adminStyles.equipmentTitle}>
                Utrustning & Tillval
              </label>
              <span className={adminStyles.equipmentCounter}>
                {getEquipmentArray().length} vald
                {getEquipmentArray().length !== 1 ? "a" : ""}
              </span>
            </div>

            {/* Sökfält */}
            <div className={adminStyles.equipmentSearch}>
              <Search size={18} className={adminStyles.equipmentSearchIcon} />
              <input
                type="text"
                placeholder="Sök utrustning..."
                value={equipmentSearch}
                onChange={(e) =>
                  setEquipmentSearch(e.target.value.toLowerCase())
                }
                className={adminStyles.equipmentSearchInput}
              />
            </div>

            {/* Checkboxar Grid */}
            <div className={adminStyles.equipmentGridContainer}>
              {EQUIPMENT_OPTIONS.filter((option) =>
                option.toLowerCase().includes(equipmentSearch),
              ).map((option) => (
                <label
                  key={option}
                  className={`${adminStyles.equipmentCheckboxLabel} ${getEquipmentArray().includes(option) ? adminStyles.equipmentCheckboxLabelChecked : ""}`}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={getEquipmentArray().includes(option)}
                    onChange={handleEquipmentChange}
                    className={adminStyles.equipmentCheckbox}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {/* Visar meddelande när ingen träff */}
            {EQUIPMENT_OPTIONS.filter((option) =>
              option.toLowerCase().includes(equipmentSearch),
            ).length === 0 &&
              equipmentSearch && (
                <div className={adminStyles.equipmentNoResults}>
                  Ingen utrustning matchade "{equipmentSearch}"
                </div>
              )}

            {/* Visa valda utrustning */}
            {getEquipmentArray().length > 0 && (
              <div className={adminStyles.equipmentSelectedContainer}>
                <p className={adminStyles.equipmentSelectedLabel}>Valda:</p>
                <div className={adminStyles.equipmentSelectedTags}>
                  {getEquipmentArray().map((item) => (
                    <span key={item} className={adminStyles.equipmentTag}>
                      {item}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            equipment: getEquipmentArray().filter(
                              (e) => e !== item,
                            ),
                          }));
                        }}
                        className={adminStyles.equipmentTagRemoveBtn}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{content.editCarModal.labels.images}</label>

            {/* 📸 Befintliga bilder (Drag & Drop) */}
            {existingImages.length > 0 && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  background: "rgba(0,0,0,0.1)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  📸 Befintliga bilder (Dra för att ändra ordning)
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {existingImages.map((url, idx) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => handleDragStartExisting(idx)}
                      onDragOver={(e) => handleDragOverExisting(e, idx)}
                      onDrop={(e) => handleDropExisting(e, idx)}
                      onDragLeave={handleDragLeaveExisting}
                      onDragEnd={handleDragEndExisting}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        aspectRatio: "1",
                        border:
                          dragOverExistingIndex === idx
                            ? "3px solid var(--accent)"
                            : "2px solid var(--card-border)",
                        opacity: draggedExistingIndex === idx ? 0.5 : 1,
                        background:
                          dragOverExistingIndex === idx
                            ? "rgba(14, 165, 233, 0.2)"
                            : "rgba(0, 0, 0, 0.3)",
                        cursor: "grab",
                        transition: "all 0.2s ease",
                        transform:
                          dragOverExistingIndex === idx
                            ? "scale(1.05)"
                            : "scale(1)",
                      }}
                    >
                      <img
                        src={url}
                        alt="Befintlig"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          pointerEvents: "none",
                        }}
                        draggable={false}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "0",
                          left: "0",
                          right: "0",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                          padding: "0.3rem",
                          color: "white",
                          fontSize: "0.7rem",
                          textAlign: "center",
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(239, 68, 68, 0.9)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✨ Nya bilder (Drag & Drop) */}
            {previewImages.length > 0 && (
              <div
                style={{
                  marginBottom: "1rem",
                  background: "rgba(0,0,0,0.1)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  ✨ Nya bilder (Dra för att ändra ordning)
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {previewImages.map((preview, idx) => (
                    <div
                      key={preview.id}
                      draggable
                      onDragStart={() => handleDragStartNew(idx)}
                      onDragOver={(e) => handleDragOverNew(e, idx)}
                      onDrop={(e) => handleDropNew(e, idx)}
                      onDragLeave={handleDragLeaveNew}
                      onDragEnd={handleDragEndNew}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        aspectRatio: "1",
                        border:
                          dragOverNewIndex === idx
                            ? "3px solid var(--accent)"
                            : "2px solid #10b981",
                        opacity: draggedNewIndex === idx ? 0.5 : 1,
                        background:
                          dragOverNewIndex === idx
                            ? "rgba(16, 185, 129, 0.2)"
                            : "transparent",
                        cursor: "grab",
                        transition: "all 0.2s ease",
                        transform:
                          dragOverNewIndex === idx ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      <img
                        src={preview.url}
                        alt="Ny"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          pointerEvents: "none",
                        }}
                        draggable={false}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "0",
                          left: "0",
                          right: "0",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                          padding: "0.3rem",
                          color: "white",
                          fontSize: "0.7rem",
                          textAlign: "center",
                        }}
                      >
                        #{idx + 1 + existingImages.length}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(239, 68, 68, 0.9)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formErrors.images && (
              <div
                className={styles.errorMessage}
                style={{ color: "#ef4444", marginBottom: "0.5rem" }}
              >
                ❌ {formErrors.images}
              </div>
            )}

            {/* Uppladdningszon */}
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp, image/gif, image/avif"
              onChange={(e) => handleFileChange(e.target.files)}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <div
              className="file-upload-zone"
              style={{
                borderColor: dragActive
                  ? "var(--accent)"
                  : "var(--card-border)",
                backgroundColor: dragActive
                  ? "rgba(14, 165, 233, 0.05)"
                  : "transparent",
                transition: "all 0.2s",
                cursor: "pointer",
                padding: "2rem",
                textAlign: "center",
                borderRadius: "8px",
                borderStyle: "dashed",
                borderWidth: "2px",
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud
                size={32}
                strokeWidth={1.5}
                style={{ margin: "0 auto" }}
              />
              <p style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>
                Dra och släpp fler bilder här eller klicka för att välja
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "0.2rem",
                }}
              >
                Max 5MB per bild • JPG, PNG, WebP
              </p>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ minWidth: "120px" }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <span>Sparar...</span>
              ) : (
                <>
                  <Check size={18} />
                  <span>Spara ändringar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
