const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");

const { searchUsers } = require("../controllers/user.controller");

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// Search users
router.get("/search", searchUsers);

module.exports = router;
