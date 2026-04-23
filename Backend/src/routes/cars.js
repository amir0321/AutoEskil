import express from "express";
import multer from "multer";
import path from "path";
import { addCar, updateCar, deleteCar } from "../controllers/carsController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { uploadImage } from "../services/imageService.js";

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = "Internal server error";

// Skapa en lokal uppladdningsmapp om den inte finns
import fs from "fs";
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
const allowedImageExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const upload = multer({
  dest: "uploads/",
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isImageMime = (file.mimetype || "").startsWith("image/");
    if (isImageMime && allowedImageExt.has(ext)) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed (jpg, jpeg, png, webp, gif)."));
  },
});

// SKYDDAD: Endast admin kan lägga till en bil
router.post(
  "/",
  protect,
  requireRole("admin"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const carData = { ...req.body };
      carData.images = carData.images
        ? Array.isArray(carData.images)
          ? carData.images
          : [carData.images]
        : [];

      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) => uploadImage(file.path));
        const uploadedUrls = await Promise.all(uploadPromises);
        carData.images = [...carData.images, ...uploadedUrls];
      }

      const result = await addCar(req.db, carData);
      if (result.success) {
        res.status(201).json({ message: "Bil tillagd!", carId: result.carId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error in POST /cars:", error);
      res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
    }
  },
);

// PUBLIK: Alla kan se listan med bilar
router.get("/", async (req, res) => {
  try {
    const cars = await req.db.all(`
            SELECT c.*, 
                   json_group_array(ci.image_url) as car_images_list
            FROM cars c
            LEFT JOIN car_images ci ON c.id = ci.car_id
            GROUP BY c.id
        `);

    const formattedCars = cars.map((car) => {
      let images = [];
      if (car.car_images_list) {
        images = JSON.parse(car.car_images_list).filter((url) => url !== null);
      }
      if (images.length === 0 && car.image_url) {
        images = [car.image_url];
      }
      delete car.car_images_list;
      return {
        ...car,
        images: images,
      };
    });

    res.json(formattedCars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

// PUBLIK: Hämta en specifik bil
router.get("/:id", async (req, res) => {
  try {
    const car = await req.db.get(
      `
            SELECT c.*,
                   d.id as dealer_ref_id,
                   d.name as dealer_name,
                   d.contact_person as dealer_contact_person,
                   d.email as dealer_email,
                   d.phone as dealer_phone,
                   json_group_array(ci.image_url) as car_images_list
            FROM cars c
            LEFT JOIN dealers d ON c.dealer_id = d.id
            LEFT JOIN car_images ci ON c.id = ci.car_id
            WHERE c.id = ?
            GROUP BY c.id
        `,
      [req.params.id],
    );

    if (!car) {
      return res.status(404).json({ error: "Bilen kunde inte hittas." });
    }

    let images = [];
    if (car.car_images_list) {
      // Filtrera bort eventuella null-värden om inga bilder finns
      images = JSON.parse(car.car_images_list).filter((url) => url !== null);
    }
    // Fallback för äldre bilar som kan ha image_url direkt på car-objektet
    if (images.length === 0 && car.image_url) {
      images = [car.image_url];
    }
    delete car.car_images_list; // Städa upp

    const formattedCar = {
      ...car,
      images: images,
      dealer: car.dealer_name
        ? {
            id: car.dealer_ref_id,
            name: car.dealer_name,
            contact_person: car.dealer_contact_person,
            email: car.dealer_email,
            phone: car.dealer_phone,
          }
        : null,
    };

    delete formattedCar.dealer_ref_id;
    delete formattedCar.dealer_name;
    delete formattedCar.dealer_contact_person;
    delete formattedCar.dealer_email;
    delete formattedCar.dealer_phone;

    res.json(formattedCar);
  } catch (error) {
    console.error(`Error fetching car with id ${req.params.id}:`, error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

// SKYDDAD: Endast admin kan uppdatera en bil
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const carData = { ...req.body };
      if (carData.images) {
        carData.images = Array.isArray(carData.images)
          ? carData.images
          : [carData.images];
      } else {
        carData.images = [];
      }

      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) => uploadImage(file.path));
        const uploadedUrls = await Promise.all(uploadPromises);
        carData.images = [...carData.images, ...uploadedUrls];
      }

      const result = await updateCar(req.db, req.params.id, carData);
      if (result.success) {
        res.json({ message: "Bil uppdaterad." });
      } else {
        res.status(404).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error in PUT /cars/:id:", error);
      res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
    }
  },
);

// SKYDDAD: Endast admin kan ta bort en bil
router.delete("/:id", protect, requireRole("admin"), async (req, res) => {
  try {
    const result = await deleteCar(req.db, req.params.id);
    if (result.success) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error in DELETE /cars/:id:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  if (
    error &&
    error.message &&
    error.message.includes("Only image files are allowed")
  ) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
