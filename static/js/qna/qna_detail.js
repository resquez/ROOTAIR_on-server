const togglebtn = document.querySelector('.navbar_togglebtn');
const menu = document.querySelector('.navbar_menu');
const member = document.querySelector('.navbar_member');

togglebtn.addEventListener('click', ()=>{
    menu.classList.toggle('active');
    member.classList.toggle('active');
});
document.addEventListener("DOMContentLoaded", function () {
    const isAdmin = true;  // ✅ JavaScript에서는 `true`로 써야 함
    const answerBtn = document.getElementById("answerBtn");
    const replyInput = document.getElementById("admin_reply_input");
    const replyText = document.getElementById("admin_reply_text");
    const qnaId = answerBtn ? answerBtn.getAttribute("data-qna-id") : null;

    // ✅ 관리자일 경우 textarea와 버튼 보이게 설정
    if (isAdmin) {
        replyInput.style.display = "block";  // ✅ textarea 보이도록 설정
        answerBtn.style.display = "block";  // ✅ 버튼 보이도록 설정
    }

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

document.addEventListener("DOMContentLoaded", function () {
    const deleteBtn = document.getElementById("deleteBtn");

    if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
            const qnaId = this.getAttribute("data-qna-id");

            if (!confirm("정말로 이 문의사항을 삭제하시겠습니까?")) {
                return; // 사용자가 취소하면 삭제하지 않음
            }

            fetch(`http://58.127.241.84:60119/api/qna/delete/${qnaId}`, {
                method: "DELETE"
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    window.location.href = data.redirect_url; // 삭제 후 목록 페이지로 이동
                } else {
                    alert("삭제 실패: " + (data.error || "알 수 없는 오류"));
                }
            })
            .catch(error => console.error("삭제 중 오류 발생:", error));
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const answerBtn = document.getElementById("answerBtn");
    const replyInput = document.getElementById("admin_reply_input");
    const replyText = document.getElementById("admin_reply_text");

    if (answerBtn) {
        answerBtn.addEventListener("click", function () {
            const qnaId = this.getAttribute("data-qna-id");
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
                    alert(data.message);
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

document.addEventListener("DOMContentLoaded", function () {
    const answerBtn = document.getElementById("answerBtn");
    const replyInput = document.getElementById("admin_reply_input");
    const replyText = document.getElementById("admin_reply_text");

    if (answerBtn) {
        answerBtn.addEventListener("click", function () {
            const qnaId = this.getAttribute("data-qna-id");
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
