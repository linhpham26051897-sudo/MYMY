const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`MYMY chạy tại cổng ${PORT}`);
});