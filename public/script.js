// ======================================================
// MYMY SCRIPT.JS V3 - PHẦN 1/2
// ======================================================

const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user) {
    location.href = "login.html";
}

// ================= ELEMENT =================

const roomContainer = document.getElementById("roomContainer");
const roomCount = document.getElementById("roomCount");
const searchRoom = document.getElementById("searchRoom");

const createRoomBtn = document.getElementById("createRoomBtn");
const welcomeCreateRoom = document.getElementById("welcomeCreateRoom");

const joinRoomBtn = document.getElementById("joinRoomBtn");
const welcomeJoinRoom = document.getElementById("welcomeJoinRoom");

const createModal = document.getElementById("createRoomModal");
const joinModal = document.getElementById("joinRoomModal");

const confirmCreateRoom = document.getElementById("confirmCreateRoom");
const cancelCreateRoom = document.getElementById("cancelCreateRoom");

const confirmJoinRoom = document.getElementById("confirmJoinRoom");
const cancelJoinRoom = document.getElementById("cancelJoinRoom");

const newRoomName = document.getElementById("newRoomName");
const joinRoomCode = document.getElementById("joinRoomCode");

// ================= DỮ LIỆU =================

let rooms = [];

// ======================================================
// LOAD PHÒNG
// ======================================================

async function loadRooms() {

    try {

        const res = await fetch("/rooms");

        rooms = await res.json();

        renderRooms(rooms);

    } catch (err) {

        console.log(err);

    }

}

loadRooms();

// ======================================================
// RENDER PHÒNG
// ======================================================

function renderRooms(list) {

    roomContainer.innerHTML = "";

    roomCount.textContent = `${list.length} phòng`;

    if (list.length === 0) {

        roomContainer.innerHTML = `
            <div class="empty-room">
                😥 Chưa có phòng nào.
            </div>
        `;

        return;

    }

    list.forEach(room => {

        const card = document.createElement("div");

        card.className = "room-card";

        card.innerHTML = `

            <div class="room-top">

                <div class="room-avatar">
                    ${room.roomName.charAt(0).toUpperCase()}
                </div>

                <div class="room-info">

                    <h3>${room.roomName}</h3>

                    <p>👑 ${room.ownerName}</p>

                    <p>🆔 ${room.roomCode}</p>

                </div>

            </div>

            <div class="room-members">
                👥 ${room.members.length} thành viên
            </div>

            <div class="room-actions">

                <button class="chat-btn"
                    onclick="goChatRoom('${room.roomCode}')">
                    💬 Chat
                </button>

                <button class="voice-btn"
                    onclick="goVoiceCall('${room.roomCode}')">
                    📞 Gọi
                </button>

                <button class="video-btn"
                    onclick="goVideoCall('${room.roomCode}')">
                    📹 Video
                </button>

            </div>

        `;

        roomContainer.appendChild(card);

    });

}

// ======================================================
// TÌM PHÒNG
// ======================================================

searchRoom.addEventListener("input", () => {

    const keyword =
        searchRoom.value.trim().toLowerCase();

    const result = rooms.filter(room =>

        room.roomName.toLowerCase().includes(keyword) ||
        room.roomCode.toLowerCase().includes(keyword) ||
        room.ownerName.toLowerCase().includes(keyword)

    );

    renderRooms(result);

});

// ======================================================
// POPUP
// ======================================================

function openCreateModal() {

    createModal.classList.remove("hidden");

    newRoomName.focus();

}

function closeCreateModal() {

    createModal.classList.add("hidden");

    newRoomName.value = "";

}

function openJoinModal() {

    joinModal.classList.remove("hidden");

    joinRoomCode.focus();

}

function closeJoinModal() {

    joinModal.classList.add("hidden");

    joinRoomCode.value = "";

}

createRoomBtn.onclick = openCreateModal;
welcomeCreateRoom.onclick = openCreateModal;

joinRoomBtn.onclick = openJoinModal;
welcomeJoinRoom.onclick = openJoinModal;

cancelCreateRoom.onclick = closeCreateModal;
cancelJoinRoom.onclick = closeJoinModal;
// ======================================================
// MYMY SCRIPT.JS V3 - PHẦN 2/2
// ======================================================

// ================= TẠO PHÒNG =================

confirmCreateRoom.onclick = async () => {

    const roomName = newRoomName.value.trim();

    if (roomName === "") {
        alert("Nhập tên phòng.");
        return;
    }

    try {

        const res = await fetch("/create-room", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomName,
                owner: user.username
            })
        });

        const room = await res.json();

        closeCreateModal();

        await loadRooms();

        alert(`✅ Đã tạo phòng "${room.roomName}"\nMã phòng: ${room.roomCode}`);

    } catch (err) {

        console.error(err);
        alert("Không tạo được phòng.");

    }

};

// Enter để tạo phòng
newRoomName.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        confirmCreateRoom.click();
    }

});

// ================= THAM GIA PHÒNG =================

confirmJoinRoom.onclick = async () => {

    const roomCode = joinRoomCode.value.trim().toUpperCase();

    if (!roomCode) {
        alert("Nhập mã phòng.");
        return;
    }

    try {

        const res = await fetch("/join-room-api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomCode,
                username: user.username
            })
        });

        const room = await res.json();

        if (!res.ok) {
            alert(room.message);
            return;
        }

        closeJoinModal();

        await loadRooms();

        alert(`🎉 Đã tham gia phòng ${room.roomName}`);

    } catch (err) {

        console.error(err);
        alert("Không tham gia được phòng.");

    }

};

// Enter để tham gia
joinRoomCode.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        confirmJoinRoom.click();
    }

});

// ================= ĐÓNG POPUP KHI CLICK RA NGOÀI =================

window.addEventListener("click", (e) => {

    if (e.target === createModal) closeCreateModal();

    if (e.target === joinModal) closeJoinModal();

});

// ================= CHUYỂN TRANG =================

window.goChatRoom = function(roomCode){

    location.href =
        `chat.html?room=${roomCode}&username=${user.username}`;

};

window.goVoiceCall = function(roomCode){

    location.href =
        `call.html?room=${roomCode}&username=${user.username}&type=voice`;

};

window.goVideoCall = function(roomCode){

    location.href =
        `call.html?room=${roomCode}&username=${user.username}&type=video`;

};

// ================= AUTO REFRESH DANH SÁCH PHÒNG =================

// Cứ 5 giây cập nhật một lần.
setInterval(loadRooms, 5000);

// ================= SOCKET UPDATE REALTIME =================

const socket = io();

socket.emit("join-room", {
    room: "LOBBY",
    username: user.username
});

socket.on("room-updated", () => {
    loadRooms();
});

// ================= HIỂN THỊ USER =================

document.getElementById("usernameText").textContent = user.username;
document.getElementById("emailText").textContent = user.email || "";

const avatar = document.getElementById("userAvatar");

avatar.textContent =
    user.username.charAt(0).toUpperCase();

// ================= ĐĂNG XUẤT =================

document.getElementById("logoutBtn").onclick = () => {

    if (confirm("Bạn muốn đăng xuất?")) {

        localStorage.removeItem("currentUser");

        location.href = "login.html";

    }

};