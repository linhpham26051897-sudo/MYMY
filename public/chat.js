// ======================================================
// MYMY CHAT.JS V4 - PHẦN 1
// ======================================================

const socket = io();

// ================= USER =================

const params = new URLSearchParams(location.search);

const room = params.get("room");
const username = params.get("username");

if (!room || !username) {
    alert("Không tìm thấy phòng.");
    location.href = "index.html";
}

// ================= HTML =================

const roomName = document.getElementById("roomName");
const roomStatus = document.getElementById("roomStatus");

const messages = document.getElementById("messages");
const memberList = document.getElementById("memberList");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const typingBox = document.getElementById("typingBox");

const voiceCallBtn = document.getElementById("voiceCallBtn");
const videoCallBtn = document.getElementById("videoCallBtn");
const backBtn = document.getElementById("backBtn");

roomName.textContent = room;

// ================= THAM GIA PHÒNG =================

socket.emit("join-room", {
    room,
    username
});

// ================= LOAD LỊCH SỬ =================

async function loadMessages() {

    const res = await fetch(`/messages/${room}`);

    const history = await res.json();

    messages.innerHTML = "";

    history.forEach(renderMessage);

}

loadMessages();
typingBox.textContent = "";
typingBox.style.display = "none";
socket.on("user-typing", (user) => {

    if (user === username) return;

    typingBox.style.display = "block";
    typingBox.textContent = `${user} đang nhập...`;

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        typingBox.textContent = "";
        typingBox.style.display = "none";
    }, 1500);

});
// ================= RENDER TIN NHẮN =================

function renderMessage(data){

    const mine = data.username === username;

    const row = document.createElement("div");
    row.className = mine ? "message-row mine" : "message-row other";

    let content = "";

    // Tin nhắn ảnh
    if (data.type === "image") {

        content = `
            <img src="${data.message}" class="chat-image">
        `;

    }
    // Tin nhắn file
    else if (data.type === "file") {

        content = `
            <a class="chat-file"
               href="${data.message}"
               target="_blank">
                📄 ${data.fileName}
            </a>
        `;

    }
    // Tin nhắn văn bản
    else {

        content = escapeHTML(data.message);

    }

    row.innerHTML = `
        ${mine ? "" : `
        <div class="message-avatar">
            ${data.username.charAt(0).toUpperCase()}
        </div>`}

        <div class="message-content">

            <div class="sender">${data.username}</div>

            <div class="message-bubble">
                ${content}
            </div>

            <div class="message-time">${data.time}</div>

        </div>
    `;

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
}

// ================= CHỐNG HTML =================

function escapeHTML(text) {

    return text
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;");

}

// ================= GỬI TIN =================

sendBtn.onclick = sendMessage;

messageInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});

function sendMessage() {

    const message = messageInput.value.trim();

    if (message === "") return;

    socket.emit("send-message", {
    room,
    username,
    type: "text",
    message
});

    messageInput.value = "";

}

// ================= NHẬN TIN =================

socket.on("new-message", data => {

    renderMessage(data);

});

// ================= ĐANG NHẬP =================

let typingTimeout;

messageInput.addEventListener("input", () => {

    socket.emit("typing", {
        room,
        username
    });

});

socket.on("user-typing", user => {

    if (user === username) return;

    typingBox.textContent =
        `${user} đang nhập...`;

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {

        typingBox.textContent = "";

    }, 1500);

});
// ======================================================
// MYMY CHAT.JS V4 - PHẦN 2
// ======================================================

// ================= DANH SÁCH ONLINE =================

socket.on("room-users", (users) => {

    memberList.innerHTML = "";

    roomStatus.textContent = `🟢 ${users.length} thành viên online`;

    users.forEach((user) => {

        const member = document.createElement("div");

        member.className = "member-item";

        member.innerHTML = `
            <div class="member-avatar">
                ${user.charAt(0).toUpperCase()}
            </div>

            <span>${user}</span>
        `;

        memberList.appendChild(member);

    });

});

// ================= HEADER BUTTON =================

// Quay lại trang chủ
backBtn.onclick = () => {

    window.location.href = "index.html";

};

// Gọi thoại
voiceCallBtn.onclick = () => {

    window.location.href =
        `call.html?room=${room}&username=${username}&type=voice`;

};

// Video Call
videoCallBtn.onclick = () => {

    window.location.href =
        `call.html?room=${room}&username=${username}&type=video`;

};

// ================= EMOJI PICKER =================

const emojis = ["😀","😂","😍","🥰","😭","😎","👍","❤️","🔥","🎉"];

const emojiBtn = document.getElementById("emojiBtn");

if (emojiBtn) {

    emojiBtn.onclick = () => {

        const picker = document.createElement("div");

        picker.className = "emoji-picker";

        emojis.forEach((emoji) => {

            const item = document.createElement("span");

            item.textContent = emoji;

            item.onclick = () => {

                messageInput.value += emoji;

                picker.remove();

                messageInput.focus();

            };

            picker.appendChild(item);

        });

        document.body.appendChild(picker);

        const rect = emojiBtn.getBoundingClientRect();

        picker.style.left = rect.left + "px";
        picker.style.top = rect.top - 70 + "px";

        document.addEventListener(
            "click",
            () => picker.remove(),
            { once: true }
        );

    };

}

// ================= GỬI ẢNH / FILE =================

const imageInput = document.getElementById("imageInput");

if (imageInput) {

    imageInput.addEventListener("change", async () => {

        const file = imageInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {

            const res = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            const result = await res.json();

            socket.emit("send-message", {
                room,
                username,
                type: result.fileType.startsWith("image/")
                    ? "image"
                    : "file",
                message: result.url,
                fileName: result.fileName
            });

            imageInput.value = "";

        } catch (err) {

            console.error(err);
            alert("Upload thất bại.");

        }

    });

}

// ================= KÉO XUỐNG CUỐI =================

const observer = new MutationObserver(() => {

    messages.scrollTop = messages.scrollHeight;

});

observer.observe(messages, {
    childList: true
});

// ================= NHẬN CUỘC GỌI =================

socket.on("incoming-call", (data) => {

    if (data.username === username) return;

    const text =
        data.type === "voice"
            ? `📞 ${data.username} đang gọi thoại cho bạn.`
            : `📹 ${data.username} đang gọi video cho bạn.`;

    const accept = confirm(text);

    if (accept) {

        socket.emit("accept-call", {
            room,
            username
        });

        window.location.href =
            `call.html?room=${room}&username=${username}&type=${data.type}`;

    } else {

        socket.emit("reject-call", {
            room,
            username
        });

    }

});

// ================= KẾT THÚC CUỘC GỌI =================

socket.on("call-ended", ({ username: other }) => {

    alert(`📞 ${other} đã kết thúc cuộc gọi.`);

});

// ================= REACTION (👍 ❤️ 😂 😮 😢) =================

messages.addEventListener("dblclick", (e) => {

    const bubble = e.target.closest(".message-bubble");

    if (!bubble) return;

    const reaction = document.createElement("div");

    reaction.className = "reaction-bar";

    ["👍","❤️","😂","😮","😢"].forEach((icon) => {

        const span = document.createElement("span");

        span.textContent = icon;

        span.onclick = () => {

            bubble.innerHTML += ` <span class="reaction">${icon}</span>`;

            reaction.remove();

        };

        reaction.appendChild(span);

    });

    bubble.appendChild(reaction);

});