
                // 네비게이션 스크립트
    document.addEventListener("DOMContentLoaded", function () {
        fetch("http://58.127.241.84:60119/api/member/status", {
                method: "GET",
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

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("qnaForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // 기본 제출 동작 방지

        const formData = new FormData(form);
        
        // ✅ 비밀글 체크 여부를 명확하게 설정 (체크 안 하면 'false' 기본값 추가)
        let isSecretValue = document.getElementById("private").checked ? "true" : "false";
        formData.set("isSecret", isSecretValue);  // 기존 append 대신 set 사용
        console.log("🔥 [DEBUG] isSecret 값:", isSecretValue);  // ✅ 디버깅 로그 추가
 
        fetch("http://58.127.241.84:60119/api/qna/create", {
            method: "POST",
            body: formData,
	    credentials:"include"
        })
        .then(response => response.json())  // ✅ JSON 응답 받기
        .then(data => {
            console.log("🔥 [DEBUG] API 응답:", data);
            if (data.redirect_url) {
                window.location.href = data.redirect_url;  // ✅ 목록 페이지로 이동
            } else {
                alert("문의 등록 실패: " + data.error);
            }
        })
        .catch(error => console.error("에러 발생:", error));
    });
});
