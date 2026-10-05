const profileService = require("../services/profile.service");

/* ---------------------------------
   GET PROFILE
---------------------------------- */

const getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.id);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get profile.",
    });
  }
};

/* ---------------------------------
   UPDATE BASIC PROFILE
---------------------------------- */

const updateProfile = async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

/* ---------------------------------
   CHECK USERNAME
---------------------------------- */

const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    const result = await profileService.checkUsername(username, req.user.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Check username error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check username.",
    });
  }
};

/* ---------------------------------
   UPDATE USERNAME
---------------------------------- */

const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const profile = await profileService.updateUsername(req.user.id, username);

    return res.status(200).json({
      success: true,
      message: "Username updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update username error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update username.",
    });
  }
};

/* ---------------------------------
   UPDATE PHONE
---------------------------------- */

const updatePhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const profile = await profileService.updatePhone(req.user.id, phoneNumber);

    return res.status(200).json({
      success: true,
      message: "Phone number updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update phone error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update phone number.",
    });
  }
};

/* ---------------------------------
   UPDATE BIO
---------------------------------- */

const updateBio = async (req, res) => {
  try {
    const { bio } = req.body;

    const profile = await profileService.updateBio(req.user.id, bio);

    return res.status(200).json({
      success: true,
      message: "Bio updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update bio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update bio.",
    });
  }
};

/* ---------------------------------
   UPDATE STATUS
---------------------------------- */

const updateStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    const profile = await profileService.updateStatus(req.user.id, isOnline);

    return res.status(200).json({
      success: true,
      message: isOnline ? "You are now online." : "You are now offline.",
      data: profile,
    });
  } catch (error) {
    console.error("Update status error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update status.",
    });
  }
};

/* ---------------------------------
   UPLOAD PROFILE IMAGE
---------------------------------- */

const uploadProfileImage = async (req, res) => {
  try {
    const profile = await profileService.uploadProfileImage(
      req.user.id,
      req.file,
    );

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload profile image.",
    });
  }
};

/* ---------------------------------
   DELETE PROFILE IMAGE
---------------------------------- */

const deleteProfileImage = async (req, res) => {
  try {
    const profile = await profileService.deleteProfileImage(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile image removed successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Delete profile image error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to remove profile image.",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  checkUsername,
  updateUsername,
  updatePhone,
  updateBio,
  updateStatus,
  uploadProfileImage,
  deleteProfileImage,
};
