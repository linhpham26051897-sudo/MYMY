const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user) {
    window.location.href = "login.html";
}

document.getElementById("welcomeName").innerHTML =
    user.fullname;

document.getElementById("emailShow").innerHTML =
    user.email;

document.getElementById("logoutBtn").onclick = () => {

    localStorage.removeItem("currentUser");

    window.location.href = "login.html";

};

document.getElementById("goChat").onclick = () => {

    const room =
        document.getElementById("roomInput").value.trim();

    if (!room) {
        alert("Nhập mã phòng.");
        return;
    }

    window.location.href =
        `chat.html?room=${room}&username=${user.username}`;

};

document.getElementById("goCall").onclick = () => {

    const room =
        document.getElementById("roomInput").value.trim();

    if (!room) {
        alert("Nhập mã phòng.");
        return;
    }

    window.location.href =
        `index.html?room=${room}&username=${user.username}`;

};