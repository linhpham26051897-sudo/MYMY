const socket = io();
const params = new URLSearchParams(window.location.search);

const roomParam = params.get("room");
const userParam = params.get("username");

if (roomParam) {
    document.getElementById("room").value = roomParam;
}

if (userParam) {
    document.getElementById("username").value = userParam;
}
const status = document.getElementById("status");
const members = document.getElementById("members");

let username = "";
let room = "";

let roomConnection = null;
let micEnabled = true;
let callSeconds = 0;
let timer = null;
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
        startTimer();

document.getElementById("callName").innerHTML =
    "📞 Đang gọi cùng " + username;

document.querySelector(".call-avatar").innerHTML = "🎙️";

document.querySelector(".call-avatar").classList.add("calling");

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
    stopTimer();

document.getElementById("callName").innerHTML =
    "MYMY ROOM";

document.querySelector(".call-avatar").innerHTML = "💜";

document.querySelector(".call-avatar").classList.remove("calling");

};

/* ====================== SOCKET PHÒNG ====================== */

socket.on("user-joined", (user) => {
    status.innerHTML = "🟢 " + user + " vừa vào phòng";
});

socket.on("user-left", (user) => {
    status.innerHTML = "🔴 " + user + " rời phòng";
});

socket.on("room-users", (users) => {

    // Cập nhật số người
    members.innerHTML = `👥 ${users.length} người trong phòng`;

    // Lấy khung danh sách thành viên
    const onlineList = document.getElementById("onlineList");

    // Xóa danh sách cũ
    onlineList.innerHTML = "";

    // Thêm từng thành viên
    users.forEach((user) => {

        const card = document.createElement("div");
        card.className = "userCard";

        // Avatar là chữ cái đầu
        const avatar = user.charAt(0).toUpperCase();

        card.innerHTML = `
            <div class="user-avatar">${avatar}</div>

            <div class="user-name">
                <span class="dot"></span>
                ${user}
            </div>
        `;

        onlineList.appendChild(card);
    });

});
function startTimer(){

    clearInterval(timer);

    callSeconds = 0;

    timer = setInterval(()=>{

        callSeconds++;

        const min = String(Math.floor(callSeconds/60)).padStart(2,"0");
        const sec = String(callSeconds%60).padStart(2,"0");

        document.querySelector(".call-time").innerHTML =
            "⏱️ " + min + ":" + sec;

    },1000);

}

function stopTimer(){

    clearInterval(timer);

    document.querySelector(".call-time").innerHTML =
        "⏱️ 00:00";

}
/* ================= CHAT ================= */

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

function addMessage(data, mine){

    const div = document.createElement("div");

    div.className = mine
        ? "message mine"
        : "message other";

    div.innerHTML = `
        <div class="sender">
            ${data.username} • ${data.time}
        </div>

        <div>${data.message}</div>
    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

}

sendBtn.onclick = () => {

    const text = messageInput.value.trim();

    if(text === "") return;

    socket.emit("send-message",{
        room,
        username,
        message:text,
    });

    messageInput.value = "";

};

messageInput.addEventListener("keydown",(e)=>{

    if(e.key === "Enter"){
        sendBtn.click();
    }

});

socket.on("new-message",(data)=>{

    addMessage(
        data,
        data.username === username
    );

});