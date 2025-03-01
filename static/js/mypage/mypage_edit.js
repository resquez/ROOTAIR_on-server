


// 주소찾기 API (Daum Postcode API) 추가
document.getElementById('findAddressBtn').addEventListener('click', function() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 우편번호와 도로명 주소 또는 지번 주소를 해당 input에 설정
            document.getElementById('postcode').value = data.zonecode;
            document.getElementById('address').value = data.roadAddress || data.jibunAddress;
        }
    }).open();
});

document.addEventListener("DOMContentLoaded", function() {
    const Edit_memberinfoForm = document.getElementById("Edit_memberinfoForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const updateBtn = document.getElementById("updateBtn");

    // 비밀번호 유효성 검사: 비밀번호 입력 시
    passwordInput.addEventListener("input", function() {
        if (passwordInput.value !== "") {
            // 영문, 숫자, 특수문자 포함 8~20자 검사
            const isValid = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/.test(passwordInput.value);
            if (!isValid) {
                passwordError.style.display = "block";
                passwordError.innerText = "비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자로 설정해야 합니다.";
            } else {
                passwordError.style.display = "none";
            }
        } else {
            passwordError.style.display = "none";
        }
    });

    // 비밀번호 확인 검사: 확인 입력 시
    confirmPasswordInput.addEventListener("input", function() {
        if (passwordInput.value !== "") {
            if (confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordError.style.display = "block";
                confirmPasswordError.innerText = "비밀번호가 일치하지 않습니다.";
            } else {
                confirmPasswordError.style.display = "none";
            }
        } else {
            confirmPasswordError.style.display = "none";
        }
    });

    // 수정 버튼 클릭 시 업데이트 처리
    updateBtn.addEventListener("click", function(event) {
        event.preventDefault();

        let updatingPassword = false;
        // 비밀번호 또는 확인 필드에 값이 있으면 비밀번호 업데이트 시도
        if (passwordInput.value !== "" || confirmPasswordInput.value !== "") {
            if (passwordInput.value !== confirmPasswordInput.value) {
                alert("비밀번호가 일치하지 않습니다.");
                return;
            }
            updatingPassword = true;
        }

        // 폼 데이터 수집
        const formData = new URLSearchParams();
        let hasData = false;

        if (updatingPassword) {
            formData.append("password", passwordInput.value);
            formData.append("confirm_password", confirmPasswordInput.value);
            hasData = true;
        }

        const extraAddress = document.getElementById("extra_address").value.trim();
        if (extraAddress !== "") {
            formData.append("extra_address", extraAddress);
            hasData = true;
        }
        
        // 주소찾기 API로 채워진 우편번호와 주소 수집
        const postalCode = document.getElementById("postcode").value.trim();
        if (postalCode !== "") {
            formData.append("postal_code", postalCode);
            hasData = true;
        }
        const address = document.getElementById("address").value.trim();
        if (address !== "") {
            formData.append("address", address);
            hasData = true;
        }

        if (!hasData) {
            alert("업데이트할 내용이 없습니다.");
            return;
        }

        // AJAX 요청: 백엔드의 '/mypage/edit' 엔드포인트에 POST 요청
        fetch('http://58.127.241.84:60119/api/mypage/edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("회원정보가 성공적으로 업데이트되었습니다.");
                window.location.href = '/mypage/';
            } else {
                alert("업데이트 실패: " + data.message);
            }
        })
        .catch(error => {
            console.error("업데이트 중 오류 발생:", error);
            alert("업데이트 처리 중 오류가 발생했습니다.");
        });
    });
});
