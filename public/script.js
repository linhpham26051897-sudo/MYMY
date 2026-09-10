const socket = io();

console.log("MYMY Socket kết nối:", socket.id);

socket.on("connect", () => {
    console.log("Đã kết nối server:", socket.id);
}); // <-- PHẢI CÓ DÒNG NÀY

const status = document.getElementById("status");
const members = document.getElementById("members");

let room = "";
let username = "";
let peer;
let localStream;

const remoteAudio = document.getElementById("remoteAudio");

const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },

        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
};
// Nút vào phòng
document.getElementById("join").onclick = async () => {
    

    username = document.getElementById("username").value.trim();
    room = document.getElementById("room").value.trim();

    if (username === "" || room === "") {
        alert("Nhập tên và mã phòng!");
        return;
    }

    socket.emit("join-room", { room, username });

    status.innerHTML = `🟢 Đã vào phòng <b>${room}</b>`;

    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    });

    status.innerHTML += "<br>🎤 Micro đã sẵn sàng";
};
document.getElementById("call").onclick = async () => {

    if (!localStream) {
        alert("Bạn phải bấm 'Vào phòng' trước.");
        return;
    }

    createPeer();

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("offer", {
        room,
        offer
    });

    status.innerHTML = "📞 Đang gọi...";
};
// Có người tham gia
socket.on("user-joined", user => {

    status.innerHTML =
      `🟢 ${user} vừa vào phòng.`;
});

// Có người rời phòng
socket.on("user-left", user => {

    status.innerHTML =
      `🔴 ${user} đã rời phòng.`;

});

// Cập nhật số người
socket.on("room-users", users => {

    members.innerHTML =
      `👥 ${users.length} người trong phòng`;

    if(users.length === 2){
        members.classList.add("online");
    }else{
        members.classList.remove("online");
    }

});
function createPeer() {

    peer = new RTCPeerConnection(config);

    // Gửi micro của mình
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    // Nhận âm thanh từ người bên kia
    peer.ontrack = async (event) => {

    console.log("Đã nhận audio");

    remoteAudio.srcObject = event.streams[0];

    remoteAudio.muted = false;
    remoteAudio.volume = 1;

    try {
        await remoteAudio.play();
        console.log("Đang phát âm thanh.");
    } catch (err) {
        console.log("Lỗi phát âm thanh:", err);
    }
};

    // ICE Candidate
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", {
                room,
                candidate: event.candidate
            });
        }
    };

    // Theo dõi trạng thái kết nối
    peer.onconnectionstatechange = () => {
        console.log("Connection:", peer.connectionState);
        status.innerHTML = "📶 " + peer.connectionState;
    };
}
socket.on("offer", async offer => {

    status.innerHTML = "📞 Có cuộc gọi đến...";

    createPeer();

    await peer.setRemoteDescription(offer);

    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    socket.emit("answer", {
        room,
        answer
    });

    status.innerHTML = "📞 Đã kết nối cuộc gọi";
});
socket.on("answer", async answer => {

    await peer.setRemoteDescription(answer);

    status.innerHTML = "✅ Cuộc gọi đã kết nối";

});
socket.on("candidate", async candidate => {

    if (peer) {
        await peer.addIceCandidate(candidate);
    }

});
document.getElementById("hangup").onclick = () => {

    if (peer) {
        peer.close();
        peer = null;
    }

    socket.emit("hangup", room);

    status.innerHTML = "❌ Bạn đã cúp máy";
};

socket.on("hangup", () => {

    if (peer) {
        peer.close();
        peer = null;
    }

    status.innerHTML = "📴 Đối phương đã cúp máy";
});
document.getElementById("mute").onclick = () => {

    if (!localStream) return;

    const mic = localStream.getAudioTracks()[0];

    mic.enabled = !mic.enabled;

    if (mic.enabled) {
        status.innerHTML = "🎤 Micro đã bật";
    } else {
        status.innerHTML = "🔇 Micro đã tắt";
    }
};