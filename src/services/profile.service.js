const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const cloudinary = require("../config/cloudinary");

const getUserCollection = () => {
  return getDB().collection("user");
};

const buildUserFilter = (userId) => {
  const filters = [{ _id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const getProfile = async (userId) => {
  const users = getUserCollection();

  const user = await users.findOne(buildUserFilter(userId), {
    projection: {
      _id: 1,
      name: 1,
      username: 1,
      email: 1,
      image: 1,
      imagePublicId: 1,
      phoneNumber: 1,
      bio: 1,
      isOnline: 1,
      lastSeen: 1,
      createdAt: 1,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

/* ---------------------------------
   UPDATE BASIC PROFILE
---------------------------------- */

const updateProfile = async (userId, data) => {
  const users = getUserCollection();
  const updateData = {};

  if (typeof data.name === "string") {
    const name = data.name.trim();

    if (!name) {
      throw new Error("Full name cannot be empty.");
    }

    if (name.length > 100) {
      throw new Error("Full name cannot exceed 100 characters.");
    }

    updateData.name = name;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No profile data provided.");
  }

  const result = await users.updateOne(buildUserFilter(userId), {
    $set: updateData,
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
};

/* ---------------------------------
   CHECK USERNAME
---------------------------------- */

const checkUsername = async (username, currentUserId) => {
  const users = getUserCollection();

  const normalizedUsername = String(username || "")
    .trim()
    .toLowerCase();

  if (!normalizedUsername) {
    return {
      available: false,
      message: "Username is required.",
    };
  }

  if (!/^[a-z0-9][a-z0-9_]{2,29}$/.test(normalizedUsername)) {
    return {
      available: false,
      message:
        "Username must be 3-30 characters and contain only letters, numbers, and underscores.",
    };
  }

  const currentUserFilter = buildUserFilter(currentUserId);

  const existingUser = await users.findOne({
    username: normalizedUsername,
  });

  if (!existingUser) {
    return {
      available: true,
      message: "Username is available.",
    };
  }

  const existingUserId = String(existingUser._id);

  const currentUserObjectId =
    currentUserFilter._id instanceof ObjectId
      ? String(currentUserFilter._id)
      : currentUserFilter._id
        ? String(currentUserFilter._id)
        : null;

  if (existingUserId === String(currentUserId)) {
    return {
      available: true,
      message: "This is your current username.",
    };
  }

  if (currentUserObjectId && existingUserId === currentUserObjectId) {
    return {
      available: true,
      message: "This is your current username.",
    };
  }

  return {
    available: false,
    message: "This username is already taken.",
  };
};

/* ---------------------------------
   UPDATE USERNAME
---------------------------------- */

const updateUsername = async (userId, username) => {
  const users = getUserCollection();

  const normalizedUsername = String(username || "")
    .trim()
    .toLowerCase();

  const result = await checkUsername(normalizedUsername, userId);

  if (!result.available) {
    throw new Error(result.message);
  }

  const updateResult = await users.updateOne(buildUserFilter(userId), {
    $set: {
      username: normalizedUsername,
      updatedAt: new Date(),
    },
  });

  if (updateResult.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
};

/* ---------------------------------
   UPDATE PHONE
---------------------------------- */

const updatePhone = async (userId, phoneNumber) => {
  const users = getUserCollection();

  const phone = String(phoneNumber || "").trim();

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    throw new Error("Please provide a valid phone number.");
  }

  const result = await users.updateOne(buildUserFilter(userId), {
    $set: {
      phoneNumber: phone,
      updatedAt: new Date(),
    },
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
};

/* ---------------------------------
   UPDATE BIO
---------------------------------- */

const updateBio = async (userId, bio) => {
  const users = getUserCollection();

  const cleanBio = String(bio || "").trim();

  if (cleanBio.length > 500) {
    throw new Error("Bio cannot exceed 500 characters.");
  }

  const result = await users.updateOne(buildUserFilter(userId), {
    $set: {
      bio: cleanBio,
      updatedAt: new Date(),
    },
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
};

/* ---------------------------------
   UPDATE ONLINE/OFFLINE STATUS
---------------------------------- */

const updateStatus = async (userId, isOnline) => {
  const users = getUserCollection();

  if (typeof isOnline !== "boolean") {
    throw new Error("Status must be a boolean.");
  }

  const updateData = {
    isOnline,
    updatedAt: new Date(),
  };

  if (!isOnline) {
    updateData.lastSeen = new Date();
  }

  const result = await users.updateOne(buildUserFilter(userId), {
    $set: updateData,
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
};

/* ---------------------------------
   CLOUDINARY UPLOAD
---------------------------------- */

const uploadProfileImage = async (userId, file) => {
  if (!file) {
    throw new Error("Profile image is required.");
  }

  const users = getUserCollection();

  const currentUser = await users.findOne(buildUserFilter(userId), {
    projection: {
      image: 1,
      imagePublicId: 1,
    },
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  const uploadToCloudinary = () => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "livechat/profiles",
          resource_type: "image",
          transformation: [
            {
              width: 500,
              height: 500,
              crop: "fill",
              gravity: "face",
            },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  };

  const uploadedImage = await uploadToCloudinary();

  try {
    const updateResult = await users.updateOne(buildUserFilter(userId), {
      $set: {
        image: uploadedImage.secure_url,
        imagePublicId: uploadedImage.public_id,
        updatedAt: new Date(),
      },
    });

    if (updateResult.matchedCount === 0) {
      await cloudinary.uploader.destroy(uploadedImage.public_id, {
        resource_type: "image",
      });

      throw new Error("User not found.");
    }

    if (currentUser.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.imagePublicId, {
          resource_type: "image",
        });
      } catch (deleteError) {
        console.error(
          "Old Cloudinary image deletion failed:",
          deleteError.message,
        );
      }
    }

    return getProfile(userId);
  } catch (error) {
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id, {
          resource_type: "image",
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    throw error;
  }
};

/* ---------------------------------
   DELETE PROFILE IMAGE
---------------------------------- */

const deleteProfileImage = async (userId) => {
  const users = getUserCollection();

  const user = await users.findOne(buildUserFilter(userId), {
    projection: {
      imagePublicId: 1,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.imagePublicId) {
    throw new Error("No profile image found.");
  }

  await cloudinary.uploader.destroy(user.imagePublicId, {
    resource_type: "image",
  });

  const result = await users.updateOne(buildUserFilter(userId), {
    $unset: {
      image: "",
      imagePublicId: "",
    },
    $set: {
      updatedAt: new Date(),
    },
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  return getProfile(userId);
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
