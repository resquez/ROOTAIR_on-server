
// 로그인 함수
document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault(); // 폼 제출 기본 동작 방지

    const userId = document.getElementById("user_id").value;
    const password = document.getElementById("password").value;

    fetch("http://58.127.241.84:60119/api/member/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, password: password }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            if (data.message === "Login successful") {  
                alert("로그인 성공!");
                // 로그인 성공 후 메인 페이지로 리다이렉트
                window.location.href = "/main";
            } else {
                alert(data.error || "로그인 실패");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("로그인 중 오류가 발생했습니다.");
        });
});
