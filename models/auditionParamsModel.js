import mongoose from "mongoose";

const AuditionParamsSchema = new mongoose.Schema({
  auditionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Audition",
    required: false // Set to false for legacy data compatibility
  },
  nom: { type: String }, // Keeping for compatibility, but will be populated from Audition
  saison: { 
    type: Number, 
    default: () => new Date().getFullYear()
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  closingDate: { type: Date, required: true },
  sessionStartTime: { type: String, required: true }, // e.g. "09:00"
  sessionEndTime: { type: String, required: true }, // e.g. "17:30"
  // slotDurationMinutes: { type: Number, required: true, min: 1 },
  debutPause: { type: String }, // Optional: "12:00"
  finPause: { type: String },   // Optional: "13:00"
  candidateCount: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.AuditionParams || mongoose.model("AuditionParams", AuditionParamsSchema);