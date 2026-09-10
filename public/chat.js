const socket = io();

// Lấy thông tin từ URL
const params = new URLSearchParams(window.location.search);

const room = params.get("room");
const username = params.get("username");

document.getElementById("roomName").innerHTML = room;

// Vào phòng
socket.emit("join-room", {
    room,
    username
});

const messages = document.getElementById("messages");

// Hiển thị tin nhắn
function addMessage(data){

    const div = document.createElement("div");

    div.className =
        data.username === username
            ? "message mine"
            : "message other";

    div.innerHTML =
        `<b>${data.username}</b><br>${data.message}`;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

}

// Gửi
document.getElementById("sendBtn").onclick = ()=>{

    const text =
        document.getElementById("messageInput").value.trim();

    if(!text) return;

    socket.emit("send-message",{
        room,
        username,
        message:text
    });

    document.getElementById("messageInput").value="";

};

// Enter gửi
document.getElementById("messageInput")
.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){
        document.getElementById("sendBtn").click();
    }

});

// Nhận
socket.on("new-message",(data)=>{
    addMessage(data);
});

// Gọi
document.getElementById("callBtn").onclick = ()=>{

    window.location.href =
    `call.html?room=${room}&username=${username}`;

};

// Về trang chủ
document.getElementById("backBtn").onclick = ()=>{

    window.location.href = "index.html";

};