import { Request, Response } from "express";
import Medication from "../models/medication.model"

export const addMedication = async (req: Request, res: Response) => {
  try {
    const { name, type, imageUrl } = req.body;
    const medication = await Medication.create({ name, type, imageUrl, userId: (req as any).user.userId });
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: "Failed to add medication" });
  }
};
