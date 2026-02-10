import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import ConnectDB from "./DB/dbConnect.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";

// socket.io
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

const allowedOrigins = [process.env.FRONTEND_URL];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by Cors"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);

// initialize socket.io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins[0],
    methods: ["GET", "POST"],
  },
});

let onlineUser = [];

// SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.emit("me", socket.id);

  socket.on("join", (user) => {
    if (!user || !user.id) {
      console.log("user not found");
      return;
    }
    socket.join(user.id);

    const existingUser = onlineUser.find((u) => u.userId === user.id);
    if (existingUser) {
      existingUser.socketId = socket.id;
    } else {
      onlineUser.push({
        userId: user.id,
        name: user.name,
        socketId: socket.id,
      });
    }

    io.emit("online-users", onlineUser);
  });
  socket.on("callToUser", (data) => {
    const call = onlineUser.find((user) => user.userId === data.callToUserId);
    if (!call) {
      socket.emit("userUnavailable", { message: `${call.name} is not online` });
    }
    io.to(call.socketId).emit("callToUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
      email: data.email,
      profilepic: data.profilepic,
    });
  });
  socket.on("reject-call", (data) => {
    io.to(data.to).emit("callRejected", {
      name: data.name,
      profilepic: data.profilepic,
    });
  });
  socket.on("disconnect", () => {
    const user = onlineUser.find((u) => u.socketId === socket.id);
    onlineUser = onlineUser.filter((u) => u.socketId !== socket.id);

    io.emit("online-users", onlineUser);
    socket.broadcast.emit("disConnectUser", { disUser: socket.id });
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// START SERVER
(async () => {
  try {
    await ConnectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
