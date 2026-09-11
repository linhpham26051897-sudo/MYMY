const socket = io();

// ================= USER =================

const currentUser =
JSON.parse(localStorage.getItem("currentUser"));

if(!currentUser){

    window.location.href="login.html";

}

document.getElementById("fullName").innerHTML =
currentUser.fullname;

document.getElementById("emailUser").innerHTML =
currentUser.email;

document.getElementById("avatarLetter").innerHTML =
currentUser.fullname.charAt(0).toUpperCase();

// ================= PHÒNG CHAT =================

let rooms = [];

async function loadRooms(){

    const res = await fetch("/rooms");

    rooms = await res.json();

    renderRooms();

}

loadRooms();

const chatList =
document.getElementById("chatList");

function renderRooms(){

    chatList.innerHTML = "";

    if(rooms.length===0){

        chatList.innerHTML = `
            <h3>Chưa có phòng nào.</h3>
        `;
        return;
    }

    rooms.forEach(room=>{

        chatList.innerHTML += `

        <div class="room-card">

            <div class="room-left">

                <div class="room-avatar">
                    💜
                </div>

                <div class="room-info">

                    <h3>${room.roomName}</h3>

                    <p>Mã: ${room.roomCode}</p>

                    <p>👤 Tạo bởi: ${room.ownerName}</p>

                    <p>${room.members.length} thành viên</p>

                </div>

            </div>

            <div class="actions">

                <button
                class="chat-btn"
                onclick="joinChat('${room.roomCode}')">
                    💬
                </button>

                <button
                class="call-btn"
                onclick="joinCall('${room.roomCode}')">
                    📹
                </button>

            </div>

        </div>

        `;

    });

}

renderRooms();

// ================= TÌM PHÒNG =================

document.getElementById("searchRoom")
.addEventListener("input", async(e)=>{

    const keyword = e.target.value;

    if(keyword===""){
        loadRooms();
        return;
    }

    const res = await fetch(
        `/search-room?keyword=${keyword}`
    );

    rooms = await res.json();

    renderRooms();

});

// ================= TẠO PHÒNG =================

document.getElementById("createRoomBtn").onclick = async()=>{

    const roomName = prompt("Tên phòng:");

    if(!roomName) return;

    const res = await fetch("/create-room",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            roomName,
            owner:currentUser.username

        })

    });

    const room = await res.json();

    alert(
`🎉 Tạo thành công

Tên: ${room.roomName}

Mã phòng: ${room.roomCode}`
    );

    loadRooms();

};

// ================= CHAT =================

window.openChat=(room)=>{

    window.location.href=
    `chat.html?room=${encodeURIComponent(room)}&username=${currentUser.username}`;

};

// ================= GỌI =================

window.openCall = (room) => {

    socket.emit("call-user", {
        room,
        username: currentUser.username
    });

    window.location.href =
        `call.html?room=${encodeURIComponent(room)}&username=${currentUser.username}`;

};

// ================= LOGOUT =================

document.getElementById("logoutBtn").onclick=()=>{

    localStorage.removeItem("currentUser");

    window.location.href="login.html";

};

// ================= ONLINE =================

socket.on("room-users",(users)=>{

    const member =
    document.getElementById("memberList");

    member.innerHTML="";

    users.forEach(user=>{

        member.innerHTML += `
        <div class="member">
            <span class="dot"></span>
            ${user}
        </div>
        `;

    });

});
socket.on("incoming-call", (data) => {

    const ok = confirm(`📞 ${data.username} đang gọi cho bạn`);

    if (ok) {

        socket.emit("accept-call", {
            room: data.room,
            username: currentUser.username
        });

        window.location.href =
            `call.html?room=${encodeURIComponent(data.room)}&username=${currentUser.username}`;

    } else {

        socket.emit("reject-call", {
            room: data.room,
            username: currentUser.username
        });

    }

});
// ================= JOIN CHAT =================
window.joinChat = async(roomCode)=>{

    const res = await fetch("/join-room-api",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            roomCode,

            username:currentUser.username

        })

    });

    const room = await res.json();

    location.href =
`chat.html?room=${room.roomCode}&username=${currentUser.username}`;

};
window.joinCall = async(roomCode)=>{

    await fetch("/join-room-api",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            roomCode,
            username:currentUser.username

        })

    });

    location.href=
`call.html?room=${roomCode}&username=${currentUser.username}`;

};
document.getElementById("joinRoomBtn").onclick = async () => {

    const code = prompt("Nhập mã phòng (VD: MYB167)");

    if (!code) return;

    const res = await fetch("/join-room-api", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            roomCode: code.toUpperCase(),
            username: currentUser.username
        })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    location.href =
        `chat.html?room=${data.roomName}&username=${currentUser.username}`;
};