// 네비게이션 스크립트
document.addEventListener("DOMContentLoaded", function () {
    fetch("http://58.127.241.84:60119/api/member/status", {
            mcdethod: "GET",
            credentials:"include"
        })
        .then(response => response.json())
        .then(data => {
            const navbarMember = document.getElementById("navbar_member");
            navbarMember.innerHTML = "";  // 기존 내용 초기화
            if (data.is_authenticated) {
                if (data.is_admin) {
                    // ✅ 관리자 계정
                    navbarMember.innerHTML = `
                        <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                        <li class="navbar_login"><a href="http://58.127.241.84:61080/admin/admin_man.html">회원정보</a></li>
                    `;
                } else {
                    // ✅ 일반 로그인 사용자
                    navbarMember.innerHTML = `
                        <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                        <li class="navbar_login"><a href="http://58.127.241.84:61080/mypage/mypage.html">마이페이지</a></li>
                    `;
                }
            } else {
                // ✅ 비로그인 상태
                navbarMember.innerHTML = `
                    <li class="navbar_signup"><a href="http://58.127.241.84:61080/member/member_email.html">회원가입</a></li>
                    <li class="navbar_login"><a href="http://58.127.241.84:61080/member/member_login.html">로그인</a></li>
                `;
            }
        })
        .catch(error => console.error("사용자 상태 확인 중 오류 발생:", error));
});



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
        body: JSON.stringify({ user_id: userId }),
        credentials: "include"
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
        body: JSON.stringify({ otp }),
        credentials: "include"
    });

    const result = await response.json();
    document.getElementById("step2Message").textContent = result.message;

    if (result.success) {
        document.getElementById("step2_form").classList.add("hidden");
        document.getElementById("step3_form").classList.remove("hidden");
    }
}

//step 3
const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;

async function resetPassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById("new_password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const message = document.getElementById("step3Message");
    const newPwButton = document.getElementById("newpw");

    // 초기 상태 설정
    message.textContent = "";
    message.style.display = "none";
    message.style.color = "inherit";

    // 비밀번호 입력하지 않음
    if (!newPassword || !confirmPassword) {
        message.textContent = "비밀번호를 입력하세요.";
        message.style.display = "block";
        message.style.color = "red";
        return;
    }
    // 비밀번호 확인란과 일치하지 않음
    else if (newPassword !== confirmPassword) {
        message.textContent = "비밀번호가 일치하지 않습니다.";
        message.style.display = "block";
        message.style.color = "red";
        return;
    }
    // 비밀번호 정규식 검사
    else if (!passwordPattern.test(newPassword)) {
        message.textContent = "비밀번호는 8~20자이며, 영문, 숫자, 특수문자를 최소 1개씩 포함해야 합니다.";
        message.style.display = "block";
        message.style.color = "red";
        return;
    }
    // 모든 조건 충족 → API로 비밀번호 전송
    else {
        message.textContent = "✅ 비밀번보를 수정합니다.";
        message.style.display = "block";
        message.style.color = "green";
        newPwButton.disabled = true; // 중복 요청 방지
        // ✅ 비밀번호 전송 함수 실행
        sendnewpassword(newPassword);
    }
}

// 폼 이벤트 리스너 추가
document.getElementById("step3_form").addEventListener("submit", resetPassword); 

// 전송
async function sendnewpassword(newPassword) {
    try {
        const response = await fetch('http://58.127.241.84:60119/api/member/reset-password', {  // ✅ 엔드포인트 변경
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
                        'Accept': 'application/json'
            },
            body: JSON.stringify({ new_password: newPassword }),
            credentials: "include"
        });

        const result = await response.json();
        document.getElementById("step3Message").textContent = result.message;

        if (result.success) {
            alert("비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.");
            window.location.href = "/member/member_login.html"; // 로그인 페이지로 이동
        }
    } catch (error) {
        console.error("🚨 요청 중 오류 발생:", error);  // ✅ 오류 로그 추가
        document.getElementById("step3Message").textContent = "서버와의 통신 중 오류가 발생했습니다.";
    }
}
