const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  getProfile,
  updateProfile,
  checkUsername,
  updateUsername,
  updatePhone,
  updateBio,
  updateStatus,
  uploadProfileImage,
  deleteProfileImage,
} = require("../controllers/profile.controller");

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

// Get logged-in user's profile
router.get("/", getProfile);

// Update full name
router.patch("/", updateProfile);

// Username
router.get("/username", checkUsername);
router.patch("/username", updateUsername);

// Phone
router.patch("/phone", updatePhone);

// Bio
router.patch("/bio", updateBio);

// Online / Offline status
router.patch("/status", updateStatus);

// Profile image
router.post("/image", upload.single("image"), uploadProfileImage);

router.delete("/image", deleteProfileImage);

module.exports = router;
