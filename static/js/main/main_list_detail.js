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
    const passengerCountInput = document.getElementById("passengerCount");
    const passengerTableBody = document.getElementById("passengerTableBody");
    const bookingForm = document.getElementById("bookingForm"); // ✅ form 요소 가져오기

    // ✅ URL에서 `passenger_count` 값을 가져와 hidden input에 적용
    const urlParams = new URLSearchParams(window.location.search);
    const passengerCountParam = urlParams.get('passenger_count');
    if (passengerCountParam) {
        passengerCountInput.value = passengerCountParam;
    }

    function updatePassengerFields(count) {
        passengerTableBody.innerHTML = ""; // 기존 입력 필드 초기화

        for (let i = 0; i < count; i++) {
            const row = document.createElement("tr");

            let nameCell = document.createElement("td");
            let nameInput = document.createElement("input");
            nameInput.setAttribute("type", "text");
            nameInput.setAttribute("name", "eng_name[]");
            nameInput.setAttribute("placeholder", "여권 영문명을 입력하세요");
            nameInput.setAttribute("required", "true");
            nameCell.appendChild(nameInput);

            let genderCell = document.createElement("td");
            let genderSelect = document.createElement("select");
            genderSelect.setAttribute("name", "gender[]");

            let optionMale = document.createElement("option");
            optionMale.value = "남";
            optionMale.textContent = "남";
            let optionFemale = document.createElement("option");
            optionFemale.value = "여";
            optionFemale.textContent = "여";

            genderSelect.appendChild(optionMale);
            genderSelect.appendChild(optionFemale);
            genderCell.appendChild(genderSelect);

            let birthdateCell = document.createElement("td");
            let birthdateInput = document.createElement("input");
            birthdateInput.setAttribute("type", "text");
            birthdateInput.setAttribute("name", "birthdate[]");
            birthdateInput.setAttribute("placeholder", "YYYYMMDD");
            birthdateCell.appendChild(birthdateInput);

            row.appendChild(nameCell);
            row.appendChild(genderCell);
            row.appendChild(birthdateCell);

            passengerTableBody.appendChild(row);
        }
    }

    // 🚀 탑승객 수를 가져와 동적으로 입력칸 생성
    let passengerCount = parseInt(passengerCountInput.value) || 1;
    updatePassengerFields(passengerCount);


    bookingForm.addEventListener("submit", function (event) {
        event.preventDefault(); // 기본 form 제출 방지

        // ✅ 폼에서 입력된 데이터 가져오기
        const flightId = document.getElementById("flightId").value;
        const passengerCount = document.getElementById("passenger_count");
        const engNames = Array.from(document.querySelectorAll("input[name='eng_name[]']"))
                             .map(input => input.value.trim())
                             .filter(name => name !== ""); // 빈 값 제거

        // ✅ 필수 입력값 확인
        if (!flightId || engNames.length === 0) {
            alert("항공편 ID 및 모든 탑승객의 영문명을 입력해주세요.");
            return;
        }

        // ✅ fetch를 사용하여 `POST` 요청 보내기
console.log("📢 [JS] API 요청 시작: POST http://58.127.241.84:60119/api/main/book");
fetch("http://58.127.241.84:60119/api/main/book", {
    method: "POST",
    credentials: "include",  // ✅ 인증 쿠키 포함!
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        flight_id: parseInt(flightId),
        eng_name: Array.isArray(engNames) ? engNames : [engNames],
    })
})
.then(response => {
    if (response.status === 401) { // ✅ 이 코드가 핵심입니다.
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/member/member_login";  // 🔥 로그인 페이지 경로로 이동
        return;
    }
    if (!response.ok) {
        return response.text().then(text => {
            throw new Error(`서버 응답 오류: ${response.status} - ${text}`);
        });
    }
    return response.json();
})
.then(data => {
    if (data.error) {
        alert(`예약 실패: ${data.error}`);
        return;
    }
    console.log("📢 [JS] API 응답 데이터:", data);
	// ✅ flight_id와 passenger_names를 localStorage에 저장
        localStorage.setItem("selected_flight_id", flightId);
        localStorage.setItem("passenger_names", JSON.stringify(engNames));
        
        window.location.href = data.redirect_url;
})
.catch(error => {  // ✅ 오류 발생 시 예외 처리 추가
    console.error("🚨 [JS] 예약 요청 중 오류 발생:", error);
});
});
});
// ✅ 항공편 상세 정보 가져오기
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get("flight_id"); // ✅ `flight_id` 가져오기
    const passengers = urlParams.get("passenger_count") || 1; // ✅ `passenger_count` 가져오기

    // ✅ `flight_id`가 없으면 목록 페이지로 이동
    if (!flightId) {
        alert("항공편 ID가 없습니다.");
        window.location.href = "http://58.127.241.84:61080/main/main_list.html";
        return;
    }

    // ✅ API 요청 URL 생성
    const apiUrl = `http://58.127.241.84:60119/api/main/list/detail/${flightId}?passengers=${passengers}`;
    console.log("API 요청 URL:", apiUrl); // ✅ URL 확인

    // ✅ `fetch`를 사용하여 항공편 정보 가져오기
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert("항공편 정보를 찾을 수 없습니다.");
                window.location.href = "http://58.127.241.84:61080/main/main_list.html";
                return;
            }

            // ✅ 가져온 데이터를 HTML 요소에 적용
           // document.getElementById("departure-date").textContent = data.departure_time;
            document.getElementById("seat-class").textContent = data.seat_class;
            document.getElementById("departure-airport").textContent = data.departure_airport;
            document.getElementById("departure-code").textContent = data.departure_code || "";
            document.getElementById("arrival-airport").textContent = data.arrival_airport;
            document.getElementById("arrival-code").textContent = data.arrival_code || "";
            document.getElementById("departure-time").textContent = data.departure_time;
            document.getElementById("arrival-time").textContent = data.arrival_time;
            document.getElementById("flight-name").textContent = data.airplane_name;
            document.getElementById("flightId").value = flightId;
            document.getElementById("passengerCount").value = passengers;
        })
        .catch(error => console.error("항공편 데이터 로드 오류:", error));
});
