document.addEventListener("DOMContentLoaded", function () {
  const passwordForm = document.getElementById("passwordForm");
  const errorMessage = document.getElementById("error-message");

  passwordForm.addEventListener("submit", function (event) {
      event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

      const inputPassword = document.getElementById("password").value;

      fetch('http://58.127.241.84:60119/api/mypage/cancel', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ password: inputPassword })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert(data.message);
              window.location.href = '/main';
          } else {
              errorMessage.textContent = data.error || "오류가 발생했습니다.";
              errorMessage.style.display = "block";
          }
      })
      .catch(error => {
          console.error('오류 발생:', error);
          errorMessage.textContent = "요청 처리 중 오류가 발생했습니다.";
          errorMessage.style.display = "block";
      });
  });
});