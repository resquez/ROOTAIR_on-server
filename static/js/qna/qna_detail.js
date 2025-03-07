const urlParams = new URLSearchParams(window.location.search);
const qnaId = urlParams.get("id");
console.log("qnaId:", qnaId);
let currentUserId=null;
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
			currentUserId=data.user_id;
                       console.log("🔥 로그인한 사용자 ID:", currentUserId);
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
		loadQnaDetail();
            })
            .catch(error => console.error("사용자 상태 확인 중 오류 발생:", error));
    });

// ✅ (추가) 상세 데이터 로드 함수 분리
function loadQnaDetail() {
	console.log("🔥 loadQnaDetail 실행됨");
    console.log("🔥 현재 currentUserId:", currentUserId);

    if (!qnaId) {
        alert("문의사항 ID가 없습니다.");
        return;
    }

    fetch(`http://58.127.241.84:60119/api/qna/detail/${qnaId}`, {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById("qna_title").innerText = data.title;
        document.getElementById("qna_content").innerText = data.content;
        document.getElementById("qna_user").innerText = data.user_id;
        document.getElementById("qna_date").innerText = data.created_at;

        // ✅ (추가) 로그인한 사용자와 작성자가 같으면 수정/삭제 버튼 보여줌
        if (currentUserId && currentUserId === data.user_id) {
        console.log("✅ 본인 글입니다! 버튼을 보여줍니다.");
        const editBtn = document.getElementById("editBtn");
        const deleteBtn = document.getElementById("deleteBtn");
        
        if (editBtn && deleteBtn) {
            editBtn.style.display = "inline-block";
            deleteBtn.style.display = "inline-block";
            deleteBtn.setAttribute("data-qna-id", qnaId);
        } else {
            console.log("❌ 버튼이 HTML에 없음!");
        }
    } else{
	console.log(" 본인 글이 아님 또는 currentUserId 없음");
    }
        if (data.file_url) {
            const fileSection = document.getElementById("file_section");
            const downloadLink = document.getElementById("download_link");
            fileSection.style.display = "inline";
            downloadLink.href = data.file_url;
        }
    })
    .catch(error => {
        console.error("문의사항 상세 불러오기 오류:", error);
        alert("문의사항을 불러오는 중 오류가 발생했습니다.");
    });
}

//  관리자 답변
document.addEventListener("DOMContentLoaded", function () {
//    const isAdmin = true;  // ✅ JavaScript에서는 `true`로 써야 함
    const answerBtn = document.getElementById("answerBtn");
    const replyInput = document.getElementById("admin_reply_input");
    const replyText = document.getElementById("admin_reply_text");
   // const qnaId = urlParams.get('id');

    // ✅ 관리자일 경우 textarea와 버튼 보이게 설정

    fetch("http://58.127.241.84:60119/api/member/status", {  // ⭐️ 관리자 여부 체크
            method: "GET",
            credentials: "include"
        })
        .then(response => response.json())
        .then(data => {
            if (data.is_admin) {  // ⭐️ 관리자면 버튼, 입력창 보여주기
                replyInput.style.display = "block";
                answerBtn.style.display = "block";
            }
        });    fetch("http://58.127.241.84:60119/api/member/status", {  // ⭐️ 관리자 여부 체크
            method: "GET",
            credentials: "include"
        })
        .then(response => response.json())
        .then(data => {
            if (data.is_admin) {  // ⭐️ 관리자면 버튼, 입력창 보여주기
                replyInput.style.display = "block";
                answerBtn.style.display = "block";
            }
        });

    // ✅ "답변 등록" 버튼 클릭 이벤트
    if (answerBtn) {
        answerBtn.addEventListener("click", function () {
            if (!qnaId) {
                alert("문의 ID를 찾을 수 없습니다.");
                return;
            }

            const comment = replyInput.value.trim();
            if (!comment) {
                alert("답변을 입력하세요.");
                return;
            }

            fetch(`http://58.127.241.84:60119/api/qna/comment/${qnaId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: comment })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);  // ✅ 성공 메시지 알림
                    replyText.textContent = data.comment; // ✅ UI 업데이트
                    replyInput.value = ""; // ✅ 입력창 초기화
                } else {
                    alert("답변 등록 실패: " + (data.error || "알 수 없는 오류"));
                }
            })
            .catch(error => console.error("답변 등록 중 오류 발생:", error));
        });
    }
});


// 문의사항 삭제
document.addEventListener("DOMContentLoaded", function () {
    const deleteBtn = document.getElementById("deleteBtn");
    const editBtn = document.getElementById("editBtn");
    const urlParams = new URLSearchParams(window.location.search);
    const qnaId = urlParams.get('id');

    if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
            if (!confirm("정말로 이 문의사항을 삭제하시겠습니까?")) {
                return;
            }

            fetch(`http://58.127.241.84:60119/api/qna/delete/${qnaId}`, {
                method: "DELETE"
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
		   window.location.href = "http://58.127.241.84:61080/qna/qna.html";
                } else {
                    alert("삭제 실패: " + (data.error || "알 수 없는 오류"));
                }
            })
            .catch(error => console.error("삭제 중 오류 발생:", error));
        });
    }

    if (editBtn) {
        editBtn.addEventListener("click", function () {
            window.location.href = `qna_edit.html?id=${qnaId}`;
        });
    }
});


// 목록보기 버튼
document.addEventListener("DOMContentLoaded", function () {
    const backBtn = document.getElementById("backBtn");

    if (backBtn) {
        backBtn.addEventListener("click", function () {
            window.location.href = "http://58.127.241.84:61080/qna/qna.html";  // ✅ 목록 페이지 URL로 변경
        });
    }
});


