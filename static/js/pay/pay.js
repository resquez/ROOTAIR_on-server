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
    let rootpayBalance = getIntValue("rootpay-balance");
    let totalMileage = getIntValue("total-mileage");
    let earnedMileage = getIntValue("earned-mileage");
    let mileageUsed = getIntValue("mileage-used");
    let passengerCount = parseInt(document.getElementById("passenger_count")?.value || "1", 10);

    let finalMileage = totalMileage + earnedMileage;

    console.log(`DEBUG: 보유 마일리지 = ${totalMileage}, 적립 마일리지 = ${earnedMileage}, ROOT PAY 잔액 = ${rootpayBalance}, 총 금액 = ${totalAmount}, 탑승자 수 = ${passengerCount}`);

    // ✅ 최종 결제 금액을 탑승자 수만큼 곱하여 업데이트
    let finalTotalAmount = totalAmount * passengerCount;
    updateDisplayedValue("final-payment", finalTotalAmount);

    // ✅ 탑승자별 운임 내역에도 1000단위 콤마 추가
    document.querySelectorAll(".final-amount").forEach(element => {
        let amount = parseInt(element.textContent.replace(/,/g, ""), 10) || 0;
        element.textContent = amount.toLocaleString("en-US");
    });

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

        // ✅ 사용 마일리지가 결제 금액보다 크면 경고 메시지 표시
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

        let usedRootPay = finalPaymentAmount > rootpayBalance ? rootpayBalance : finalPaymentAmount;
        let remainingBalance = rootpayBalance - usedRootPay;

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

        let paymentUrl = `/pay/payment_info?${queryParams.toString()}`;

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