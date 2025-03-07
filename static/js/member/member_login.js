
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


document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault(); // 폼 제출 기본 동작 방지

    const userId = document.getElementById("user_id").value;
    const password = document.getElementById("password").value;

    fetch("http://58.127.241.84:60119/api/member/login", {
        method: "POST", 
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, password: password })
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
