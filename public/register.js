document.getElementById("registerBtn").onclick = () => {

    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (!fullname || !username || !email || !password || !confirm) {
        alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    if (password !== confirm) {
        alert("Mật khẩu nhập lại không khớp.");
        return;
    }

    // Kiểm tra email đã tồn tại chưa
    const users = JSON.parse(localStorage.getItem("mymyUsers")) || [];

    const existed = users.find(user => user.email === email);

    if (existed) {
        alert("Email đã được đăng ký.");
        return;
    }

    users.push({
        fullname,
        username,
        email,
        password
    });

    localStorage.setItem("mymyUsers", JSON.stringify(users));

    alert("🎉 Đăng ký thành công!");

    window.location.href = "login.html";
};