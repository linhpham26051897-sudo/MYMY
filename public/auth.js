// ======================================================
// MYMY AUTH.JS V2 (PHẦN 1/2)
// ======================================================

// ===== ELEMENT =====
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// ======================================================
// KIỂM TRA ĐÃ ĐĂNG NHẬP CHƯA
// ======================================================

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (
    currentUser &&
    location.pathname.includes("login.html")
) {
    location.href = "index.html";
}

// ======================================================
// ĐĂNG NHẬP
// ======================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const username =
            document.getElementById("loginUsername").value.trim();

        const password =
            document.getElementById("loginPassword").value.trim();

        if (!username || !password) {
            alert("Vui lòng nhập đầy đủ.");
            return;
        }

        try {

            const res = await fetch("/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username,
                    password
                })

            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message);
                return;
            }

            localStorage.setItem(
                "currentUser",
                JSON.stringify(data.user)
            );

            alert(`Xin chào ${data.user.username}!`);

            location.href = "index.html";

        } catch (err) {

            console.error(err);

            alert("Không kết nối được Server.");

        }

    });

}

// ======================================================
// ĐĂNG KÝ
// ======================================================

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const username =
            document.getElementById("registerUsername").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("registerConfirmPassword").value;

        if (!name || !username || !email || !password) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password.length < 6) {
            alert("Mật khẩu tối thiểu 6 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {

            const res = await fetch("/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    username,
                    email,
                    password
                })

            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message);
                return;
            }

            alert("Đăng ký thành công!");

            location.href = "login.html";

        } catch (err) {

            console.error(err);

            alert("Không kết nối được Server.");

        }

    });

}
// ======================================================
// MYMY AUTH.JS V2 (PHẦN 2/2)
// ======================================================

// ================= LẤY USER ĐANG ĐĂNG NHẬP =================
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// ================= KIỂM TRA ĐĂNG NHẬP =================
function requireLogin() {

    const user = getCurrentUser();

    if (!user) {
        alert("Vui lòng đăng nhập trước.");
        location.href = "login.html";
        return null;
    }

    return user;
}

// ================= ĐĂNG XUẤT =================
function logout() {

    if (confirm("🚪 Bạn có muốn đăng xuất không?")) {

        localStorage.removeItem("currentUser");

        location.href = "login.html";

    }

}

// Gắn nút logout nếu có trên trang
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

// ================= HIỂN THỊ THÔNG TIN USER =================
function loadProfile() {

    const user = requireLogin();
    if (!user) return;

    const usernameText = document.getElementById("usernameText");
    const emailText = document.getElementById("emailText");
    const avatar = document.getElementById("userAvatar");

    if (usernameText) usernameText.textContent = user.username;
    if (emailText) emailText.textContent = user.email;

    if (avatar) {
        avatar.textContent = user.username.charAt(0).toUpperCase();
    }

}

// Tự động hiển thị profile nếu đang ở index.html
if (location.pathname.includes("index.html")) {
    loadProfile();
}

// ================= CẬP NHẬT THÔNG TIN =================
async function refreshUser() {

    const user = getCurrentUser();
    if (!user) return;

    try {

        const res = await fetch("/users");

        if (!res.ok) return;

        const users = await res.json();

        const latest = users.find(
            u => u.username === user.username
        );

        if (latest) {

            localStorage.setItem(
                "currentUser",
                JSON.stringify(latest)
            );

        }

    } catch (err) {

        console.log("Không cập nhật được user.");

    }

}

// ================= CHUYỂN TRANG =================
function goChat(roomCode) {

    const user = requireLogin();

    if (!user) return;

    location.href =
        `chat.html?room=${roomCode}&username=${user.username}`;

}

function goCall(roomCode, type = "video") {

    const user = requireLogin();

    if (!user) return;

    location.href =
        `call.html?room=${roomCode}&username=${user.username}&type=${type}`;

}

// ================= KIỂM TRA PHIÊN =================
window.addEventListener("load", () => {

    const protectedPages = [
        "index.html",
        "chat.html",
        "call.html"
    ];

    const currentPage = location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage)) {
        requireLogin();
    }

});