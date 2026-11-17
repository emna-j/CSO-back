import Audition from '../../models/auditionModel.js';
import AuditionParams from '../../models/auditionParamsModel.js';
import User from '../../models/userModel.js';
import AuditionSlot from '../../models/auditionSlotModel.js';
import { sendNotification } from "../../tools/mail/mailNotif.js";
import { createTestDateEmailTemplate } from "../../tools/mail/notifTemplate.js";

// --- NEW AUDITION CRUD ---

export const createAudition = async (req, res) => {
  try {
    const { nom, saison } = req.body;
    const existing = await Audition.findOne({ nom });
    if (existing) {
      return res.status(400).json({ message: "Une audition avec ce nom existe déjà." });
    }
    const audition = new Audition({ nom, saison });
    await audition.save();
    return res.status(201).json({ message: "Audition créée avec succès.", audition });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const listAuditions = async (req, res) => {
  try {
    const auditions = await Audition.find().sort({ createdAt: -1 });
    return res.status(200).json(auditions);
  } catch (err) {
    return res.status(500).json({ message: "Impossible de récupérer les auditions." });
  }
};

export const getAuditionById = async (req, res) => {
  try {
    const { id } = req.params;
    const audition = await Audition.findById(id);
    if (!audition) return res.status(404).json({ message: "Audition introuvable." });
    const plannings = await AuditionParams.find({ auditionId: id });
    return res.status(200).json({ audition, plannings });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const updateAudition = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Audition.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Audition introuvable." });
    return res.status(200).json({ message: "Audition mise à jour.", audition: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const deleteAudition = async (req, res) => {
  try {
    const { id } = req.params;
    const planningsCount = await AuditionParams.countDocuments({ auditionId: id });
    if (planningsCount > 0) {
      return res.status(400).json({ message: "Impossible de supprimer : sessions actives." });
    }
    await Audition.findByIdAndDelete(id);
    return res.status(200).json({ message: "Audition supprimée." });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- RE-IMPLEMENTED FUNCTIONS ---

/**
 * Generates audition slots and sends convocations
 */
export const generateAuditions = async (req, res) => {
  try {
    const { paramsId } = req.body;
    const params = await AuditionParams.findById(paramsId);
    if (!params) return res.status(404).json({ message: "Paramètres introuvables." });

    // Fetch pending candidates
    const candidates = await User.find({ role: 'candidate', memberstatus: 'Pending' });
    if (candidates.length === 0) {
      return res.status(400).json({ message: "Aucun candidat en attente pour cette session." });
    }

    const slotsCreated = [];
    let candidateIndex = 0;

    // Generate dates range
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Parse times
    const [startH, startM] = params.sessionStartTime.split(':').map(Number);
    const [endH, endM] = params.sessionEndTime.split(':').map(Number);
    const pauseStartM = params.debutPause ? params.debutPause.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;
    const pauseEndM = params.finPause ? params.finPause.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;

    for (const date of dates) {
      if (candidateIndex >= candidates.length) break;

      for (let h = startH; h < endH; h++) {
        if (candidateIndex >= candidates.length) break;

        const currentMinutes = h * 60 + startM;
        if (pauseStartM !== null && currentMinutes >= pauseStartM && currentMinutes < pauseEndM) {
          continue; // Skip pause
        }

        const startTime = `${h.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
        const endTime = `${(h + 1).toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

        // Assign 'candidateCount' candidates per hour
        for (let i = 0; i < params.candidateCount; i++) {
          if (candidateIndex >= candidates.length) break;

          const candidate = candidates[candidateIndex];
          const slot = new AuditionSlot({
            date,
            startTime,
            endTime,
            candidate: candidate._id,
            paramId: params._id,
            status: 'Scheduled'
          });

          await slot.save();

          // Update candidate
          await User.findByIdAndUpdate(candidate._id, {
            memberstatus: 'TestScheduled',
            convocationStatus: 'Sent',
            convocationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h deadline
          });

          // Send Email
          try {
            const emailTemplate = createTestDateEmailTemplate({
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              candidateId: candidate._id,
              assignedDate: date,
              assignedTime: startTime,
              closingDate: params.closingDate // PASS CLOSING DATE
            });

            await sendNotification({
              email: candidate.email,
              subject: emailTemplate.subject,
              htmlContent: emailTemplate.htmlContent,
              attachments: emailTemplate.attachments
            });
          } catch (emailErr) {
            console.error(`Email failed for ${candidate.email}:`, emailErr);
          }

          slotsCreated.push(slot);
          candidateIndex++;
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `${candidateIndex} convocations envoyées.`,
      count: candidateIndex 
    });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ message: "Erreur lors de la génération." });
  }
};

/**
 * Gets planning details and confirmed candidates
 */
export const getConfirmedCandidatesForAudition = async (req, res) => {
  try {
    const { planningId } = req.params;
    const params = await AuditionParams.findById(planningId);
    if (!params) return res.status(404).json({ message: "Planning introuvable." });

    const slots = await AuditionSlot.find({ paramId: planningId })
      .populate('candidate', 'firstName lastName email pupitre convocationStatus memberstatus')
      .sort({ date: 1, startTime: 1 });

    const totalCandidates = slots.length;
    const uniqueDates = [...new Set(slots.map(s => s.date.toDateString()))];
    const totalDays = uniqueDates.length;
    const totalSlots = slots.length;
    const averagePerDay = totalDays > 0 ? Math.round(totalCandidates / totalDays) : 0;

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
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const assignCandidateToSlot = async (req, res) => {
  try {
    const { candidateId, paramId, date, startTime, endTime } = req.body;
    
    if (!candidateId || !paramId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Données manquantes pour la programmation." });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidat introuvable." });

    // Check if candidate already has a slot
    const existing = await AuditionSlot.findOne({ candidate: candidateId });
    if (existing) {
      return res.status(400).json({ message: "Ce candidat est déjà programmé sur un créneau." });
    }
    
    const slot = new AuditionSlot({
      candidate: candidateId,
      paramId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'Scheduled'
    });
    
    await slot.save();
    
    // Update candidate
    await User.findByIdAndUpdate(candidateId, {
      memberstatus: 'TestScheduled',
      convocationStatus: 'Sent',
      convocationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });
    
    // Send Email
    try {
      const emailTemplate = createTestDateEmailTemplate({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        candidateId: candidate._id,
        assignedDate: date,
        assignedTime: startTime
      });

      await sendNotification({
        email: candidate.email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        attachments: emailTemplate.attachments
      });
    } catch (emailErr) {
      console.error(`Email failed for ${candidate.email}:`, emailErr);
    }
    
    return res.status(201).json({ message: "Candidat programmé avec succès.", slot });
  } catch (err) {
    console.error("Error in assignCandidateToSlot:", err);
    return res.status(500).json({ message: "Erreur lors de la programmation manuelle." });
  }
};
