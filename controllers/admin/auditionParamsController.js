import AuditionParams from '../../models/auditionParamsModel.js';
import AuditionSlot from '../../models/auditionSlotModel.js';

import Audition from '../../models/auditionModel.js';

// Create
export const saveAuditionParams = async (req, res) => {
  try {
    const { auditionId, closingDate, endDate } = req.body;

    if (new Date(closingDate) <= new Date(endDate)) {
      return res.status(400).json({ message: "La date de clôture doit être après la date de fin de l'audition." });
    }

    // Fetch audition details to populate nom/saison if needed for compatibility
    const audition = await Audition.findById(auditionId);
    if (!audition) return res.status(404).json({ message: "Audition parente introuvable." });

    const params = new AuditionParams({
      ...req.body,
      nom: audition.nom,
      saison: audition.saison
    });
    
    await params.save();
    return res.status(201).json({ message: "Session de planning enregistrée.", params });
  } catch (err) {
    console.error("Error saving audition params:", err);
    return res.status(400).json({ message: err.message });
  }
};

// Read all
export const listAuditionParams = async (req, res) => {
  try {
    const sets = await AuditionParams.find().sort({ createdAt: -1 });
    return res.status(200).json(sets);
  } catch (err) {
    console.error("Error listing audition params:", err);
    return res.status(500).json({ message: "Impossible de récupérer les paramètres." });
  }
};

// Read one
export const getAuditionParamsById = async (req, res) => {
  try {
    const { id } = req.params;
    const params = await AuditionParams.findById(id);
    if (!params) return res.status(404).json({ message: "Paramètres introuvables." });
    return res.status(200).json(params);
  } catch (err) {
    console.error("Error fetching audition params:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Update
export const updateAuditionParams = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await AuditionParams.findById(id);
    if (!existing) return res.status(404).json({ message: "Paramètres introuvables." });

    const closingDate = req.body.closingDate ? new Date(req.body.closingDate) : new Date(existing.closingDate);
    const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(existing.endDate);

    if (closingDate <= endDate) {
      return res.status(400).json({ message: "La date de clôture doit être après la date de fin de l'audition." });
    }

    const updated = await AuditionParams.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: "Paramètres introuvables." });
    return res.status(200).json({ message: "Paramètres mis à jour.", params: updated });
  } catch (err) {
    console.error("Error updating audition params:", err);
    return res.status(400).json({ message: err.message });
  }
};

// Delete
export const deleteAuditionParams = async (req, res) => {
  try {
    const { id } = req.params;

    // Also delete associated slots
    await AuditionSlot.deleteMany({ paramId: id });

    const deleted = await AuditionParams.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Paramètres introuvables." });
    return res.status(200).json({ message: "Paramètres supprimés." });
  } catch (err) {
    console.error("Error deleting audition params:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const checkPlanningExists = async (req, res) => {
  try {
    const { id } = req.params;

    // Check by paramId
    const slots = await AuditionSlot.find({ paramId: id });

    return res.status(200).json({
      exists: slots.length > 0,
      count: slots.length
    });
  } catch (err) {
    console.error("Error checking planning exists:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Get planning details with candidates
export const getPlanningDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const params = await AuditionParams.findById(id);
    if (!params) {
      return res.status(404).json({ message: "Paramètres introuvables." });
    }

    const slots = await AuditionSlot.find({
      date: {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate)
      }
    })
      .populate('candidate', 'firstName lastName email')
      .sort({ date: 1, startTime: 1 });

    // Calculate statistics
    const totalCandidates = slots.length;
    const uniqueDates = [...new Set(slots.map(slot => slot.date.toDateString()))];
    const totalDays = uniqueDates.length;
    const totalSlots = slots.length;
    const averagePerDay = Math.round(totalCandidates / totalDays);

    return res.status(200).json({
      params,
      slots,
      totalCandidates,
      totalDays,
      totalSlots,
      averagePerDay,
      uniqueDates
    });
  } catch (err) {
    console.error("Error fetching planning details:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
