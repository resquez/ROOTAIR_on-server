

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
            $('#result').text('인증이 완료되었습니다. 회원가입 페이지로 이동합니다.');
            setTimeout(() => {
                window.location.href = response.redirect_url;
            }, 2000);
        },
        error: function(xhr) {
            $('#result').text('오류: ' + (xhr.responseJSON ? xhr.responseJSON.error : '알 수 없는 오류가 발생했습니다.'));
        }
    });
}

function requestVerification() {
const email = $('#email').val();
if (!email) {
    $('#result').text('이메일 주소를 입력해주세요.');
    return;
}
$.ajax({
    url: '/member/request-verification',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ email: email }),
    success: function(response) {
        $('#result').text('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
        $('#otpSection').removeClass('hidden');
    },
    error: function(xhr) {
        if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.error === "Email already registered") {
            $('#result').text('이미 등록된 이메일 주소입니다.');
        } else {
            $('#result').text('오류: ' + (xhr.responseJSON ? xhr.responseJSON.error : '알 수 없는 오류가 발생했습니다.'));
        }
    }
});
}