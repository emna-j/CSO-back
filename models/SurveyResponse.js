// models/SurveyResponse.js
import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// ─── Sous-schéma : une réponse à une question ────────────────────────────────
const ReponseSchema = new Schema(
  {
    questionId: { type: String, required: true },
    // Mixed pour accepter : string, string[], date, number…
    valeur:     { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// ─── Schéma principal : SurveyResponse ──────────────────────────────────────
const SurveyResponseSchema = new Schema(
  {
    survey: {
      type: ObjectId,
      ref: 'Survey',
      required: true,
    },
    choriste: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    reponses: {
      type: [ReponseSchema],
      default: [],
    },
    soumisLe: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ─── Contrainte d'unicité : un choriste ne répond qu'une seule fois ──────────
SurveyResponseSchema.index({ survey: 1, choriste: 1 }, { unique: true });

export default mongoose.model('SurveyResponse', SurveyResponseSchema);
