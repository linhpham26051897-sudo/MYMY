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

const rooms = [
    {
        name:"Gia Đình",
        icon:"💜",
        last:"Tối nay gọi nhé!"
    },
    {
        name:"Lớp CNTT",
        icon:"💻",
        last:"Có bài tập mới."
    },
    {
        name:"Nhóm Game",
        icon:"🎮",
        last:"8 giờ tối chơi."
    }
];

const chatList =
document.getElementById("chatList");

function renderRooms(){

    chatList.innerHTML="";

    rooms.forEach(room=>{

        chatList.innerHTML += `
        <div class="room-card">

            <div class="room-left">

                <div class="room-avatar">
                    ${room.icon}
                </div>

                <div class="room-info">

                    <h3>${room.name}</h3>

                    <p>${room.last}</p>

                </div>

            </div>

            <div class="actions">

                <button class="chat-btn"
                onclick="openChat('${room.name}')">
                    💬
                </button>

                <button class="call-btn"
                onclick="openCall('${room.name}')">
                    📞
                </button>

            </div>

        </div>
        `;

    });

}

renderRooms();

// ================= TÌM PHÒNG =================

document.getElementById("searchRoom")
.addEventListener("input",(e)=>{

    const keyword =
    e.target.value.toLowerCase();

    const cards =
    document.querySelectorAll(".room-card");

    cards.forEach(card=>{

        const text =
        card.innerText.toLowerCase();

        card.style.display =
        text.includes(keyword)
        ? "flex"
        : "none";

    });

});

// ================= TẠO PHÒNG =================

document.getElementById("createRoomBtn").onclick=()=>{

    const room =
    prompt("Tên phòng mới:");

    if(!room) return;

    rooms.unshift({
        name:room,
        icon:"✨",
        last:"Phòng mới tạo."
    });

    renderRooms();

};

// ================= CHAT =================

window.openChat=(room)=>{

    window.location.href=
    `chat.html?room=${encodeURIComponent(room)}&username=${currentUser.username}`;

};

// ================= GỌI =================

window.openCall=(room)=>{

    window.location.href=
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