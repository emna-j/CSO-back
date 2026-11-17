// routes/surveyRoutes.js
import express from 'express';
import {
  getTemplates,
  createSurvey,
  getSurveys,
  getSurveyById,
  updateStatut,
  updateSurvey,
  deleteSurvey,
  soumettreReponses,
  getResultats,
  getMaReponse,
} from '../controllers/surveyController.js';
import { loggedMiddleware }                         from '../middlewares/authMiddlewares.js';
import { isAdmin, allowAll, isChoristerOrAdminOrManager, isManagerOrAdmin } from '../middlewares/roleMiddlewares.js';

const router = express.Router();

// Toutes les routes nécessitent un token valide
router.use(loggedMiddleware);

// ─── Templates (lecture publique pour tous les rôles connectés) ───────────────
// GET /api/surveys/templates
router.get('/templates', allowAll, getTemplates);

// ─── CRUD sondages ────────────────────────────────────────────────────────────
// POST   /api/surveys          → créer un sondage (admin/manager)
router.post('/', isManagerOrAdmin, createSurvey);

// GET    /api/surveys          → liste (admin: tous | choriste: actifs + concernés)
router.get('/', allowAll, getSurveys);

// GET    /api/surveys/:id      → détail avec questions
router.get('/:id', allowAll, getSurveyById);

// PATCH  /api/surveys/:id      → modifier un sondage en brouillon (admin/manager)
router.patch('/:id', isManagerOrAdmin, updateSurvey);

// PATCH  /api/surveys/:id/statut → publier ou clôturer (admin/manager)
router.patch('/:id/statut', isManagerOrAdmin, updateStatut);

// DELETE /api/surveys/:id      → supprimer un sondage + ses réponses (admin/manager)
router.delete('/:id', isManagerOrAdmin, deleteSurvey);

// ─── Réponses choristes ──────────────────────────────────────────────────────
// POST   /api/surveys/:id/repondre    → soumettre les réponses (une seule fois)
router.post('/:id/repondre', allowAll, soumettreReponses);

// GET    /api/surveys/:id/ma-reponse  → consulter sa propre réponse
router.get('/:id/ma-reponse', allowAll, getMaReponse);

// ─── Résultats (admin/staff) ──────────────────────────────────────────────────
// GET    /api/surveys/:id/resultats   → résultats agrégés (admin/manager uniquement)
router.get('/:id/resultats', isManagerOrAdmin, getResultats);

export default router;
