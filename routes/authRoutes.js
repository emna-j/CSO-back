import express from "express";
import {
  signupAdmin,
  login,
  getMe,
  updateMe,
  applyForMembership,
  sendEmailConfirmation,
  confirmEmail,
  checkEmailConfirmed,
  forgotPassword,
  resetPassword,
  verifyGoogleToken,
} from "../controllers/authController.js";
import { loggedMiddleware } from "../middlewares/authMiddlewares.js";
import { uploadAvatar } from "../middlewares/uploadAvatar.js";
import { allowAll } from "../middlewares/roleMiddlewares.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup-admin", signupAdmin);
router.get("/me", loggedMiddleware, allowAll, getMe);
router.patch(
  "/me",
  loggedMiddleware,
  allowAll,
  uploadAvatar.single("avatar"),
  updateMe
);
router.post("/apply", applyForMembership);
router.post("/send-email-confirmation", sendEmailConfirmation);
router.get("/confirm-email", confirmEmail);
router.get("/check-email-confirmed", checkEmailConfirmed);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google-verify", verifyGoogleToken);

export default router;
