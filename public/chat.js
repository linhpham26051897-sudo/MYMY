const socket = io();

const params = new URLSearchParams(location.search);

const room = params.get("room");
const username = params.get("username");

document.getElementById("roomName").textContent = room;

socket.emit("join-room",{ room, username });

const messages = document.getElementById("messages");

// Hiển thị tin nhắn
function addMessage(data){

  const div = document.createElement("div");

  div.className =
    data.username === username
      ? "message mine"
      : "message other";

  div.innerHTML = `
    <div class="sender">${data.username}</div>
    <div>${data.message}</div>
    <div class="time">${data.time}</div>
  `;

  messages.appendChild(div);

  messages.scrollTop = messages.scrollHeight;
}

// Gửi tin nhắn
document.getElementById("sendBtn").onclick = ()=>{

  const input = document.getElementById("messageInput");

  const text = input.value.trim();

  if(!text) return;

  socket.emit("send-message",{
    room,
    username,
    message:text
  });

  input.value="";
};

// Enter gửi
document.getElementById("messageInput")
.addEventListener("keydown",(e)=>{

  if(e.key==="Enter"){
    document.getElementById("sendBtn").click();
  }

});

// Nhận tin nhắn
socket.on("new-message",(data)=>{
  addMessage(data);
});

// Emoji nhanh
document.getElementById("emojiBtn").onclick=()=>{
  document.getElementById("messageInput").value += "😊";
};

// Quay lại Trang chủ
document.getElementById("backBtn").onclick=()=>{
  location.href="index.html";
};

// Sang màn hình gọi
document.getElementById("callBtn").onclick = () => {

    socket.emit("call-user", {
        room,
        username
    });

    location.href =
    `call.html?room=${encodeURIComponent(room)}&username=${username}`;

};
// ================= NHẬN CUỘC GỌI =================

socket.on("incoming-call", (data) => {

    const accept =
    confirm(`📞 ${data.username} đang gọi cho bạn`);

    if (accept) {

        socket.emit("accept-call", {
            room: data.room,
            username
        });

        location.href =
        `call.html?room=${encodeURIComponent(data.room)}&username=${username}`;

    } else {

        socket.emit("reject-call", {
            room: data.room,
            username
        });

    }

});