const { AccessToken } = require("livekit-server-sdk");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));

const rooms = {};

io.on("connection", socket => {

    console.log("Có người kết nối.");

    socket.on("join-room", ({ room, username }) => {

        socket.join(room);

        socket.room = room;
        socket.username = username;

        if (!rooms[room]) rooms[room] = [];

        rooms[room].push(username);

        io.to(room).emit("room-users", rooms[room]);

        socket.to(room).emit("user-joined", username);

        console.log(username + " vào phòng " + room);
    });

    // ===== WEBRTC =====

    socket.on("offer", data => {
        socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", data => {
        socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("candidate", data => {
        socket.to(data.room).emit("candidate", data.candidate);
    });

    socket.on("hangup", room => {
        socket.to(room).emit("hangup");
    });

    // ===== Rời phòng =====

    socket.on("disconnect", () => {

        const room = socket.room;

        if (room && rooms[room]) {

            rooms[room] = rooms[room].filter(
                user => user !== socket.username
            );

            io.to(room).emit("room-users", rooms[room]);

            socket.to(room).emit("user-left", socket.username);

            if (rooms[room].length === 0) {
                delete rooms[room];
            }
        }

    });

});
app.get("/token", async (req, res) => {

    const room = req.query.room;
    const username = req.query.username;

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity: username }
    );

    at.addGrant({
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true
    });

    res.json({
        token: await at.toJwt(),
        url: process.env.LIVEKIT_URL
    });

});
server.listen(PORT, "0.0.0.0", () => {
    console.log(`MYMY chạy tại cổng ${PORT}`);
});