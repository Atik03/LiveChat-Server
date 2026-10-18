const contactRequestService = require("../services/contact-request.service");

const getCurrentUserId = (req) => String(req.user?.id ?? req.user?._id ?? "");

const sendContactRequest = async (req, res) => {
  try {
    const receiverId = String(req.body?.receiverId ?? "").trim();

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "receiverId is required.",
      });
    }

    const result = await contactRequestService.sendContactRequest(
      getCurrentUserId(req),
      receiverId,
    );

    return res.status(200).json({
      success: true,
      message: result.alreadySent
        ? "Contact request has already been sent."
        : "Contact request sent successfully.",
      data: result.request,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to send contact request.",
    });
  }
};

const getContactRequests = async (req, res) => {
  try {
    const type = req.query.type || "all";

    if (!["all", "received", "sent"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be all, received, or sent.",
      });
    }

    const requests = await contactRequestService.getContactRequests(
      getCurrentUserId(req),
      type,
    );

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact requests.",
    });
  }
};

const acceptContactRequest = async (req, res) => {
  try {
    const result = await contactRequestService.respondToContactRequest(
      req.params.id,
      getCurrentUserId(req),
      "accept",
    );

    return res.status(200).json({
      success: true,
      message: "Contact request accepted.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to accept contact request.",
    });
  }
};

const declineContactRequest = async (req, res) => {
  try {
    const result = await contactRequestService.respondToContactRequest(
      req.params.id,
      getCurrentUserId(req),
      "decline",
    );

    return res.status(200).json({
      success: true,
      message: "Contact request declined.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to decline contact request.",
    });
  }
};

module.exports = {
  sendContactRequest,
  getContactRequests,
  acceptContactRequest,
  declineContactRequest,
};
