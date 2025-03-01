

// step 1
async function requestResetCode() {
    const userId = document.getElementById("user_id").value;

    if (!userId) {
        document.getElementById("step1Message").textContent = "아이디를 입력하세요.";
        return;
    }

    const response = await fetch('http://58.127.241.84:60119/api/member/request-reset-code', {  // ✅ 엔드포인트 변경
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    });

    const result = await response.json();
    document.getElementById("step1Message").textContent = result.message;

    if (result.success) {
        document.getElementById("step1_form").classList.add("hidden");
        document.getElementById("step2_form").classList.remove("hidden");
    }
}

//step 2
async function verifyResetCode() {
    const otp = document.getElementById("otp").value;

    if (!otp) {
        document.getElementById("step2Message").textContent = "인증 코드를 입력하세요.";
        return;
    }

    const response = await fetch('http://58.127.241.84:60119/api/member/verify-reset-code', {  // ✅ 엔드포인트 변경
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
    });

    const result = await response.json();
    document.getElementById("step2Message").textContent = result.message;

    if (result.success) {
        document.getElementById("step2_form").classList.add("hidden");
        document.getElementById("step3_form").classList.remove("hidden");
    }
}

async function resetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById("new_password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    if (!newPassword || !confirmPassword) {
        document.getElementById("step3Message").textContent = "비밀번호를 입력하세요.";
        return;
    }

    if (newPassword !== confirmPassword) {
        document.getElementById("step3Message").textContent = "비밀번호가 일치하지 않습니다.";
        return;
    }

    const response = await fetch('http://58.127.241.84:60119/api/member/reset-password', {  // ✅ 엔드포인트 변경
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
    });

    const result = await response.json();
    document.getElementById("step3Message").textContent = result.message;

    if (result.success) {
        alert("비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/login"; // 로그인 페이지로 이동
    }
}

// 폼 이벤트 리스너 추가
document.getElementById("step3_form").addEventListener("submit", resetPassword);

