import express from "express";
import { addMedication } from "../controllers/medication.controller";

const router = express.Router();
router.post("/add", addMedication);

export default router;
