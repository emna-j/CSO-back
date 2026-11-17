import Subgroup from '../../models/subgroupModel.js';
import User from '../../models/userModel.js';
import { sendNotification } from '../../tools/mail/mailNotif.js';
import { createSubgroupAnnouncementTemplate } from '../../tools/mail/notifTemplate.js';

// ✅ Create a new subgroup
export const createSubgroup = async (req, res) => {
  try {
    const { name, description, type, startDate, endDate } = req.body;
    const createdBy = req.auth.userId;

    const newSubgroup = await Subgroup.create({
      name,
      description,
      type,
      startDate,
      endDate,
      createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Sous-groupe créé avec succès',
      data: newSubgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du sous-groupe',
      error: error.message
    });
  }
};

// ✅ Get all subgroups (triggers auto-archiving via middleware)
export const getSubgroups = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Explicitly auto-archive before fetching
    await Subgroup.updateMany(
      { endDate: { $lt: new Date() }, status: 'Actif' },
      { status: 'Archivé' }
    );

    const subgroups = await Subgroup.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: subgroups.length,
      data: subgroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sous-groupes',
      error: error.message
    });
  }
};

// ✅ Get a specific subgroup with members
export const getSubgroupById = async (req, res) => {
  try {
    const subgroup = await Subgroup.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('members', 'firstName lastName email pupitre avatar');

    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du sous-groupe',
      error: error.message
    });
  }
};

// ✅ Update subgroup details
export const updateSubgroup = async (req, res) => {
  try {
    const { name, description, type, startDate, endDate, status } = req.body;
    
    const oldSubgroup = await Subgroup.findById(req.params.id);
    if (!oldSubgroup) return res.status(404).json({ message: 'Sous-groupe introuvable' });

    if (oldSubgroup.status === 'Archivé') {
      return res.status(400).json({ message: 'Impossible de modifier un groupe archivé' });
    }
    
    const subgroup = await Subgroup.findByIdAndUpdate(
      req.params.id,
      { name, description, type, startDate, endDate, status },
      { new: true, runValidators: true }
    );

    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sous-groupe mis à jour avec succès',
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du sous-groupe',
      error: error.message
    });
  }
};

// ✅ Delete a subgroup
export const deleteSubgroup = async (req, res) => {
  try {
    const subgroup = await Subgroup.findByIdAndDelete(req.params.id);

    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sous-groupe supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du sous-groupe',
      error: error.message
    });
  }
};

// ✅ Add members to subgroup
export const addMembers = async (req, res) => {
  try {
    const { userIds } = req.body; // Array of user IDs
    
    const subgroup = await Subgroup.findById(req.params.id);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    if (subgroup.status === 'Archivé') {
      return res.status(400).json({ message: 'Impossible d\'ajouter des membres à un groupe archivé' });
    }

    // Filter out users already in the group
    const newMembers = userIds.filter(id => !subgroup.members.includes(id));
    
    subgroup.members.push(...newMembers);
    await subgroup.save();

    res.status(200).json({
      success: true,
      message: `${newMembers.length} membre(s) ajouté(s) avec succès`,
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des membres',
      error: error.message
    });
  }
};

// ✅ Remove a member from subgroup
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const subgroup = await Subgroup.findById(req.params.id);
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    if (subgroup.status === 'Archivé') {
      return res.status(400).json({ message: 'Impossible de supprimer des membres d\'un groupe archivé' });
    }

    subgroup.members = subgroup.members.filter(id => id.toString() !== userId);
    await subgroup.save();

    res.status(200).json({
      success: true,
      message: 'Membre retiré avec succès',
      data: subgroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du membre',
      error: error.message
    });
  }
};

// ✅ Send announcement to subgroup members
export const sendSubgroupAnnouncement = async (req, res) => {
  try {
    const { messageContent } = req.body;
    const managerId = req.auth.userId;

    const subgroup = await Subgroup.findById(req.params.id).populate('members');
    if (!subgroup) {
      return res.status(404).json({
        success: false,
        message: 'Sous-groupe non trouvé'
      });
    }

    if (subgroup.status === 'Archivé') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'envoyer des annonces à un groupe archivé'
      });
    }

    if (subgroup.members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce groupe ne contient aucun membre.'
      });
    }

    const manager = await User.findById(managerId);

    // Send emails in background
    res.status(200).json({
      success: true,
      message: `L'annonce est en cours d'envoi à ${subgroup.members.length} membre(s).`
    });

    setImmediate(async () => {
      for (const member of subgroup.members) {
        if (member.email) {
          try {
            const template = createSubgroupAnnouncementTemplate({
              choristeFirstName: member.firstName,
              choristeLastName: member.lastName,
              subgroupName: subgroup.name,
              subgroupType: subgroup.type,
              managerName: `${manager.firstName} ${manager.lastName}`,
              messageContent
            });

            await sendNotification({
              email: member.email,
              subject: template.subject,
              htmlContent: template.htmlContent,
              attachments: template.attachments
            });
          } catch (err) {
            console.error(`Failed to send email to ${member.email}:`, err.message);
          }
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'annonce',
      error: error.message
    });
  }
};
