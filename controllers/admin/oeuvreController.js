import Oeuvre from "../../models/oeuvreModel.js";
import User from "../../models/userModel.js";

// 📥 Create a new oeuvre
export const createOeuvre = async (req, res) => {
  try {
    const body = req.body;
    const lyricsFile = req.files?.lyrics?.[0]?.filename || "";
    const partitionFile = req.files?.partition?.[0]?.filename || "";

    const oeuvre = new Oeuvre({
      ...body,
      lyrics: lyricsFile,
      partition: partitionFile,
    });

    await oeuvre.save();
    res.status(201).json({ message: "Œuvre créée avec succès." });
  } catch (error) {
    // ✅ HANDLE CUSTOM ERROR CODES
    if (error.code === 'INVALID_PDF_FORMAT') {
      return res.status(400).json({ 
        message: "Seuls les fichiers PDF sont acceptés", 
        type: "FILE_FORMAT_ERROR" 
      });
    }
    console.error("Erreur lors de la création:", error);
    res.status(500).json({ message: "Échec de la création de l'œuvre." });
  }
};

// ✏️ Update an oeuvre

export const updateOeuvre = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (req.files?.lyrics?.[0]) {
      body.lyrics = req.files.lyrics[0].filename;
    }

    if (req.files?.partition?.[0]) {
      body.partition = req.files.partition[0].filename;
    }

    const updated = await Oeuvre.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    });

    res.json({ message: "Œuvre mise à jour avec succès.", updated });
  } catch (error) {
    // ✅ HANDLE CUSTOM ERROR CODES
    if (error.code === 'INVALID_PDF_FORMAT') {
      return res.status(400).json({ 
        message: "Seuls les fichiers PDF sont acceptés", 
        type: "FILE_FORMAT_ERROR" 
      });
    }
    console.error("Erreur lors de la mise à jour:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
};


// 📤 Get all active oeuvres
export const getOeuvres = async (req, res) => {
  try {
    const oeuvres = await Oeuvre.find();
    res.json(oeuvres);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
};




// 🗑️ Permanently delete an oeuvre
export const deleteOeuvrePermanent = async (req, res) => {
  try {
    await Oeuvre.findByIdAndDelete(req.params.id);
    res.json({ message: "Œuvre supprimée définitivement." });
  } catch (error) {
    console.error("Erreur suppression définitive:", error);
    res.status(500).json({ message: "Échec de la suppression." });
  }
};
export const getOeuvreById = async (req, res) => {
  try {
    const { id } = req.params;
    const oeuvre = await Oeuvre.findById(id);
    if (!oeuvre) {
      return res.status(404).json({ message: "Œuvre non trouvée" });
    }
    res.status(200).json(oeuvre);
  } catch (error) {
    console.error("Erreur récupération œuvre:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🎵 Upload media for a specific pupitre or tutti
export const uploadOeuvreMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { pupitre, videoLink, choirVideoLink } = req.body;
    
    if (!pupitre) {
      return res.status(400).json({ message: "Le pupitre est requis (soprano, alto, ténor, basse, tutti)." });
    }

    const user = await User.findById(req.auth.userId);

    // Contrôle d'accès Chef de Pupitre
    if (req.auth.role === "choriste") {
      if (!user.isChefDePupitre) {
        return res.status(403).json({ message: "Accès refusé. Réservé aux managers, chefs de chœur ou chefs de pupitre." });
      }
      if (user.pupitre !== pupitre) {
        return res.status(403).json({ message: `Accès refusé. Vous ne pouvez modifier que les médias du pupitre ${user.pupitre}.` });
      }
    }

    const oeuvre = await Oeuvre.findById(id);
    if (!oeuvre) {
      return res.status(404).json({ message: "Œuvre non trouvée." });
    }

    let mediaItem = oeuvre.pupitreMedia.find(m => m.pupitre === pupitre);
    if (!mediaItem) {
      // Create new media entry for this pupitre
      mediaItem = { pupitre, partition: "", paroles: "", audio: "", video: "", choirRecording: "", choirVideo: "" };
      oeuvre.pupitreMedia.push(mediaItem);
      // Retrieve the reference to the newly pushed item
      mediaItem = oeuvre.pupitreMedia[oeuvre.pupitreMedia.length - 1];
    }

    if (req.files?.partition?.[0]) {
      mediaItem.partition = req.files.partition[0].filename;
    }
    if (req.files?.paroles?.[0]) {
      mediaItem.paroles = req.files.paroles[0].filename;
    }
    if (req.files?.audio?.[0]) {
      mediaItem.audio = req.files.audio[0].filename;
    }
    if (req.files?.choirRecording?.[0]) {
      mediaItem.choirRecording = req.files.choirRecording[0].filename;
    }
    if (req.files?.choirVideo?.[0]) {
      mediaItem.choirVideo = req.files.choirVideo[0].filename;
    }
    
    // Fallback: If no video file was uploaded but a link is provided
    if (videoLink) {
      mediaItem.video = videoLink;
    }
    if (choirVideoLink) {
      mediaItem.choirVideo = choirVideoLink;
    }

    await oeuvre.save();
    res.json({ message: "Médias mis à jour avec succès.", pupitreMedia: oeuvre.pupitreMedia });
  } catch (error) {
    if (error.code === 'INVALID_MEDIA_FORMAT') {
      return res.status(400).json({ 
        message: "Format de média non supporté.", 
        type: "FILE_FORMAT_ERROR" 
      });
    }
    console.error("Erreur modification média:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🗑️ Delete specific media for a pupitre
export const deleteOeuvreMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { pupitre, mediaType } = req.body; // mediaType: 'partition', 'paroles', 'audio', 'video'

    if (!pupitre || !mediaType) {
      return res.status(400).json({ message: "pupitre et mediaType sont requis." });
    }

    const user = await User.findById(req.auth.userId);

    // Contrôle d'accès Chef de Pupitre
    if (req.auth.role === "choriste") {
      if (!user.isChefDePupitre) {
        return res.status(403).json({ message: "Accès refusé." });
      }
      if (user.pupitre !== pupitre) {
        return res.status(403).json({ message: "Vous ne pouvez gérer que votre pupitre." });
      }
    }

    const oeuvre = await Oeuvre.findById(id);
    if (!oeuvre) {
      return res.status(404).json({ message: "Œuvre non trouvée." });
    }

    let mediaItem = oeuvre.pupitreMedia.find(m => m.pupitre === pupitre);
    if (mediaItem) {
      if (['partition', 'paroles', 'audio', 'video', 'choirRecording', 'choirVideo'].includes(mediaType)) {
        mediaItem[mediaType] = "";
        await oeuvre.save();
      } else {
        return res.status(400).json({ message: "mediaType invalide." });
      }
    }

    res.json({ message: `${mediaType} supprimé avec succès.`, pupitreMedia: oeuvre.pupitreMedia });
  } catch (error) {
    console.error("Erreur suppression média:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
