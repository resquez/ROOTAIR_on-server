
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


let currentFlight = 1;
let flights = []; // ✅ 전역 변수 선언 (fetch 요청 후 데이터를 저장할 배열)

// 항공편 제목 변경하는 함수
function updateFlightTitle() {
    const flightTitleElement = document.getElementById("flightTitle");
    if (flightTitleElement) {
        flightTitleElement.textContent = `FLIGHT_0${currentFlight}`;
    }
}

// 항공권 목록을 추가할 컨테이너
const flightList = document.querySelector(".flight-list");

// 기존 flights 변수를 서버에서 전달받은 데이터로 대체
function renderFlights() {
    if (!flightList) return; // ✅ flightList 요소가 없으면 실행하지 않음

    flightList.innerHTML = ""; // 기존 목록 초기화

    flights.forEach((flight, index) => {
        const flightItem = document.createElement("div");
        flightItem.classList.add("flight-item");

        flightItem.innerHTML = `
            <div class="flight-info">
                <div>
                    <p>${flight.departure_time}</p>
                    <p class="flight-time">${flight.departure_airport} ✈ ${flight.arrival_airport}</p>
                </div>
                <div>
                    <p>${flight.seat_class}</p>
                    <p class="flight-price">${Number(flight.price).toLocaleString("ko-KR")}원</p>
                </div>
            </div>
            <input type="checkbox" class="flight-checkbox" data-flight-id="${flight.flight_id}">
        `;

        flightList.appendChild(flightItem);
        // ✅ 체크박스 하나만 선택 가능하도록 이벤트 리스너 추가
        const checkbox = flightItem.querySelector(".flight-checkbox");
        checkbox.addEventListener("change", checkOneCheckbox);
    });
}
// ✅ 체크박스를 하나만 선택하도록 하는 함수
function checkOneCheckbox(event) {
    // 모든 체크박스를 가져옴
    const checkboxes = document.querySelectorAll(".flight-checkbox");

    // 현재 클릭한 체크박스를 제외한 나머지를 해제
    checkboxes.forEach(checkbox => {
        if (checkbox !== event.target) {
            checkbox.checked = false;
        }
    });
}

// 화살표 버튼 클릭 이벤트
document.querySelector(".arrow-btn.right")?.addEventListener("click", () => {
    if (currentFlight < 5) {
        currentFlight++;
    } else {
        currentFlight = 1; // 다시 FLIGHT_01로 되돌아감
    }
    updateFlightTitle();
    renderFlights();
});

document.querySelector(".arrow-btn.left")?.addEventListener("click", () => {
    if (currentFlight > 1) {
        currentFlight--;
    } else {
        currentFlight = 5; // 마지막 FLIGHT로 되돌아감
    }
    updateFlightTitle();
    renderFlights();
});

// 페이지 로드 시 항공권 목록 표시
document.addEventListener("DOMContentLoaded", () => {
    updateFlightTitle();
});

// 항공편 선택 후 상세 페이지 이동 (fetch 사용)
document.querySelector(".submit-btn")?.addEventListener("click", function () {
    const selectedCheckbox = document.querySelector(".flight-checkbox:checked");

    if (selectedCheckbox) {
        const flightId = selectedCheckbox.getAttribute("data-flight-id");
        const urlParams = new URLSearchParams(window.location.search);
        const passengerCount = urlParams.get('passenger_count') || 1;

        // ✅ API 요청 URL 생성
        const apiUrl = `http://58.127.241.84:60119/api/main/list/detail/${flightId}?passenger_count=${passengerCount}`;

        console.log("API 요청 URL:", apiUrl); // ✅ 요청 확인

        // ✅ fetch를 사용하여 API 호출
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
                    return;
                }

                console.log("API 응답 데이터:", data); // ✅ 응답 확인

                // ✅ 응답 데이터 확인 후 페이지 이동
                const redirectUrl = `http://58.127.241.84:61080/main/main_list_detail.html?flight_id=${flightId}&passenger_count=${passengerCount}`;
                console.log("Redirecting to:", redirectUrl);
                window.location.href = redirectUrl;
            })
            .catch(error => {
                console.error("항공편 데이터 로드 오류:", error);
                alert("항공편 데이터를 불러오는 중 오류가 발생했습니다.");
            });
    } else {
        alert("항공편을 선택해 주세요.");
    }
});

// ✅ 현재 페이지 URL에서 쿼리스트링(검색 조건) 가져오기 및 API 요청
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const departure_airport = urlParams.get("departure_airport");
    const arrival_airport = urlParams.get("arrival_airport");
    const departure_date = urlParams.get("departure_date");
    const seat_class = urlParams.get("seat_class") || "이코노미";
    const passenger_count = urlParams.get("passenger_count") || 1;

    // ✅ API 요청 URL 생성
    const apiUrl = `http://58.127.241.84:60119/api/main/list?departure_airport=${encodeURIComponent(departure_airport)}&arrival_airport=${encodeURIComponent(arrival_airport)}&departure_date=${encodeURIComponent(departure_date)}&seat_class=${encodeURIComponent(seat_class)}&passenger_count=${encodeURIComponent(passenger_count)}`;

    // ✅ `fetch`를 사용하여 API 데이터 요청
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            flights = data.flights || []; // ✅ flights 변수에 데이터 저장
            renderFlights(); // ✅ flights 데이터를 받아서 화면에 출력
        })
        .catch(error => console.error("항공편 데이터 로드 오류:", error));
});
