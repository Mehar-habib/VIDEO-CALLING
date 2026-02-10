import User from "../models/userSchema.js";

const isLogin = async (req, res, next) => {
  try {
    const token =
      req.cookies.jwt ||
      req.headers.cookie
        .split(";")
        .find((cookie) => cookie.startsWith("jwt="))
        .split("=")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid Token" });
    }
    const user = User.findById(decode.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - User Not Found" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default isLogin;
