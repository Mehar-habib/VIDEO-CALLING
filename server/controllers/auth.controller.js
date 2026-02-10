import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import jwtToken from "../utils/jwtToken.js";

export const SignUp = async (req, res) => {
  try {
    const { fullname, username, email, password, gender, profilepic } =
      req.body;
    const user = await User.findOne({ username });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const emailPresent = await User.findOne({ email });
    if (emailPresent) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hashSync(password, 10);
    const boyppf =
      profilepic ||
      `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlppf =
      profilepic ||
      `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
      gender,
      profilepic: gender === "male" ? boyppf : girlppf,
    });
    if (newUser) {
      await newUser.save();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "User not created" });
    }
    res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwtToken(user._id, res);
    res.status(200).send({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      profilepic: user.profilepic,
      token,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const Logout = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      path: "/",
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
