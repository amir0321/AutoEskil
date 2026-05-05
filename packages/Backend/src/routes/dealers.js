import express from "express";
import {
  addDealer,
  getAllDealers,
  updateDealer,
  deleteDealer,
} from "../controllers/dealersController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = "Internal server error";

// Alla rutter i denna fil är skyddade
router.use(protect);
router.use(requireRole("admin"));

router.post("/", async (req, res) => {
  try {
    const result = await addDealer(req.db, req.body);
    if (result.success) {
      res.status(201).json({ message: "Handlare tillagd!", id: result.id });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error creating dealer:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});
router.get("/", async (req, res) => {
  try {
    const dealers = await getAllDealers(req.db);
    res.json(dealers);
  } catch (error) {
    console.error("Error fetching dealers:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

// NY: Uppdatera en handlare
router.put("/:id", async (req, res) => {
  try {
    const result = await updateDealer(req.db, req.params.id, req.body);
    if (result.success) {
      res.json({ message: "Handlare uppdaterad.", dealer: result.dealer });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error updating dealer:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

// NY: Ta bort en handlare
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteDealer(req.db, req.params.id);
    if (result.success) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error deleting dealer:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

export default router;
