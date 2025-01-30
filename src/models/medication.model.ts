import mongoose from "mongoose";

const MedicationSchema = new mongoose.Schema({
  name: String,
  type: String,
  imageUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Medication", MedicationSchema);
