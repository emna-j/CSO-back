import mongoose from "mongoose";

const oeuvreSchema = new mongoose.Schema({
  title: { type: String, required: true },
  composers: [{ type: String, required: true }],
  arrangers: [{ type: String }],
  year: { type: String, required: true },
  genre: { type: String, required: true },
  lyrics: String,
  partition: String, // can be a filename or link
  requiresChoir: { type: Boolean, required: true },
  
  // NOUVEAU: Médias spécifiques par pupitre / tutti
  pupitreMedia: [{
    pupitre: {
      type: String,
      enum: ["soprano", "alto", "ténor", "basse", "tutti"],
      required: true
    },
    partition: { type: String, default: "" }, // fichier PDF
    paroles: { type: String, default: "" },   // fichier PDF
    audio: { type: String, default: "" },     // fichier audio
    video: { type: String, default: "" },      // fichier vidéo ou url
    choirRecording: { type: String, default: "" }, // Enregistrement concert (audio)
    choirVideo: { type: String, default: "" }      // Vidéo concert (URL ou fichier)
  }]
}, { timestamps: true });

export default mongoose.model("Oeuvre", oeuvreSchema);
