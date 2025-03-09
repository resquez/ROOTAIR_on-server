
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DEBUG: 결제 정보 페이지 로드 완료");

    // ✅ GET 파라미터에서 데이터 가져오기
    const urlParams = new URLSearchParams(window.location.search);

    console.log("✅ DEBUG: GET 파라미터 =", Object.fromEntries(urlParams.entries())); // 🔥 GET 데이터 확인

    console.log("total_price:", urlParams.get("total_price"));
    console.log("user_id:", urlParams.get("user_id"));
    console.log("username:", urlParams.get("username"));
    console.log("eng_name:", urlParams.get("eng_name"));
    console.log("mileage_used:", urlParams.get("mileage_used"));
    console.log("final_mileage:", urlParams.get("final_mileage"));
    console.log("used_rootpay:", urlParams.get("used_rootpay"));
    console.log("remaining_balance:", urlParams.get("remaining_balance"));
    console.log("passenger_count:", urlParams.get("passenger_count"));
    console.log("flight_id:", urlParams.get("flight_id"));

    // ✅ HTML 요소 업데이트
    document.getElementById("display_total_price").textContent =
        (urlParams.get("total_price") || "0").toLocaleString("en-US");

    // ✅ 숨겨진 input 필드 자동 설정
    let form = document.getElementById("paymentInfoForm");
    
    form.elements["user_id"].value = urlParams.get("user_id") || "";
    form.elements["remaining_balance"].value = urlParams.get("remaining_balance") || "0";
    form.elements["final_mileage"].value = urlParams.get("final_mileage") || "0";
    form.elements["flight_id"].value = urlParams.get("flight_id") || "";
    form.elements["username"].value = urlParams.get("username") || "Unknown User";
    form.elements["eng_name"].value = urlParams.get("eng_name") || "N/A";
    //form.elements["airplane_name"].value = urlParams.get("airplane_name") || "Unknown Flight";
    //form.elements["seat_class"].value = urlParams.get("seat_class") || "Economy";
    form.elements["passenger_count"].value = urlParams.get("passenger_count") || "1";
    form.elements["total_price"].value = urlParams.get("total_price") || "0";
    //form.elements["email"].value = urlParams.get("email") || "example@email.com";
    form.elements["mileage_used"].value = urlParams.get("mileage_used") || "0";
    form.elements["used_rootpay"].value = urlParams.get("used_rootpay") || "0";
    
    const flightId = urlParams.get("flight_id");
    const userId = urlParams.get("user_id");
    const totalPrice = urlParams.get("total_price");
    const finalMileage = urlParams.get("final_mileage");
    const remainingBalance = urlParams.get("remaining_balance");

    if (flightId && userId) {
	fetch(`http://58.127.241.84:60119/api/pay/pay_info?flight_id=${flightId}&user_id=${userId}&total_price=${totalPrice}&final_mileage=${finalMileage}&remaining_balance=${remainingBalance}`)
            .then(response => response.json())
            .then(data => {
                console.log("✅ DEBUG: API 응답 데이터 =", data);

                // ✅ API 데이터 HTML 업데이트
                document.getElementById("display_total_price").textContent = (data.total_price || "0").toLocaleString("en-US");
                document.getElementById("departure_time_debug").textContent = data.departure_time;

                // ✅ 숨겨진 input 필드 업데이트
               document.getElementById("departure_time").value = data.departure_time;
               document.getElementById("arrival_time").value = data.arrival_time;
                document.getElementById("flight_id").value = data.flight_id;
                document.getElementById("user_id").value = data.user_id;
                document.getElementById("total_price").value = data.total_price;
                document.getElementById("passenger_count").value = data.passenger_count;
                document.getElementById("email").value = data.email;
                document.getElementById("eng_name").value = data.eng_name;
                document.getElementById("final_mileage").value = data.final_mileage;
                document.getElementById("remaining_balance").value = data.remaining_balance;
            })
            .catch(error => console.error("🚨 ERROR: 결제 정보 로딩 오류:", error));
    } else {
        console.error("🚨 ERROR: flight_id 또는 user_id가 URL에 없습니다.");
    }
});

// ✅ 결제 버튼 클릭 시 실행되는 함수
function submitPayment() {
    let consentChecked = document.getElementById("consent").checked;
    if (!consentChecked) {
        alert("결제 정보를 제공에 동의해야 합니다.");
        return;
    }

    let formData = new FormData(document.getElementById("paymentInfoForm"));

    // ✅ 필수 값 확인 (누락된 값이 있는지 체크)
    let requiredFields = [
        "total_price", "final_mileage",
        "remaining_balance", "flight_id"
    ];

    let missingFields = [];
    requiredFields.forEach(field => {
        if (!formData.get(field)) {
            missingFields.push(field);
        }
    });

 //    if (missingFields.length > 0) {
 //       alert(`❌ 필수 데이터가 누락되었습니다: ${missingFields.join(", ")}`);
 //       console.error(`🚨 ERROR: 필수 데이터 누락 - ${missingFields.join(", ")}`);
 //       return;
 //   }

    console.log("✅ DEBUG: 전송할 formData 데이터:");
    for (let pair of formData.entries()) {
        console.log(`${pair[0]} = ${pair[1]}`);
    }

    fetch("http://58.127.241.84:60119/api/pay/process_payment", {
        method: "POST",
        credentials: "include",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ DEBUG: 서버 응답 데이터 =", data);
        if (data.redirect_url) {
            // ✅ 부모 창이 존재하면 부모 창으로 리디렉트 메시지 전송
            if (window.opener) {
                window.opener.postMessage({ redirect_url: data.redirect_url }, "*");
            }
            window.close();  // ✅ 자식 창 닫기
        } else {
            alert("결제 실패: " + data.error);
        }
    })
    .catch(error => {
        console.error("🚨 ERROR: 결제 요청 실패", error);
        alert("결제 요청 중 오류가 발생했습니다.");
    });
}

// ✅ 결제 버튼에 이벤트 리스너 추가
document.getElementById("submitPaymentBtn").addEventListener("click", submitPayment);
