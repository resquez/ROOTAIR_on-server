
document.addEventListener("DOMContentLoaded", function () {
    fetch("http://58.127.241.84:60119/api/member/status", {
        method: "GET",
        credentials: "include"
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

// 작성 
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("noticeForm");

    if (!form) {
        console.error("❌ 공지 등록 폼을 찾을 수 없습니다! (ID 확인 필요)");
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // ✅ 기본 제출 동작 방지

        const formData = new FormData(form); // ✅ 폼 데이터 가져오기

        // ✅ 서버로 공지사항 등록 요청
        fetch("http://58.127.241.84:60119/api/notices/create", {
            method: "POST",
            credentials: "include",  // ✅ 세션 유지 (로그인 상태 확인)
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("서버 응답 오류");
            }
            return response.json();
        })
        .then(data => {
            console.log("✅ 서버 응답:", data);

            if (data.redirect_url) {
                alert("공지 등록 성공!");
		window.location.href = "http://58.127.241.84:61080/notices/notices.html";
            } else {
                alert("공지 등록 실패: " + (data.error || "알 수 없는 오류"));
            }
        })
        .catch(error => {
            console.error("❌ 공지 등록 중 오류 발생:", error);
            alert("공지 등록에 실패했습니다.");
        });
    });
});
