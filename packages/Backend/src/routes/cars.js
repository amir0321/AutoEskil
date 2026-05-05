import express from "express";
import multer from "multer";
import path from "path";
import { fileTypeFromFile } from "file-type";
import fsPromises from "fs/promises";
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
const allowedImageExt = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
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

        // SÄKERHETSUPPDATERING: Magic Bytes validering
        if (req.files && req.files.length > 0) {
          // 1. Verifiera att alla filer är äkta bilder
          for (const file of req.files) {
            const meta = await fileTypeFromFile(file.path);

            if (!meta || !meta.mime.startsWith("image/")) {
              console.warn(`Säkerhetsvarning: Fejkad fil blockerad vid biltillägg (${file.originalname})`);

              // Städa upp filer från disken
              for (const f of req.files) {
                await fsPromises.unlink(f.path).catch(() => {});
              }

              return res.status(400).json({
                error: "Säkerhetsfel: En eller flera filer är inte riktiga bilder.",
              });
            }
          }

          // 2. Ladda upp till Cloudinary om valideringen passerar
          const uploadPromises = req.files.map((file) => uploadImage(file.path));
          const uploadedUrls = await Promise.all(uploadPromises);
          carData.images = [...carData.images, ...uploadedUrls];

          // 3. Städa upp de lokala filerna efter uppladdning
          for (const file of req.files) {
            await fsPromises.unlink(file.path).catch(() => {});
          }
        }

        const result = await addCar(req.db, carData);
        if (result.success) {
          res.status(201).json({
            message: "Bil tillagd!",
            carId: result.carId,
            listingId: result.listingId,
          });
        } else {
          res.status(400).json({ error: result.error });
        }
      } catch (error) {
        console.error("Error in POST /cars:", error);
        // Fallback-städning vid oväntade fel
        if (req.files) {
          for (const file of req.files) {
            await fsPromises.unlink(file.path).catch(() => {});
          }
        }
        res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
      }
    },
);

// PUBLIK: Alla kan se listan med bilar
router.get("/", async (req, res) => {
  try {
    const cars = await req.db.all(`
      SELECT c.*,
             (
               SELECT json_group_array(image_url)
               FROM (
                      SELECT image_url
                      FROM car_images
                      WHERE car_id = c.id
                      ORDER BY id ASC
                    )
             ) as car_images_list
      FROM cars c
      ORDER BY c.updated_at DESC  -- <--- DENNA RAD GÖR MAGIN!
    `);

    const formattedCars = cars.map((car) => {
      // ... resten av din befintliga mappnings-logik (images, equipmentList osv)
      let images = [];
      if (car.car_images_list) {
        images = JSON.parse(car.car_images_list).filter((url) => url !== null);
      }
      if (images.length === 0 && car.image_url) {
        images = [car.image_url];
      }
      delete car.car_images_list;

      let equipmentList = [];
      if (car.equipment) {
        try {
          equipmentList = JSON.parse(car.equipment);
        } catch (e) {
          equipmentList = [];
        }
      }

      return {
        ...car,
        images: images,
        equipmentList: equipmentList,
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
                   (
                     SELECT json_group_array(image_url)
                     FROM (
                       SELECT image_url
                       FROM car_images
                       WHERE car_id = c.id
                       ORDER BY id ASC
                     )
                   ) as car_images_list
            FROM cars c
            LEFT JOIN dealers d ON c.dealer_id = d.id
            WHERE c.listing_id = ? OR c.id = ?
        `,
      [req.params.id, req.params.id],
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

    let equipmentList = [];
    if (car.equipment) {
      try {
        equipmentList = JSON.parse(car.equipment);
      } catch (e) {
        equipmentList = [];
      }
    }

    const formattedCar = {
      ...car,
      images: images,
      equipmentList: equipmentList,
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

        // SÄKERHETSUPPDATERING: Magic Bytes validering
        if (req.files && req.files.length > 0) {
          // 1. Verifiera att alla filer är äkta bilder
          for (const file of req.files) {
            const meta = await fileTypeFromFile(file.path);

            if (!meta || !meta.mime.startsWith("image/")) {
              console.warn(`Säkerhetsvarning: Fejkad fil blockerad vid biluppdatering (${file.originalname})`);

              // Städa upp filer från disken
              for (const f of req.files) {
                await fsPromises.unlink(f.path).catch(() => {});
              }

              return res.status(400).json({
                error: "Säkerhetsfel: En eller flera filer är inte riktiga bilder.",
              });
            }
          }

          // 2. Ladda upp till Cloudinary om valideringen passerar
          const uploadPromises = req.files.map((file) => uploadImage(file.path));
          const uploadedUrls = await Promise.all(uploadPromises);
          carData.images = [...carData.images, ...uploadedUrls];

          // 3. Städa upp de lokala filerna efter uppladdning
          for (const file of req.files) {
            await fsPromises.unlink(file.path).catch(() => {});
          }
        }

        const result = await updateCar(req.db, req.params.id, carData);
        if (result.success) {
          res.json({ message: "Bil uppdaterad." });
        } else {
          res.status(404).json({ error: result.error });
        }
      } catch (error) {
        console.error("Error in PUT /cars/:id:", error);
        // Fallback-städning vid oväntade fel
        if (req.files) {
          for (const file of req.files) {
            await fsPromises.unlink(file.path).catch(() => {});
          }
        }
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
