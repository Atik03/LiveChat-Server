const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");

const {
  sendContactRequest,
  getContactRequests,
  acceptContactRequest,
  declineContactRequest,
} = require("../controllers/contact-request.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", sendContactRequest);
router.get("/", getContactRequests);
router.patch("/:id/accept", acceptContactRequest);
router.patch("/:id/decline", declineContactRequest);

module.exports = router;
