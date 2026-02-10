import User from "../models/userSchema.js";

export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?._conditions?._id;
    if (!currentUserId) {
      return res.status(400).json({ success: false, message: "Unauthorized" });
    }
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      "profilepic email username",
    );
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
