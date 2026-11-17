import express from "express";
import {
  createOeuvre,
  getOeuvres,
  updateOeuvre,
  deleteOeuvrePermanent,
  getOeuvreById,
  uploadOeuvreMedia,
  deleteOeuvreMedia
} from "../../controllers/admin/oeuvreController.js";
import { loggedMiddleware } from "../../middlewares/authMiddlewares.js";
import { allowAll, isAdmin } from "../../middlewares/roleMiddlewares.js";
import { uploadPdf } from "../../middlewares/uploadPdf.js";
import { uploadMedia } from "../../middlewares/uploadMediaMiddleware.js";

const router = express.Router();

router.use(loggedMiddleware);

router.post(
  "/",
  uploadPdf.fields([
    { name: "lyrics", maxCount: 1 },
    { name: "partition", maxCount: 1 },
  ]),
  isAdmin,
  createOeuvre
);

// Read
router.get("/", allowAll, getOeuvres);

// Update → same parsing
router.patch(
  "/:id",
  uploadPdf.fields([
    { name: "lyrics", maxCount: 1 },
    { name: "partition", maxCount: 1 },
  ]),
  isAdmin,
  updateOeuvre
);
router.get("/:id",allowAll, getOeuvreById); 

// Permanent delete
router.delete("/:id/permanent",isAdmin, deleteOeuvrePermanent);

// Routes pour les médias spécifiques aux pupitres/tutti
router.post(
  "/:id/media",
  allowAll,
  uploadMedia.fields([
    { name: "partition", maxCount: 1 },
    { name: "paroles", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "choirRecording", maxCount: 1 },
    { name: "choirVideo", maxCount: 1 }
  ]),
  uploadOeuvreMedia
);

router.delete("/:id/media", allowAll, deleteOeuvreMedia);

export default router;
