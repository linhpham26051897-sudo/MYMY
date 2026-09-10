const socket = io();

const status = document.getElementById("status");
const members = document.getElementById("members");

let username = "";
let room = "";

let roomConnection = null;
let micEnabled = true;

/* ====================== VÀO PHÒNG ====================== */

document.getElementById("join").onclick = async () => {

    username = document.getElementById("username").value.trim();
    room = document.getElementById("room").value.trim();

    if (!username || !room) {
        alert("Nhập tên và mã phòng!");
        return;
    }

    try {

        await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        socket.emit("join-room", {
            room,
            username,
        });

        status.innerHTML = "🟢 Đã vào phòng " + room;

    } catch (err) {

        alert("Bạn chưa cấp quyền Micro.");

    }

};

/* ====================== GỌI ====================== */

document.getElementById("call").onclick = async () => {

    if (!room) {
        alert("Hãy vào phòng trước.");
        return;
    }

    if (roomConnection) {
        alert("Đã trong cuộc gọi.");
        return;
    }

    status.innerHTML = "📞 Đang kết nối...";

    try {

        const res = await fetch(
            `/token?room=${room}&username=${username}`
        );

        const data = await res.json();

        roomConnection = new LivekitClient.Room();

        /* Nhận âm thanh */

        roomConnection.on(
            LivekitClient.RoomEvent.TrackSubscribed,
            (track) => {

                if (track.kind === "audio") {

                    const audio = track.attach();

                    audio.autoplay = true;
                    audio.playsInline = true;

                    document.body.appendChild(audio);

                }

            }
        );

        roomConnection.on(
            LivekitClient.RoomEvent.Disconnected,
            () => {
                status.innerHTML = "📴 Đã ngắt kết nối";
                roomConnection = null;
            }
        );

        await roomConnection.connect(
            data.url,
            data.token
        );

        /* QUAN TRỌNG */
        await roomConnection.startAudio();

        await roomConnection.localParticipant.setMicrophoneEnabled(true);

        status.innerHTML = "✅ Đã kết nối cuộc gọi";

    } catch (err) {

        console.error(err);

        status.innerHTML = "❌ Không kết nối được cuộc gọi";

    }

};

/* ====================== TẮT MIC ====================== */

document.getElementById("mute").onclick = async () => {

    if (!roomConnection) return;

    micEnabled = !micEnabled;

    await roomConnection.localParticipant.setMicrophoneEnabled(
        micEnabled
    );

    status.innerHTML = micEnabled
        ? "🎤 Micro đã bật"
        : "🔇 Micro đã tắt";

};

/* ====================== CÚP MÁY ====================== */

document.getElementById("hangup").onclick = async () => {

    if (!roomConnection) return;

    await roomConnection.disconnect();

    roomConnection = null;

    status.innerHTML = "📴 Đã cúp máy";

};

/* ====================== SOCKET PHÒNG ====================== */

socket.on("user-joined", (user) => {
    status.innerHTML = "🟢 " + user + " vừa vào phòng";
});

socket.on("user-left", (user) => {
    status.innerHTML = "🔴 " + user + " rời phòng";
});

socket.on("room-users", (users) => {

    members.innerHTML =
        "👥 " + users.length + " người trong phòng";

    if (users.length >= 2) {
        members.classList.add("online");
    } else {
        members.classList.remove("online");
    }

});