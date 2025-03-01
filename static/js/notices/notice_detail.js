

// ✅ 목록으로 돌아가는 함수
function goBack() {
    window.location.href = "/notices";  // 공지사항 목록 페이지로 이동
}
function goedit() {
    const noticeId = document.getElementById("editBtn").getAttribute("data-notice-id");

    if (!noticeId) {
        alert("공지사항 ID를 찾을 수 없습니다.");
        return;
}

    window.location.href = `/notices/edit/${noticeId}`; // ✅ 공지사항 수정 페이지로 이동
}


//삭제
document.addEventListener("DOMContentLoaded", function() {
    const deleteBtn = document.getElementById("deleteBtn");

    if (deleteBtn) {
        deleteBtn.addEventListener("click", function() {
            const noticeId = deleteBtn.getAttribute("data-notice-id"); // HTML에서 ID 가져오기

            if (!noticeId) {
                alert("공지사항 ID를 찾을 수 없습니다.");
                return;
            }

            if (confirm("정말 삭제하시겠습니까?")) {
                fetch(`http://58.127.241.84:60119/api/notices/delete/${noticeId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                        window.location.href = data.redirect_url;
                    } else {
                        alert("삭제에 실패했습니다.");
                    }
                })
                .catch(error => {
                    console.error("삭제 오류:", error);
                    alert("오류가 발생했습니다. 다시 시도해주세요.");
                });
            }
        });
    }
});
