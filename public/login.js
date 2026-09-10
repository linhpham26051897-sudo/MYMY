document.getElementById("loginBtn").onclick = () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const users = JSON.parse(localStorage.getItem("mymyUsers")) || [];

    const user = users.find(u =>
        u.email === email &&
        u.password === password
    );

    if (!user) {
        alert("Sai email hoặc mật khẩu.");
        return;
    }

    // Lưu người đang đăng nhập
    localStorage.setItem("currentUser", JSON.stringify(user));

    window.location.href = "home.html";

};