document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 JavaScript 로드 완료!");

    // ✅ 회원 탈퇴 폼 제출 이벤트 확인용 로그 추가
    const passwordForm = document.getElementById("passwordForm");
    if (!passwordForm) {
        console.error("❌ 회원 탈퇴 폼을 찾을 수 없습니다.");
        return;
    }

    passwordForm.addEventListener("submit", function (event) {
        event.preventDefault(); // 기본 제출 동작 방지

        console.log("📌 회원 탈퇴 버튼 클릭됨!"); // 버튼 클릭 여부 확인

        const passwordInput = document.getElementById("password").value.trim();
        const errorMessage = document.getElementById("error-message");

        if (!passwordInput) {
            errorMessage.textContent = "비밀번호를 입력하세요.";
            errorMessage.style.display = "block";
            return;
        }

        fetch("http://58.127.241.84:60119/api/mypage/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ password: passwordInput })
        })
        .then(response => response.json())
        .then(data => {
            console.log("📌 회원 탈퇴 응답:", data);
            if (data.success) {
                alert("회원 탈퇴가 완료되었습니다.");
                window.location.href = "http://58.127.241.84:61080/main/main.html"; // 메인 페이지로 이동
            } else {
                errorMessage.textContent = data.error || "비밀번호가 일치하지 않습니다.";
                errorMessage.style.display = "block";
            }
        })
        .catch(error => {
            console.error("❌ 회원 탈퇴 중 오류 발생:", error);
            errorMessage.textContent = "요청 처리 중 오류가 발생했습니다.";
            errorMessage.style.display = "block";
        });
    });
});
