const togglebtn = document.querySelector('.navbar_togglebtn');
const menu = document.querySelector('.navbar_menu');
const member = document.querySelector('.navbar_member');

togglebtn.addEventListener('click', ()=>{
    menu.classList.toggle('active');
    member.classList.toggle('active');
});
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("qnaForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // 기본 제출 동작 방지

        const formData = new FormData(form);
        

        fetch("http://58.127.241.84:60119/api/notices/create", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())  // ✅ JSON 응답 받기
        .then(data => {
            if (data.redirect_url) {
                window.location.href = data.redirect_url;  // ✅ 목록 페이지로 이동
            } else {
                alert("공지 등록 실패: " + data.error);
            }
        })
        .catch(error => console.error("에러 발생:", error));
    });
});