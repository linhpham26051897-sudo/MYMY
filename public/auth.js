// ===================== ĐĂNG KÝ =====================

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {

    registerBtn.onclick = () => {

        const fullname = document.getElementById("fullname").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!fullname || !username || !email || !password || !confirmPassword) {
            alert("⚠️ Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password.length < 6) {
            alert("⚠️ Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ Hai mật khẩu không khớp.");
            return;
        }

        const users = JSON.parse(localStorage.getItem("mymyUsers")) || [];

        const existed = users.find(user => user.email === email);

        if (existed) {
            alert("📧 Email này đã được đăng ký.");
            return;
        }

        const newUser = {
            id: Date.now(),
            fullname,
            username,
            email,
            password,
            avatar: fullname.charAt(0).toUpperCase()
        };

        users.push(newUser);

        localStorage.setItem("mymyUsers", JSON.stringify(users));

        alert("🎉 Đăng ký thành công!");

        window.location.href = "login.html";
    };

}

// ===================== ĐĂNG NHẬP =====================

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {

    loginBtn.onclick = () => {

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        const users = JSON.parse(localStorage.getItem("mymyUsers")) || [];

        const user = users.find(u =>
            u.email === email &&
            u.password === password
        );

        if (!user) {
            alert("❌ Sai email hoặc mật khẩu.");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));

        window.location.href = "index.html";
    };

}