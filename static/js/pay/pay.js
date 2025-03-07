document.addEventListener("DOMContentLoaded", function () {
    console.log("DEBUG: JavaScript 로드 완료, 예약 정보 불러오는 중...");

    // 1000단위 콤마 추가 함수
    function updateDisplayedValue(elementId, value) {
        let element = document.getElementById(elementId);
        if (element && !isNaN(parseInt(value, 10))) {
            element.textContent = parseInt(value, 10).toLocaleString("en-US");
        }
    }

    // 히든 필드 및 표시 영역에서 값을 추출 (세션이나 서버 렌더링된 값)
    let flightId = document.getElementById("flight_id").value.trim();
    let passengerCount = document.getElementById("passenger_count").value.trim();
    let userId = document.getElementById("user_id").value.trim();
    let username = document.getElementById("username").value.trim();
    let engName = document.getElementById("eng_name").value.trim();

    // 총 결제 금액은 화면에 표시된 값에서 가져옴
    let totalPrice = "";
    let totalPriceElement = document.getElementById("display_total_price");
    if (totalPriceElement) {
        totalPrice = totalPriceElement.textContent.trim();
    }

    // final_mileage와 remaining_balance는 만약 히든 필드가 있으면 사용 (없으면 빈 문자열)
    let finalMileage = "";
    let finalMileageElement = document.getElementById("final_mileage");
    if (finalMileageElement) {
        finalMileage = finalMileageElement.value.trim();
    }

    let remainingBalance = "";
    let remainingBalanceElement = document.getElementById("remaining_balance");
    if (remainingBalanceElement) {
        remainingBalance = remainingBalanceElement.value.trim();
    }

    // URL 쿼리 스트링 생성 (세션에서 받은 값들을 그대로 사용)
    const queryParams = new URLSearchParams({
        flight_id: flightId,
        total_price: totalPrice,
        user_id: userId,
        passenger_count: passengerCount,
        final_mileage: finalMileage,
        remaining_balance: remainingBalance,
        eng_name: engName
    });

    // 백엔드의 결제 정보 조회 API 호출 (GET 방식, 세션 쿠키 포함)
    fetch("http://58.127.241.84:60119/api/pay/payment_info?" + queryParams.toString(), {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("예약 정보 로드 오류:", data.error);
            return;
        }
        console.log("DEBUG: 예약 정보 불러오기 성공", data);

        // 항공권 선택 내역 업데이트 (왼쪽 섹션의 #flight-info)
        let flightInfoDiv = document.getElementById("flight-info");
        if (flightInfoDiv) {
            flightInfoDiv.innerHTML = `
                <p>항공편 ID: ${data.flight_id}</p>
                <p>비행기: ${data.airplane_name}</p>
                <p>좌석 등급: ${data.seat_class}</p>
                <p>출발 공항: ${data.departure_airport}</p>
                <p>도착 공항: ${data.arrival_airport}</p>
                <p>출발 시간: ${data.departure_time}</p>
                <p>도착 시간: ${data.arrival_time}</p>
                <p>탑승자 수: ${data.passenger_count}</p>
            `;
        }

        // 탑승자별 운임 내역 및 최종 결제 금액 업데이트
        updateDisplayedValue("final-amount", data.total_price);
        updateDisplayedValue("final-payment", data.total_price);

        // (선택 사항) 마일리지/ROOT PAY 관련 정보 업데이트 (API에서 해당 값들을 반환하는 경우)
        updateDisplayedValue("total-mileage", data.total_mileage || 0);
        updateDisplayedValue("earned-mileage", data.earned_mileage || 0);
        updateDisplayedValue("rootpay-balance", data.balance || 0);
        updateDisplayedValue("mileage-used", 0); // 초기값 0

        // 결제 정보 전송 폼의 히든 필드 업데이트 (향후 결제 진행 시 사용)
        document.getElementById("flight_id").value = data.flight_id;
        document.getElementById("passenger_count").value = data.passenger_count;
        document.getElementById("user_id").value = data.user_id;
        document.getElementById("username").value = data.username;
        document.getElementById("eng_name").value = data.eng_name;
    })
    .catch(error => {
        console.error("예약 정보 fetch 오류:", error);
    });
});

