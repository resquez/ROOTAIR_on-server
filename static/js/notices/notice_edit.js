document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("noticeForm");
    let isSubmitting = false; // ✅ 중복 제출 방지 변수 추가

    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // ✅ 기본 제출 방지

            if (isSubmitting) return; // ✅ 이미 제출 중이면 중단
            isSubmitting = true; // ✅ 중복 방지 활성화

            const formData = new FormData(form);
            const noticeId = form.getAttribute("data-notice-id");

            if (!noticeId) {
                isSubmitting = false; // ✅ 중복 방지 해제
                return;
            }

            fetch(`http://58.127.241.84:60119/api/notices/edit/${noticeId}`, {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.redirect_url) {
                    window.location.href = data.redirect_url; // ✅ 알림창 없이 자동 이동
                }
            })
            .catch(error => {
                console.error("공지 수정 중 오류 발생:", error);
            })
            .finally(() => {
                isSubmitting = false; // ✅ 요청이 끝나면 다시 제출 가능하도록 설정
            });
        });
    }
});

const togglebtn = document.querySelector('.navbar_togglebtn');
const menu = document.querySelector('.navbar_menu');
const member = document.querySelector('.navbar_member');

togglebtn.addEventListener('click', ()=>{
    menu.classList.toggle('active');
    member.classList.toggle('active');
});