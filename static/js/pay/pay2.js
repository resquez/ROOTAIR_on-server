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
    let flightId = document.getElementById("flight_id")?.value;
    let userId = document.getElementById("user_id")?.value;

    console.log(`DEBUG: flight_id=${flightId}, user_id=${userId}`);

    if (!flightId || !userId) {
        console.error("ERROR: flight_id 또는 user_id가 누락되었습니다.");
        return;
    }

    let queryParams = new URLSearchParams({
        flight_id: flightId,
        user_id: userId
    });

    fetch(`http://58.127.241.84:60119/api/pay/pay_info?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("ERROR:", data.error);
                return;
            }

            document.getElementById("departure").textContent = data.departure_airport;
            document.getElementById("departure-date").textContent = data.departure_time;
            document.getElementById("arrival").textContent = data.arrival_airport;
            document.getElementById("arrival-date").textContent = data.arrival_time;
            document.getElementById("class-info").textContent = `${data.seat_class}, ${data.passenger_count}명`;

            let passengerList = document.getElementById("passenger-list");
            passengerList.innerHTML = "";
            data.passengers.forEach(passenger => {
                let div = document.createElement("div");
                div.classList.add("passenger-list");
                div.innerHTML = `
                    <div class="passenger">
                        <strong class="passenger-name">${passenger.name}</strong> <span class="passenger-type">(성인)</span>
                    </div>
                    <div class="flight-route">
                        <span class="route">${data.departure_airport}</span> <span class="arrow">▶</span>
                        <span class="route">${data.arrival_airport}</span>
                    </div>
                    <div class="price"><strong class="final-amount">${passenger.price}</strong> KRW</div>
                `;
                passengerList.appendChild(div);
            });

            document.getElementById("total-mileage").textContent = data.final_mileage;
            document.getElementById("rootpay-balance").textContent = data.remaining_balance;
            document.getElementById("final-payment").textContent = data.total_price;
            document.getElementById("username").textContent = data.username;
        })
        .catch(error => console.error("결제 정보 로딩 오류:", error));
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("DEBUG: JavaScript 로드 완료, 결제 시스템 초기화 중...");
    function getIntValue(id) {
        let element = document.getElementById(id);
        if (!element || !element.textContent.trim()) return 0;
        return parseInt(element.textContent.replace(/,/g, ""), 10) || 0;
    }

    function updateDisplayedValue(id, value) {
        let element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString("en-US"); // 1000단위 콤마 추가
        }
    }

    let totalAmount = getIntValue("final-amount"); 
    let rootpayBalance = getIntValue("rootpay-balance") || 0;
    let totalMileage = getIntValue("total-mileage");
    let earnedMileage = getIntValue("earned-mileage");
    let mileageUsed = getIntValue("mileage-used");
    let passengerCount = parseInt(document.getElementById("passenger_count")?.value, 10);
    earnedMileage *= 4;

    let finalMileage = totalMileage + earnedMileage;

    console.log(`DEBUG: 보유 마일리지 = ${totalMileage}, 적립 마일리지 = ${earnedMileage}, ROOT PAY 잔액 = ${rootpayBalance}, 총 금액 = ${totalAmount}, 탑승자 수 = ${passengerCount}`);

    // ✅ 탑승자별 개별 운임 가격 유지 (곱하지 않음)
    document.querySelectorAll(".final-amount").forEach(element => {
        let amount = parseInt(element.textContent.replace(/,/g, ""), 10) || 0;
        element.textContent = amount.toLocaleString("en-US"); // 1000단위 콤마 적용
    });

    // ✅ 최종 결제 금액만 탑승자 수만큼 곱함
    let finalTotalAmount = totalAmount * passengerCount;
    updateDisplayedValue("final-payment", finalTotalAmount);

    const mileageInput = document.getElementById("mileage-input");
    const applyMileageButton = document.getElementById("apply-mileage");
    const usedMileageDisplay = document.getElementById("mileage-used");
    const finalPaymentDisplay = document.getElementById("final-payment");
    const totalMileageFinalDisplay = document.getElementById("total-mileage-final");

    let selectedPayment = null;
    let paymentWindow = null;

    if (!applyMileageButton) {
        console.error("ERROR: apply-mileage 버튼을 찾을 수 없습니다.");
        return;
    }

    // ✅ UI 업데이트
    updateUI(rootpayBalance, mileageUsed, finalTotalAmount, finalMileage, earnedMileage, totalMileage);

    // ✅ 마일리지 적용 버튼 클릭 시 최종 결제 금액 계산
    applyMileageButton.addEventListener("click", function () {
        console.log("DEBUG: 마일리지 적용 버튼 클릭됨");

        let inputMileage = parseInt(mileageInput.value.replace(/,/g, ""), 10) || 0;

        if (inputMileage > totalMileage) {
            alert(`사용할 마일리지가 보유 마일리지(${totalMileage.toLocaleString("en-US")})를 초과할 수 없습니다.`);
            inputMileage = totalMileage;
        }

        if (inputMileage > finalTotalAmount) {
            alert("결제 금액보다 적은 값을 입력해주세요!!");
            return;
        }

        mileageUsed = inputMileage;
        let updatedFinalAmount = finalTotalAmount - mileageUsed;
        if (updatedFinalAmount < 0) updatedFinalAmount = 0;

        finalMileage = totalMileage - mileageUsed + earnedMileage;

        updateUI(rootpayBalance, mileageUsed, updatedFinalAmount, finalMileage, earnedMileage, totalMileage);

        console.log(`DEBUG: 사용 마일리지 = ${mileageUsed}, 최종 결제 금액 = ${updatedFinalAmount}, 결제 후 최종 마일리지 = ${finalMileage}`);
        alert("마일리지가 적용되었습니다!");
    });

    function updateUI(rootpayBalance, mileageUsed, finalAmount, finalMileage, earnedMileage, totalMileage) {
        updateDisplayedValue("rootpay-balance", rootpayBalance);
        updateDisplayedValue("mileage-used", mileageUsed);
        updateDisplayedValue("final-payment", finalAmount);
        updateDisplayedValue("total-mileage-final", finalMileage);
        updateDisplayedValue("earned-mileage", earnedMileage);
        updateDisplayedValue("current-mileage", totalMileage);
    }

    // ✅ 결제 수단 선택
    document.querySelectorAll(".payment-item").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll('.payment-item').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedPayment = button.id;
        });
    });

    // ✅ 결제 버튼 클릭 시 처리
    document.getElementById("pay-button").addEventListener("click", function () {
        if (!selectedPayment) {
            alert("결제 수단을 선택해주세요!");
            return;
        }

        let finalPaymentAmount = parseInt(finalPaymentDisplay.textContent.replace(/,/g, ""), 10);
        let flightId = document.getElementById("flight_id")?.value;
        if (selectedPayment === "rootpay" && rootpayBalance < finalPaymentAmount) {
            alert("결제 금액이 부족합니다!!");
            return;
        }

        let usedRootPay = Math.min(finalPaymentAmount, rootpayBalance);  // ✅ 사용 가능한 금액만큼만 차감
        let remainingBalance = Math.max(rootpayBalance - usedRootPay, 0); // ✅ 음수 방지

        let queryParams = new URLSearchParams({
            total_price: finalPaymentAmount.toString(),
            user_id: document.getElementById("user_id").value,
            username: encodeURIComponent(username),
            eng_name: document.getElementById("eng_name").value,
            mileage_used: mileageUsed.toString(),
            final_mileage: finalMileage.toString(),
            used_rootpay: usedRootPay.toString(),
            remaining_balance: remainingBalance.toString(),
            passenger_count: passengerCount,
            flight_id: flightId
        });

        let paymentUrl = `/pay/pay_info?${queryParams.toString()}`;

        if (selectedPayment === "rootpay") {
            paymentWindow = window.open(paymentUrl, "PaymentInfo", "width=400,height=400,resizable=yes");

            if (!paymentWindow) {
                alert("팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.");
            } else {
                paymentWindow.focus();
            }
        } else if (selectedPayment === "kg-inicis") {
            processInicisPayment(finalPaymentAmount);
        }
    });

    // ✅ 결제 완료 후 부모 창 닫고 result로 이동
    window.addEventListener("message", function (event) {
        if (event.data && event.data.redirect_url) {
            console.log(`DEBUG: 결제 완료 → ${event.data.redirect_url}`);

            if (paymentWindow) {
                paymentWindow.close();
            }

            window.location.href = event.data.redirect_url;
        }
    });

    // ✅ IMP(이니시스) 결제 처리 유지
    function processInicisPayment(amount) {
        console.log("DEBUG: KG 이니시스 결제 시작 (금액: " + amount + "원)");

        let buyerEmail = document.getElementById("email")?.value || "test@default.com";
        let buyerName = document.getElementById("username")?.value || "Guest";
        let buyerTel = document.getElementById("phone_number")?.value || "010-0000-0000";

        IMP.init("imp87014111");

        IMP.request_pay({
            pg: "html5_inicis.INIpayTest",
            pay_method: "card",
            merchant_uid: "order_" + new Date().getTime(),
            name: "항공권 결제",
            amount: amount,
            buyer_email: buyerEmail,
            buyer_name: buyerName,
            buyer_tel: buyerTel,
            m_redirect_url: "/pay/result"
        }, function (rsp) {
            if (rsp.success) {
                alert("결제 성공! 결제번호: " + rsp.imp_uid);
                window.location.href = "/pay/result";
            } else {
                alert("결제 실패: " + rsp.error_msg);
            }
        });
    }
});
