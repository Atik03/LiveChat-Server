const { getDB } = require("../config/db");

const searchUsers = async ({ query, currentUserId }) => {
  const db = getDB();

  const search = query.trim();

  if (!search) {
    return [];
  }

  const users = await db
    .collection("user")
    .find(
      {
        _id: { $ne: currentUserId },
        $or: [
          {
            username: {
              $regex: search,
              $options: "i",
            },
          },
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      },
      {
        projection: {
          name: 1,
          username: 1,
          image: 1,
          isOnline: 1,
          lastSeen: 1,
        },
      },
    )
    .limit(20)
    .toArray();

  const contactIds = users.map((user) => String(user._id));

  const contacts = await db
    .collection("contacts")
    .find({
      userId: currentUserId,
      contactId: { $in: contactIds },
      status: "accepted",
    })
    .toArray();

  const contactSet = new Set(
    contacts.map((contact) => String(contact.contactId)),
  );

  return users.map((user) => {
    const userId = String(user._id);
    const isContact = contactSet.has(userId);

    return {
      _id: user._id,
      name: user.name || "",
      username: user.username || "",
      image: user.image || "",
      isContact,

      // Only contacts can see online/offline status.
      ...(isContact
        ? {
            isOnline: user.isOnline === true,
            lastSeen: user.lastSeen || null,
          }
        : {}),
    };
  });
};

module.exports = {
  searchUsers,
};
