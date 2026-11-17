import mongoose from "mongoose";

const AuditionSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true,
    unique: true // Audition names should be unique for a given context
  },
  saison: { 
    type: Number, 
    default: () => new Date().getFullYear(),
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Audition || mongoose.model("Audition", AuditionSchema);
