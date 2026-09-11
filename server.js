const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "database", "users.json");
const ROOMS_FILE = path.join(__dirname, "database", "rooms.json");
const MESSAGES_FILE = path.join(__dirname, "database", "messages.json");

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { AccessToken } = require("livekit-server-sdk");
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

/* ================== PHÒNG CHAT ================== */

const rooms = {};
function generateRoomCode(){

    return (
        "MY" +
        Math.random()
            .toString(36)
            .substring(2,6)
            .toUpperCase()
    );

}
app.post("/create-room",(req,res)=>{

    const rooms = readJSON(ROOMS_FILE);

    const { roomName, owner } = req.body;

    if(!roomName){
        return res.status(400).json({
            message:"Thiếu tên phòng."
        });
    }

    const roomCode = generateRoomCode();

    const room = {

        id:Date.now(),

        roomCode,

        roomName,

        owner,

        members:[owner],

        createdAt:new Date()

    };

    rooms.push(room);

    writeJSON(ROOMS_FILE,rooms);

    res.json(room);

});
app.get("/rooms",(req,res)=>{

    const rooms = readJSON(ROOMS_FILE);

    res.json(rooms);

});
app.get("/search-room",(req,res)=>{

    const keyword =
        req.query.keyword.toLowerCase();

    const rooms = readJSON(ROOMS_FILE);

    const result = rooms.filter(room=>

        room.roomName.toLowerCase().includes(keyword) ||

        room.roomCode.toLowerCase().includes(keyword)

    );

    res.json(result);

});
app.post("/join-room-api",(req,res)=>{

    const rooms = readJSON(ROOMS_FILE);

    const { roomCode, username } = req.body;

    const room = rooms.find(r=>r.roomCode===roomCode);

    if(!room){

        return res.status(404).json({
            message:"Không tìm thấy phòng."
        });

    }

    if(!room.members.includes(username)){

        room.members.push(username);

    }

    writeJSON(ROOMS_FILE,rooms);

    res.json(room);

});
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
socket.on("typing", ({ room, username }) => {

    socket.to(room).emit("user-typing", username);

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