const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { AccessToken } = require("livekit-server-sdk");
const LIVEKIT_API_KEY = process.env.APIj9JDN9zXWvbf;
const LIVEKIT_API_SECRET = process.env.cAhenO9QOp2ucmciJPsfMjKJgdVeasxZcUlPDMaEsA9A;
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
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

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
  socket.on("leave-room", ({ room, username }) => {
    socket.leave(room);

    io.to(room).emit("user-left", username);
});
  socket.on("send-message", ({ room, username, message }) => {

    io.to(room).emit("new-message", {
        username,
        message,
        time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

});
// ================= GỌI ĐIỆN =================

socket.on("call-user", ({ room, username }) => {

    socket.to(room).emit("incoming-call", {
        room,
        username
    });

});

// Người nhận đồng ý
socket.on("accept-call", ({ room, username }) => {

    io.to(room).emit("call-accepted", {
        username
    });

});

// Người nhận từ chối
socket.on("reject-call", ({ room, username }) => {

    socket.to(room).emit("call-rejected", {
        username
    });

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

    const room = req.query.room;
    const username = req.query.username;

    if (!room || !username) {
        return res.status(400).send("Thiếu room hoặc username");
    }

    const token = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        {
            identity: username
        }
    );

    token.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true
    });

    const jwt = await token.toJwt();

    res.json({
        token: jwt
    });


});

/* ================== START ================== */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`💜 MYMY chạy tại cổng ${PORT}`);
});