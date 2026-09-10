const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================== PHÒNG CHAT ================== */

const rooms = {};

io.on("connection", (socket) => {
  console.log("🟢 Có người kết nối:", socket.id);

  socket.on("join-room", ({ room, username }) => {
    socket.join(room);

    socket.room = room;
    socket.username = username;

    if (!rooms[room]) rooms[room] = [];

    if (!rooms[room].includes(username)) {
      rooms[room].push(username);
    }

    io.to(room).emit("room-users", rooms[room]);
    socket.to(room).emit("user-joined", username);

    console.log(`${username} vào phòng ${room}`);
  });
  /* ================= CHAT ================= */

    socket.on("send-message", ({ room, username, message }) => {

        io.to(room).emit("new-message", {
        username,
        message,
        time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    });

    });

  socket.on("disconnect", () => {
    const room = socket.room;

    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter(
        (u) => u !== socket.username
      );

      io.to(room).emit("room-users", rooms[room]);
      socket.to(room).emit("user-left", socket.username);

      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});

/* ================== LIVEKIT TOKEN ================== */

app.get("/token", async (req, res) => {
  try {
    const room = req.query.room;
    const username = req.query.username;

    if (!room || !username) {
      return res.status(400).json({
        error: "Thiếu room hoặc username",
      });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: username,
      }
    );

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    res.json({
      token: await token.toJwt(),
      url: process.env.LIVEKIT_URL,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Không tạo được token",
    });
  }
});

/* ================== START ================== */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`💜 MYMY chạy tại cổng ${PORT}`);
});