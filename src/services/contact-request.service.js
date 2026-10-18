const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const getUserId = (value) => String(value ?? "");

async function findUserById(userId) {
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    return db.collection("user").findOne({ _id: userId });
  }

  const user = await db.collection("user").findOne({
    _id: new ObjectId(userId),
  });

  return user || db.collection("user").findOne({ _id: userId });
}

async function sendContactRequest(senderId, receiverId) {
  const db = getDB();
  const sender = getUserId(senderId);
  const receiver = getUserId(receiverId);

  if (!receiver || sender === receiver) {
    throw Object.assign(
      new Error("You cannot send a contact request to yourself."),
      { statusCode: 400 },
    );
  }

  const receiverUser = await findUserById(receiver);

  if (!receiverUser) {
    throw Object.assign(new Error("User not found."), {
      statusCode: 404,
    });
  }

  const contacts = db.collection("contacts");
  const requests = db.collection("contactRequests");

  const existingContact = await contacts.findOne({
    userId: sender,
    contactId: receiver,
    status: "accepted",
  });

  if (existingContact) {
    throw Object.assign(new Error("This user is already your contact."), {
      statusCode: 409,
    });
  }

  const incomingRequest = await requests.findOne({
    senderId: receiver,
    receiverId: sender,
    status: "pending",
  });

  if (incomingRequest) {
    throw Object.assign(
      new Error("This user has already sent you a request. Accept it instead."),
      { statusCode: 409 },
    );
  }

  const existingRequest = await requests.findOne({
    senderId: sender,
    receiverId: receiver,
    status: "pending",
  });

  if (existingRequest) {
    return {
      request: existingRequest,
      alreadySent: true,
    };
  }

  const now = new Date();

  const previousRequest = await requests.findOne({
    senderId: sender,
    receiverId: receiver,
  });

  if (previousRequest) {
    await requests.updateOne(
      { _id: previousRequest._id },
      {
        $set: {
          status: "pending",
          updatedAt: now,
        },
      },
    );

    return {
      request: {
        ...previousRequest,
        status: "pending",
        updatedAt: now,
      },
      alreadySent: false,
    };
  }

  const request = {
    senderId: sender,
    receiverId: receiver,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const result = await requests.insertOne(request);

  return {
    request: { ...request, _id: result.insertedId },
    alreadySent: false,
  };
}

async function getContactRequests(userId, type = "all") {
  const db = getDB();
  const user = getUserId(userId);

  const filter =
    type === "received"
      ? { receiverId: user, status: "pending" }
      : type === "sent"
        ? { senderId: user, status: "pending" }
        : {
            status: "pending",
            $or: [{ senderId: user }, { receiverId: user }],
          };

  const requests = await db
    .collection("contactRequests")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  const userIds = [
    ...new Set(
      requests.map((request) =>
        request.senderId === user ? request.receiverId : request.senderId,
      ),
    ),
  ];

  const users = await Promise.all(
    userIds.map(async (id) => {
      const userDoc = await findUserById(id);

      return [
        id,
        userDoc
          ? {
              _id: String(userDoc._id),
              name: userDoc.name || "",
              username: userDoc.username || "",
              image: userDoc.image || "",
            }
          : null,
      ];
    }),
  );

  const userMap = new Map(users);

  return requests.map((request) => {
    const otherUserId =
      request.senderId === user ? request.receiverId : request.senderId;

    return {
      ...request,
      otherUser: userMap.get(otherUserId) || null,
    };
  });
}

async function respondToContactRequest(requestId, currentUserId, action) {
  const db = getDB();
  const user = getUserId(currentUserId);

  if (!ObjectId.isValid(requestId)) {
    throw Object.assign(new Error("Invalid request ID."), {
      statusCode: 400,
    });
  }

  const requests = db.collection("contactRequests");
  const contacts = db.collection("contacts");
  const _id = new ObjectId(requestId);

  const request = await requests.findOne({
    _id,
    receiverId: user,
    status: "pending",
  });

  if (!request) {
    throw Object.assign(new Error("Pending contact request not found."), {
      statusCode: 404,
    });
  }

  const now = new Date();

  if (action === "decline") {
    await requests.updateOne(
      { _id, receiverId: user, status: "pending" },
      {
        $set: {
          status: "declined",
          updatedAt: now,
        },
      },
    );

    return { status: "declined" };
  }

  const sender = request.senderId;
  const receiver = request.receiverId;

  await contacts.updateOne(
    { userId: sender, contactId: receiver },
    {
      $set: {
        status: "accepted",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  await contacts.updateOne(
    { userId: receiver, contactId: sender },
    {
      $set: {
        status: "accepted",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const updateResult = await requests.updateOne(
    { _id, receiverId: user, status: "pending" },
    {
      $set: {
        status: "accepted",
        updatedAt: now,
      },
    },
  );

  if (!updateResult.modifiedCount) {
    throw Object.assign(new Error("This request has already been processed."), {
      statusCode: 409,
    });
  }

  return { status: "accepted" };
}

module.exports = {
  sendContactRequest,
  getContactRequests,
  respondToContactRequest,
};
