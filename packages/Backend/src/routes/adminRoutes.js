import express from "express";
import carsRouter from "./cars.js";
import dealersRouter from "./dealers.js";
import { protect, requireRole } from "../middleware/auth.js";
import {
  getAllLeads,
  deleteLead,
  updateLeadStatus,
} from "../controllers/leadsController.js";
import {
  getAllSellRequests,
  updateSellRequestStatus,
  deleteSellRequest,
} from "../controllers/sellRequestsController.js";

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = "Internal server error";

// All admin routes require a valid JWT
router.use(protect);
router.use(requireRole("admin"));

// These routes are now prefixed with /api/admin
router.use("/cars", carsRouter);
router.use("/dealers", dealersRouter);

// Route to get all leads (protected)
router.get("/leads", async (req, res) => {
  const db = req.db;
  try {
    const result = await getAllLeads(db);
    if (result.success) {
      res.json(result.data);
    } else {
      console.error("Error fetching leads:", result.error);
      res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
    }
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

// NY: Ta bort en lead
router.delete("/leads/:id", async (req, res) => {
  try {
    const result = await deleteLead(req.db, req.params.id);
    if (result.success) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

router.put("/leads/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status är obligatorisk" });
    }

    const result = await updateLeadStatus(req.db, req.params.id, status);
    if (result.success) {
      res.json({ message: "Lead status uppdaterad" });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

router.get("/sell-requests", async (req, res) => {
  try {
    const result = await getAllSellRequests(req.db);
    if (result.success) {
      return res.json(result.data);
    }

    console.error("Error fetching sell requests:", result.error);
    return res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  } catch (error) {
    console.error("Error fetching sell requests:", error);
    return res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

router.put("/sell-requests/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status ar obligatorisk" });
    }

    const result = await updateSellRequestStatus(req.db, req.params.id, status);
    if (result.success) {
      return res.json({ message: "Status uppdaterad" });
    }

    return res.status(400).json({ error: result.error });
  } catch (error) {
    console.error("Error updating sell request status:", error);
    return res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

router.delete("/sell-requests/:id", async (req, res) => {
  try {
    const result = await deleteSellRequest(req.db, req.params.id);
    if (result.success) {
      return res.status(204).send();
    }

    return res.status(404).json({ error: result.error });
  } catch (error) {
    console.error("Error deleting sell request:", error);
    return res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

export default router;
