const authMiddleware = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;

    if (!cookie) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const authUrl = process.env.AUTH_URL;

    const response = await fetch(`${authUrl}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie,
      },
    });

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    const session = await response.json();

    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    req.user = session.user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication verification failed.",
    });
  }
};

module.exports = authMiddleware;
