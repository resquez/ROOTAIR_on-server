
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


document.getElementById("verifyButton").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const otp = document.getElementById("otp").value;

    if (!email || !otp) {
        alert("이메일과 인증 코드를 입력하세요.");
        return;
    }

    fetch("http://58.127.241.84:60119/api/member/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",  // 🔹 세션 유지 필수
        body: JSON.stringify({ email: email, otp: otp })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("이메일 인증 성공!");
            window.location.href = data.redirect_url;  // 🔹 회원가입 페이지로 이동
        } else {
            alert("인증 실패: " + data.error);
        }
    })
    .catch(error => console.error("이메일 인증 오류:", error));
});


function requestVerification() {
    const email = $('#email').val();
    if (!email) {
        $('#result').text('이메일 주소를 입력해주세요.');
        return;
    }
    $.ajax({
        url: 'http://58.127.241.84:60119/api/member/request-verification',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email: email }),
        xhrFields: {withCredentials: true},
        success: function(response) {
            $('#result').text('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
            $('#otpSection').removeClass('hidden');
        },
        error: function(xhr) {
            $('#result').text('오류: ' + (xhr.responseJSON ? xhr.responseJSON.error : '알 수 없는 오류가 발생했습니다.'));
        }
    });
}

function verifyOTP() {
    const email = $('#email').val();
    const otp = $('#otp').val();
    if (!email || !otp) {
        $('#result').text('이메일 주소와 인증 코드를 모두 입력해주세요.');
        return;
    }

    $.ajax({
        url: 'http://58.127.241.84:60119/api/member/verify',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email: email, otp: otp }),
        success: function(response) {
	    console.log("서버응답:", response);
            $('#result').text('인증이 완료되었습니다. 회원가입 페이지로 이동합니다.');
           
           // ✅ 이메일을 localStorage에 저장
            localStorage.setItem("verified_email", email);

            setTimeout(() => {
                window.location.href = response.redirect_url;
            }, 2000);
        },
        error: function(xhr) {
            $('#result').text('오류: ' + (xhr.responseJSON ? xhr.responseJSON.error : '알 수 없는 오류가 발생했습니다.'));
        }
    });
}
$(document).ready(function() {
    $.ajax({
        url:'http://58.127.241.84:60119/api/member/get_verified_email', // Flask 백엔드 주소
        method: 'GET',
        xhrFields: { withCredentials: true },  // 세션 유지 필수
        success: function(response) {
            if (response.email) {
                $('#email').val(response.email); // 이메일 입력 필드에 자동 입력
            }
        },
        error: function(xhr) {
            console.log("이메일 자동 입력 실패:", xhr.responseJSON ? xhr.responseJSON.error : "알 수 없는 오류");
        }
    });
});

