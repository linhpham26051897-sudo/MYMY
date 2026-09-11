// ======================================================
// MYMY SERVER V4 - PHẦN 1
// ======================================================
require("dotenv").config();

const { AccessToken } = require("livekit-server-sdk");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(express.static("public"));
app.use("/uploads",express.static("uploads"));
// ================= DATABASE =================

const DB_FOLDER = "./database";

const USERS_FILE = `${DB_FOLDER}/users.json`;
const ROOMS_FILE = `${DB_FOLDER}/rooms.json`;
const MESSAGES_FILE = `${DB_FOLDER}/messages.json`;

if (!fs.existsSync(DB_FOLDER)){
    fs.mkdirSync(DB_FOLDER);
}

[USERS_FILE,ROOMS_FILE,MESSAGES_FILE].forEach(file=>{

    if(!fs.existsSync(file)){
        fs.writeFileSync(file,"{}");
    }

});

function readJSON(file){

    return JSON.parse(fs.readFileSync(file,"utf8"));

}

function writeJSON(file,data){

    fs.writeFileSync(file,JSON.stringify(data,null,2));

}
// ================= SAVE MESSAGE =================

function saveMessage(room,message){

    const data = readJSON(MESSAGES_FILE);

    if(!data[room]){
        data[room]=[];
    }

    data[room].push(message);

    writeJSON(MESSAGES_FILE,data);

}
// ======================================================
// LỊCH SỬ CHAT
// ======================================================

app.get("/messages/:room",(req,res)=>{

    const data = readJSON(MESSAGES_FILE);

    res.json(data[req.params.room] || []);

});
// ======================================================
// UPLOAD FILE
// ======================================================

if(!fs.existsSync("./uploads")){
    fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({

    destination(req,file,cb){
        cb(null,"uploads");
    },

    filename(req,file,cb){

        const ext = path.extname(file.originalname);

        cb(null,uuidv4()+ext);

    }

});

const upload = multer({

    storage,

    limits:{
        fileSize:20*1024*1024
    }

});

app.post("/upload",upload.single("file"),(req,res)=>{

    if(!req.file){
        return res.status(400).json({
            success:false
        });
    }

    res.json({

        success:true,

        fileName:req.file.originalname,

        fileType:req.file.mimetype,

        url:`/uploads/${req.file.filename}`

    });

});
// ======================================================
// PHÒNG CHAT
// ======================================================

app.post("/create-room",(req,res)=>{

    const {room,name}=req.body;

    const rooms = readJSON(ROOMS_FILE);

    rooms[room]={

        room,
        name,
        createdAt:Date.now()

    };

    writeJSON(ROOMS_FILE,rooms);

    res.json({
        success:true
    });

});

app.get("/rooms",(req,res)=>{

    res.json(readJSON(ROOMS_FILE));

});
// ======================================================
// QUẢN LÝ NGƯỜI ONLINE
// ======================================================

const onlineRooms = {};
// ======================================================
// SOCKET.IO
// ======================================================

io.on("connection", (socket) => {

    console.log("🟢 Connected:", socket.id);

    // ================= JOIN ROOM =================

    socket.on("join-room", ({ room, username }) => {

        socket.join(room);

        socket.room = room;
        socket.username = username;

        if (!onlineRooms[room]) {
            onlineRooms[room] = [];
        }

        // Không thêm trùng người
        if (!onlineRooms[room].includes(username)) {
            onlineRooms[room].push(username);
        }

        // Gửi danh sách online cho cả phòng
        io.to(room).emit("room-users", onlineRooms[room]);

        console.log(`${username} joined ${room}`);

    });

    // ================= GỬI TIN NHẮN =================

    socket.on("send-message", (data) => {

        const message = {

            username: data.username,
            message: data.message,
            type: data.type || "text",
            fileName: data.fileName || "",

            time: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit"
            })

        };

        // Lưu lịch sử
        saveMessage(data.room, message);

        // Gửi realtime
        io.to(data.room).emit("new-message", message);

    });

    // ================= ĐANG NHẬP =================

    socket.on("typing", ({ room, username }) => {

        socket.to(room).emit("user-typing", username);

    });

    // ================= GỌI THOẠI / VIDEO =================

    socket.on("start-call", ({ room, username, type }) => {

        socket.to(room).emit("incoming-call", {
            username,
            type
        });

    });

    socket.on("accept-call", ({ room, username }) => {

        socket.to(room).emit("call-accepted", {
            username
        });

    });

    socket.on("reject-call", ({ room, username }) => {

        socket.to(room).emit("call-rejected", {
            username
        });

    });

    socket.on("end-call", ({ room, username }) => {

        socket.to(room).emit("call-ended", {
            username
        });

    });

    // ================= THOÁT PHÒNG =================

    socket.on("disconnect", () => {

        const room = socket.room;
        const username = socket.username;

        if (room && onlineRooms[room]) {

            onlineRooms[room] =
                onlineRooms[room].filter(user => user !== username);

            io.to(room).emit("room-users", onlineRooms[room]);

            if (onlineRooms[room].length === 0) {
                delete onlineRooms[room];
            }

        }

        console.log(`🔴 ${username} disconnected`);

    });

});
// ======================================================
// ĐĂNG KÝ
// ======================================================

app.post("/register", (req, res) => {

    const { name, username, email, password } = req.body;

    const users = readJSON(USERS_FILE);

    // Kiểm tra trùng username
    const existed = Object.values(users).find(
        user => user.username === username
    );

    if (existed) {
        return res.status(400).json({
            message: "Tên đăng nhập đã tồn tại."
        });
    }

    const id = uuidv4();

    users[id] = {
        id,
        name,
        username,
        email,
        password,
        createdAt: Date.now()
    };

    writeJSON(USERS_FILE, users);

    res.json({
        success: true,
        message: "Đăng ký thành công."
    });

});
// ======================================================
// ĐĂNG NHẬP
// ======================================================

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    const users = readJSON(USERS_FILE);

    const user = Object.values(users).find(
        u => u.username === username && u.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Sai tài khoản hoặc mật khẩu."
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email
        }
    });

});
// ======================================================
// DANH SÁCH USER
// ======================================================

app.get("/users", (req, res) => {

    const users = readJSON(USERS_FILE);

    res.json(Object.values(users));

});
// ======================================================
// TẠO PHÒNG
// ======================================================

app.post("/create-room", (req, res) => {

    const { roomName, owner } = req.body;

    const rooms = readJSON(ROOMS_FILE);

    const roomCode =
        "MY" + Math.random().toString(36).substring(2, 6).toUpperCase();

    rooms[roomCode] = {
        roomCode,
        roomName,
        ownerName: owner,
        members: [owner],
        createdAt: Date.now()
    };

    writeJSON(ROOMS_FILE, rooms);

    // Cập nhật realtime
    io.emit("room-updated");

    res.json(rooms[roomCode]);

});
// ======================================================
// LẤY DANH SÁCH PHÒNG
// ======================================================

app.get("/rooms", (req, res) => {

    const rooms = readJSON(ROOMS_FILE);

    res.json(Object.values(rooms));

});
// ======================================================
// THAM GIA PHÒNG
// ======================================================

app.post("/join-room-api", (req, res) => {

    const { roomCode, username } = req.body;

    const rooms = readJSON(ROOMS_FILE);

    if (!rooms[roomCode]) {
        return res.status(404).json({
            message: "Không tìm thấy phòng."
        });
    }

    if (!rooms[roomCode].members.includes(username)) {
        rooms[roomCode].members.push(username);
    }

    writeJSON(ROOMS_FILE, rooms);

    io.emit("room-updated");

    res.json(rooms[roomCode]);

});
// ======================================================
// XÓA PHÒNG
// ======================================================

app.delete("/delete-room/:roomCode", (req, res) => {

    const rooms = readJSON(ROOMS_FILE);

    const roomCode = req.params.roomCode;

    if (!rooms[roomCode]) {
        return res.status(404).json({
            message: "Không tìm thấy phòng."
        });
    }

    delete rooms[roomCode];

    writeJSON(ROOMS_FILE, rooms);

    io.emit("room-updated");

    res.json({
        success: true
    });

});
// ======================================================
// LIVEKIT TOKEN API
// ======================================================

app.get("/livekit-token", async (req, res) => {

    const room = req.query.room;
    const username = req.query.username;

    if (!room || !username) {
        return res.status(400).json({
            message: "Thiếu room hoặc username."
        });
    }

    try {

        const token = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: username,
                name: username
            }
        );

        token.addGrant({
            roomJoin: true,
            room,
            canPublish: true,
            canSubscribe: true
        });

        const jwt = await token.toJwt();

        res.json({
            token: jwt,
            url: process.env.LIVEKIT_URL
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Không tạo được LiveKit token."
        });

    }

});
// ======================================================
// START SERVER
// ======================================================

server.listen(PORT, () => {

    console.log(`🚀 MYMY Server running on port ${PORT}`);

});