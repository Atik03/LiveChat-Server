const userService = require("../services/user.service");

const searchUsers = async (req, res) => {
  try {
    const { query = "" } = req.query;

    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const users = await userService.searchUsers({
      query,
      currentUserId: String(req.user.id || req.user._id),
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("User search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users.",
    });
  }
};

module.exports = {
  searchUsers,
};
