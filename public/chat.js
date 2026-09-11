const socket = io();

const params = new URLSearchParams(location.search);

const room = params.get("room");

socket.emit("join-room",{
    room,
    username
});
const username = params.get("username");

document.getElementById("roomName").textContent = room;

socket.emit("join-room",{ room, username });

const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const typingBox = document.getElementById("typingBox");
let typingTimeout;

// Hiển thị tin nhắn
function addMessage(data){

    const row = document.createElement("div");

    const mine = data.username === username;

    row.className =
        mine ? "message-row mine" : "message-row other";

    row.innerHTML = `
        ${mine ? "" : `
        <div class="message-avatar">
            ${data.username.charAt(0).toUpperCase()}
        </div>`}

        <div class="message-content">

            <div class="sender">
                ${mine ? "Bạn" : data.username}
            </div>

            <div class="message">
                ${data.message}
            </div>

            <div class="time">
                ${data.time}
            </div>

        </div>

        ${mine ? `
        <div class="message-avatar">
            ${username.charAt(0).toUpperCase()}
        </div>` : ""}
    `;

    messages.appendChild(row);

    messages.scrollTop = messages.scrollHeight;

}
// Gửi trạng thái đang nhập
messageInput.addEventListener("input", () => {

    socket.emit("typing", {
        room,
        username
    });

});
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
const emojis = ["😊","😂","😍","❤️","👍","🎉","😎","😭"];

document.getElementById("emojiBtn").onclick = () => {

    const emoji =
        emojis[Math.floor(Math.random() * emojis.length)];

    messageInput.value += emoji;

    messageInput.focus();

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
socket.on("user-typing", (user) => {

    typingBox.innerHTML = `${user} đang nhập...`;

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        typingBox.innerHTML = "";
    }, 1500);

});
const ringtone = new Audio(
"/ringtone.mp3"
);

socket.on("incoming-call",(data)=>{

ringtone.play();

const accept =
confirm(`${data.username} đang gọi video.`);

ringtone.pause();

if(accept){

socket.emit("accept-call",{
room:data.room,
username
});

location.href=
`call.html?room=${data.room}&username=${username}`;

}else{

socket.emit("reject-call",{
room:data.room,
username
});

}

});