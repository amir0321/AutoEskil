import { useState, useRef } from "react";
import styles from "../../pages/Admin.module.css";
import { UploadCloud, X, Search } from "lucide-react";
import { adminFetch } from "../../utils/api";
import content from "../../content/siteContent.json";

const EQUIPMENT_OPTIONS = [
  // Säkerhet & Assistans
  "ABS-bromsar",
  "ABS",
  "ACC (Klimatanläggning)",
  "Aircondition",
  "Klimatanläggning",
  "Adaptiv farthållare",
  "Farthållare",
  "Antisladdsystem (ESC/ESP)",
  "Antispinn",
  "Autobroms (AEB)",
  "Avstängningsbar airbag passagerare",
  "Backkamera",
  "Backstartshjälp",
  "Döda vinkel-varning (BLIS)",
  "Filhållningsassistans (Lane Assist)",
  "Helljusassistans",
  "ISOFIX-fästen bak",
  "Parkeringssensorer (fram & bak)",
  "Regnsensor",
  "Sidoairbags",
  "Trötthetsvarnare",
  "Larm",
  "Startspärr",
  "Airbag fram",

  // Belysning & Exteriör
  "Aluminiumfälgar",
  "Dragkrok (infällbar/avtagbar)",
  "Elektrisk baklucka",
  "LED-strålkastare",
  "Matrix LED-strålkastare",
  "Panoramaglastak",
  "Rails",
  "Svensksåld",
  "Tonade rutor",

  // Komfort & Interiör
  "Ambient belysning",
  "Digitalt mätarhus",
  "Elhissar (fram & bak)",
  "Elektriska fönster",
  "Elstol förare (med minne)",
  "Head-up display",
  "Keyless Nyckelfri Start",
  "Klädsel (helskinn)",
  "Multifunktionsratt",
  "Rattvärme",
  "Sätesvärme (bak)",
  "Sätesvärme (fram)",
  "Uppvärmda säten, fram",
  "El-sidospeglar m. värme",
  "Servostyrning",
  "Fällbart baksäte",
  "Centrallås",
  "Färddator",
  "12V-uttag",
  "Justerbart svankstöd",

  // Infotainment & Teknik
  "Android Auto",
  "Apple CarPlay",
  "Bluetooth (handsfree & streaming)",
  "Navigation (GPS)",
  "Premiumljud (Harman Kardon/Bose)",
  "Pekskärm",
  "Trådlös mobilladdning",
  "USB-uttag",
  "CD-spelare",

  // Drivlina & Specifikt
  "Euro 6 (miljöklass)",
  "Fyrhjulsdrift (AWD)",
  "Motorvärmare (bränsledriven)",
  "Värmepump (elbilar)",
  "Start-/stoppfunktion",
].sort();

export default function AddCarTab({ dealers }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [formData, setFormData] = useState({
    dealer_id: dealers && dealers.length > 0 ? dealers[0].id : "",
    brand: "",
    model: "",
    variant: "",
    color: "",
    year: "",
    price: "",
    mileage: "",
    fuel_type: "Bensin",
    transmission: "Automat",
    horsepower: "",
    registration_number: "",
    registration_date: "",
    max_trailer_weight: "",
    drivetrain: "",
    seats: "",
    engine_volume: "",
    range_wltp: "",
    description: "",
    equipment: [],
    location: "",
    weight: "",
    fuel_consumption: "",
    number_of_owners: "",
    next_inspection_date: "",
  });
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const selectedDealerId =
    formData.dealer_id || (dealers.length > 0 ? dealers[0].id : "");

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageSelect = (files) => {
    const newFiles = Array.from(files);

    // Validate file types and sizes
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
          images: `Filen "${file.name}" är inte ett giltigt bildformat. Använd JPG, PNG, WebP, GIF eller AVIF.`,
        }));
        return false;
      }

      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          images: `Filen "${file.name}" är för stor. Maximal storlek är 5MB.`,
        }));
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    const totalSize =
      Array.from(images).reduce((acc, f) => acc + f.size, 0) +
      validFiles.reduce((acc, f) => acc + f.size, 0);

    if (totalSize > 50 * 1024 * 1024) {
      // 50MB total limit
      setFormErrors((prev) => ({
        ...prev,
        images: "Total filstorlek får inte överstiga 50MB",
      }));
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [
          ...prev,
          { id: Math.random(), src: e.target.result, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
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
    const newImages = [...images];
    [newImages[draggedIndex], newImages[dropIndex]] = [
      newImages[dropIndex],
      newImages[draggedIndex],
    ];
    setImages(newImages);

    // Swap previews
    const newPreviews = [...imagePreviews];
    [newPreviews[draggedIndex], newPreviews[dropIndex]] = [
      newPreviews[dropIndex],
      newPreviews[draggedIndex],
    ];
    setImagePreviews(newPreviews);

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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.brand || formData.brand.trim().length < 2) {
      errors.brand = "Märke måste vara minst 2 tecken";
    }
    if (!formData.model || formData.model.trim().length < 1) {
      errors.model = "Modell är obligatorisk";
    }
    const year = parseInt(formData.year);
    if (!formData.year || year < 1950 || year > new Date().getFullYear() + 1) {
      errors.year = `Årgången måste vara mellan 1950 och ${new Date().getFullYear() + 1}`;
    }
    const price = parseInt(formData.price);
    if (!formData.price || price <= 0) {
      errors.price = "Pris måste vara större än 0";
    }
    const mileage = parseInt(formData.mileage);
    if (!formData.mileage || mileage < 0) {
      errors.mileage = "Miltal kan inte vara negativt";
    }
    if (images.length === 0) {
      errors.images = "Minst en bild är obligatorisk";
    }
    return errors;
  };

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;

    setFormData((prevForm) => {
      if (checked) {
        return { ...prevForm, equipment: [...prevForm.equipment, value] };
      } else {
        return {
          ...prevForm,
          equipment: prevForm.equipment.filter((item) => item !== value),
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage("");
      return;
    }
    setFormErrors({});
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    const submitData = new FormData();
    const dataToSubmit = { ...formData, dealer_id: selectedDealerId };

    // Konvertera equipment-array till JSON-sträng
    Object.keys(dataToSubmit).forEach((key) => {
      if (key === "equipment") {
        submitData.append(key, JSON.stringify(dataToSubmit[key]));
      } else {
        submitData.append(key, dataToSubmit[key]);
      }
    });
    for (let i = 0; i < images.length; i++)
      submitData.append("images", images[i]);

    try {
      const res = await adminFetch("/cars", {
        method: "POST",
        body: submitData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(content.addCarTab.messages.success);
        setIsSuccess(true);
        setFormData((prev) => ({
          ...prev,
          brand: "",
          model: "",
          variant: "",
          color: "",
          year: "",
          price: "",
          mileage: "",
          transmission: "Automat",
          horsepower: "",
          registration_number: "",
          registration_date: "",
          max_trailer_weight: "",
          drivetrain: "",
          seats: "",
          engine_volume: "",
          range_wltp: "",
          description: "",
          equipment: [],
          location: "",
          weight: "",
          fuel_consumption: "",
          number_of_owners: "",
          next_inspection_date: "",
        }));
        setImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage(data.error || content.addCarTab.messages.failed);
        setIsSuccess(false);
      }
    } catch {
      setMessage(content.addCarTab.messages.network);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message && (
        <div
          className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}
        >
          {message}
        </div>
      )}
      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{content.addCarTab.dealer.label}</label>
            <select
              name="dealer_id"
              className="form-control"
              value={selectedDealerId}
              onChange={handleChange}
              required
            >
              {dealers.length === 0 && (
                <option value="">{content.addCarTab.dealer.empty}</option>
              )}
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div
              className={`form-group ${formErrors.brand ? styles.formGroupError : ""}`}
            >
              <label>{content.addCarTab.labels.brand}</label>
              <input
                type="text"
                name="brand"
                className="form-control"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder={content.addCarTab.placeholders.brand}
              />
              {formErrors.brand && (
                <div className={styles.errorMessage}>❌ {formErrors.brand}</div>
              )}
            </div>
            <div
              className={`form-group ${formErrors.model ? styles.formGroupError : ""}`}
            >
              <label>{content.addCarTab.labels.model}</label>
              <input
                type="text"
                name="model"
                className="form-control"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder={content.addCarTab.placeholders.model}
              />
              {formErrors.model && (
                <div className={styles.errorMessage}>❌ {formErrors.model}</div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.addCarTab.labels.variant}</label>
              <select
                name="variant"
                className="form-control"
                value={formData.variant}
                onChange={handleChange}
              >
                <option value="">
                  {content.addCarTab.placeholders.variant}
                </option>
                {content.addCarTab.bodyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{content.addCarTab.labels.color}</label>
              <input
                type="text"
                name="color"
                className="form-control"
                value={formData.color}
                onChange={handleChange}
                placeholder={content.addCarTab.placeholders.color}
              />
            </div>
          </div>

          <div className="grid-2">
            <div
              className={`form-group ${formErrors.year ? styles.formGroupError : ""}`}
            >
              <label>{content.addCarTab.labels.year}</label>
              <input
                type="number"
                name="year"
                className="form-control"
                value={formData.year}
                onChange={handleChange}
                required
                placeholder={content.addCarTab.placeholders.year}
              />
              {formErrors.year && (
                <div className={styles.errorMessage}>❌ {formErrors.year}</div>
              )}
            </div>
            <div
              className={`form-group ${formErrors.price ? styles.formGroupError : ""}`}
            >
              <label>{content.addCarTab.labels.price}</label>
              <input
                type="number"
                name="price"
                className="form-control"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder={content.addCarTab.placeholders.price}
              />
              {formErrors.price && (
                <div className={styles.errorMessage}>❌ {formErrors.price}</div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div
              className={`form-group ${formErrors.mileage ? styles.formGroupError : ""}`}
            >
              <label>{content.addCarTab.labels.mileage}</label>
              <input
                type="number"
                name="mileage"
                className="form-control"
                value={formData.mileage}
                onChange={handleChange}
                required
                placeholder={content.addCarTab.placeholders.mileage}
              />
              {formErrors.mileage && (
                <div className={styles.errorMessage}>
                  ❌ {formErrors.mileage}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>{content.addCarTab.labels.transmission}</label>
              <select
                name="transmission"
                className="form-control"
                value={formData.transmission}
                onChange={handleChange}
              >
                {content.addCarTab.transmissionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{content.addCarTab.labels.fuel}</label>
              <select
                name="fuel_type"
                className="form-control"
                value={formData.fuel_type}
                onChange={handleChange}
              >
                {content.addCarTab.fuelOptions.map((option) => (
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
                value={formData.horsepower}
                onChange={handleChange}
                placeholder="T.ex. 190"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Registreringsnummer</label>
              <input
                type="text"
                name="registration_number"
                className="form-control"
                value={formData.registration_number}
                onChange={handleChange}
                placeholder="T.ex. ABC123"
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
                value={formData.registration_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Max trailervikt (kg)</label>
              <input
                type="number"
                name="max_trailer_weight"
                className="form-control"
                value={formData.max_trailer_weight}
                onChange={handleChange}
                placeholder="T.ex. 2000"
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
                value={formData.drivetrain}
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
                value={formData.seats}
                onChange={handleChange}
                placeholder="T.ex. 5"
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
                value={formData.engine_volume}
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
                value={formData.range_wltp}
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
                value={formData.location}
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
                value={formData.weight}
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
                value={formData.fuel_consumption}
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
                value={formData.number_of_owners}
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
                value={formData.next_inspection_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              {/* Tom div för att fylla ut grid om det behövs */}
            </div>
          </div>

          <div className="form-group">
            <label>{content.addCarTab.labels.description}</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder={content.addCarTab.placeholders.description}
            />
          </div>

          <div className={`${styles.equipmentSection}`}>
            <div className={styles.equipmentHeader}>
              <label className={styles.equipmentTitle}>
                Utrustning & Tillval
              </label>
              <span className={styles.equipmentCounter}>
                {formData.equipment.length} vald
                {formData.equipment.length !== 1 ? "a" : ""}
              </span>
            </div>

            {/* Sökfält */}
            <div className={styles.equipmentSearch}>
              <Search size={18} className={styles.equipmentSearchIcon} />
              <input
                type="text"
                placeholder="Sök utrustning..."
                value={equipmentSearch}
                onChange={(e) =>
                  setEquipmentSearch(e.target.value.toLowerCase())
                }
                className={styles.equipmentSearchInput}
              />
            </div>

            {/* Checkboxar Grid */}
            <div className={styles.equipmentGridContainer}>
              {EQUIPMENT_OPTIONS.filter((option) =>
                option.toLowerCase().includes(equipmentSearch),
              ).map((option) => (
                <label
                  key={option}
                  className={`${styles.equipmentCheckboxLabel} ${formData.equipment.includes(option) ? styles.equipmentCheckboxLabelChecked : ""}`}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.equipment.includes(option)}
                    onChange={handleEquipmentChange}
                    className={styles.equipmentCheckbox}
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
                <div className={styles.equipmentNoResults}>
                  Ingen utrustning matchade "{equipmentSearch}"
                </div>
              )}

            {/* Visa valda utrustning */}
            {formData.equipment.length > 0 && (
              <div className={styles.equipmentSelectedContainer}>
                <p className={styles.equipmentSelectedLabel}>Valda:</p>
                <div className={styles.equipmentSelectedTags}>
                  {formData.equipment.map((item) => (
                    <span key={item} className={styles.equipmentTag}>
                      {item}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            equipment: prev.equipment.filter((e) => e !== item),
                          }));
                        }}
                        className={styles.equipmentTagRemoveBtn}
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
            <label>{content.addCarTab.labels.images}</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files)}
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
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div>
                <UploadCloud size={32} strokeWidth={1.5} />
                <p
                  style={{
                    marginTop: "0.5rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Dra och släpp bilder här eller klicka för att välja
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "0.3rem",
                  }}
                >
                  Max 50MB totalt • JPG, PNG, WebP
                </p>
              </div>
            </div>
            {formErrors.images && (
              <div className={styles.errorMessage}>❌ {formErrors.images}</div>
            )}

            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "0.75rem",
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                }}
              >
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={preview.id}
                    draggable
                    onDragStart={() => handleDragStartImage(idx)}
                    onDragOver={(e) => handleDragOverImage(e, idx)}
                    onDrop={(e) => handleDropImage(e, idx)}
                    onDragLeave={handleDragLeaveImage}
                    onDragEnd={handleDragEndImage}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      aspectRatio: "1",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      border:
                        dragOverIndex === idx
                          ? "3px solid var(--accent)"
                          : "2px solid var(--card-border)",
                      opacity: draggedIndex === idx ? 0.5 : 1,
                      background:
                        dragOverIndex === idx
                          ? "rgba(14, 165, 233, 0.2)"
                          : "rgba(0, 0, 0, 0.3)",
                      cursor: "grab",
                      transition: "all 0.2s ease",
                      transform:
                        dragOverIndex === idx ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <img
                      src={preview.src}
                      alt={preview.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                      }}
                      draggable={false}
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
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
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "rgba(220, 38, 38, 1)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "rgba(239, 68, 68, 0.9)")
                      }
                    >
                      <X size={16} />
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        right: "0",
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                        padding: "0.5rem 0.4rem 0.2rem",
                        color: "white",
                        fontSize: "0.7rem",
                        textAlign: "center",
                        wordBreak: "break-all",
                      }}
                    >
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p
              className={styles.fileCount}
              style={{ marginTop: imagePreviews.length > 0 ? "0.5rem" : "0" }}
            >
              {imagePreviews.length === 0 ? "0" : imagePreviews.length} bild(er)
              valda
            </p>
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
            style={{ cursor: "pointer" }}
          >
            {loading
              ? content.addCarTab.buttons.loading
              : content.addCarTab.buttons.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
