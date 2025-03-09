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

    // ✅ localStorage에서 값 가져오기
    const flightId = localStorage.getItem("selected_flight_id");
    const passengerNames = JSON.parse(localStorage.getItem("passenger_names")) || [];
    let finalMileage = 0; // ✅ 전역 변수로 설정하여 항상 최신 값을 유지



    if (!flightId) {
        console.error("ERROR: localStorage에 저장된 flight_id가 없습니다.");
        alert("항공편 정보를 불러올 수 없습니다. 다시 예약해 주세요.");
        return;
    }

    console.log(`✅ 불러온 예약 정보 - flight_id: ${flightId}, passengerNames: ${passengerNames}`);

    // ✅ 결제 정보 API(`pay_data_common`) 호출
    fetch(`http://58.127.241.84:60119/api/pay/pay_data_common?flight_id=${flightId}`, {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ DEBUG: pay_data_common API 응답 데이터 →", data);
    
        if (data.error) {
            console.error("결제 데이터 오류:", data.error);
            alert("결제 정보를 불러오지 못했습니다.");
            return;
        }

        // ✅ 여기서 price 값이 undefined인지 확인!
        console.log("DEBUG: price 값 확인 →", data.price);
        let realtotalprice = data.price * passengerNames.length;
        // ✅ HTML 요소 업데이트
        document.getElementById("departure").textContent = data.departure_airport;
        document.getElementById("departure-date").innerHTML = data.departure_time.replace(" GMT", "").replace(/(\d{4}) /, "$1<br>");
        document.getElementById("arrival").textContent = data.arrival_airport;
        document.getElementById("arrival-date").innerHTML = data.arrival_time.replace(" GMT", "").replace(/(\d{4}) /, "$1<br>"); 
        document.getElementById("class-info").innerHTML = `${data.seat_class} <br> ${passengerNames.length}명`;
        document.getElementById("total-mileage").textContent = Number(data.total_mileage).toLocaleString("ko-KR");
	document.getElementById("current-mileage").textContent = Number(data.total_mileage).toLocaleString("ko-KR") + " M";
	document.getElementById("rootpay-balance").textContent = Number(data.balance).toLocaleString("ko-KR") + " KRW";
        document.getElementById("final-payment").textContent = Number(realtotalprice).toLocaleString("ko-KR") + " KRW";
        // ✅ 개별 운임으로 탑승자 리스트 업데이트 (price 값 전달)
        updatePassengerList(data.price);
    })
    .catch(error => {
        console.error("결제 정보 로딩 오류:", error);
        alert("결제 정보를 불러오지 못했습니다.");
    });

    console.log("DEBUG: JavaScript 로드 완료, 결제 시스템 초기화 중...");

    const mileageInput = document.getElementById("mileage-input");
    const applyMileageButton = document.getElementById("apply-mileage");

    let initialFinalPayment = getIntValue("final-payment"); // ✅ 최초 결제 금액 저장
    let appliedMileage = 0; // ✅ 적용된 마일리지 저장 변수

    function updateDisplayedValue(id, value, unit = "") {
        let element = document.getElementById(id);
        if (element) {
            element.textContent = `${value.toLocaleString("en-US")} ${unit}`.trim(); 
        }
    }

    function getIntValue(id) {
        let element = document.getElementById(id);
        if (!element || !element.textContent.trim()) return 0;
        return parseInt(element.textContent.replace(/[^0-9]/g, ""), 10) || 0; // 숫자만 추출
    }

    async function fetchMileage() {
        try {
            let response = await fetch("http://58.127.241.84:60119/api/pay/get_mileage", {
                method: "GET",
                credentials: "include"
            });
    
            if (!response.ok) {
                throw new Error("마일리지 조회 실패: " + response.status);
            }
    
            let data = await response.json();
            if (data.error) {
                console.error("마일리지 조회 에러:", data.error);
                return null;
            }
    
            // ✅ 현재 마일리지 업데이트 (단위 포함)
            let mileageAmount = data.mileage || 0;
            updateDisplayedValue("current-mileage", mileageAmount, "M");
            updateDisplayedValue("total-mileage", mileageAmount); // 보유 마일리지
            updateDisplayedValue("mileage-used", 0, "M"); // 초기값 0 M 유지
    
            // ✅ 초기 earned-mileage & total-mileage-final 설정
            let finalPaymentAmount = getIntValue("final-payment");
            let earnedMileage = Math.floor(finalPaymentAmount * 0.03); // ✅ 결제 금액의 3% 적립
            finalMileage = mileageAmount + earnedMileage; // ✅ 초기 보유 마일리지 + 적립 마일리지
    
            updateDisplayedValue("earned-mileage", earnedMileage, "M");
            updateDisplayedValue("total-mileage-final", finalMileage, "M");
    
            return mileageAmount;
        } catch (error) {
            console.error("마일리지 fetch 오류:", error);
            return null;
        }
    }

    fetchMileage(); // ✅ 마일리지 정보 가져오기
    
    
    let totalAmount = getIntValue("final-amount");
    console.log("DEBUG: totalAmount 확인", totalAmount); // 🛠 확인용 로그

    // ✅ 탑승자별 운임 내역을 동적으로 생성하는 함수
    function updatePassengerList(price) {
        console.log("DEBUG: updatePassengerList 내부 price 확인 →", price); // 추가
        
        const passengerListContainer = document.getElementById("passenger-list");
        if (!passengerListContainer) {
            console.error("ERROR: passenger-list 요소를 찾을 수 없습니다.");
            return;
        }
    
        // ✅ price가 undefined일 경우 기본값을 0으로 설정
        price = price || 0;
    
        passengerListContainer.innerHTML = ""; // 기존 내용 초기화
    
        passengerNames.forEach((name, index) => {
            let passengerItem = document.createElement("div");
            passengerItem.classList.add("passenger-item");

            // ✅ 여기서 price가 정상적으로 적용되는지 확인!
            console.log(`DEBUG: ${name}의 개별 운임 → ${price}`);

    
            // ✅ 인당 운임을 `price`로 설정 (0원이 아닌 실제 값)
            passengerItem.innerHTML = `
                <div class="passenger-name">Name: ${name}</div>
                <div class="passenger-fare">${price.toLocaleString("en-US")} KRW</div>
            `;
    
            passengerListContainer.appendChild(passengerItem);
        });
    
        console.log("✅ DEBUG: 탑승자 목록 업데이트 완료 (운임 적용됨)");
    }

    // ✅ 페이지 로드 시 탑승자 목록 업데이트 실행
    updatePassengerList();

    // ✅ 적립 마일리지 계산 & UI 업데이트
    function calculateEarnedMileage() {
        let finalTotalAmount = getIntValue("final-payment");
        let earnedMileage = Math.floor(finalTotalAmount * 0.03); // ✅ 총 결제 금액의 3%
        updateDisplayedValue("earned-mileage", earnedMileage);
        return earnedMileage;
    }

    applyMileageButton.addEventListener("click", function () {
        console.log("DEBUG: 마일리지 적용 버튼 클릭됨");

        let totalMileage = getIntValue("total-mileage"); // 보유 마일리지
        let inputMileage = parseInt(mileageInput.value.replace(/,/g, ""), 10) || 0;
    
        // ✅ 최초 결제 금액 저장 (중복 차감 방지)
        if (!initialFinalPayment) {
            initialFinalPayment = getIntValue("final-payment");
        }
    
        let finalTotalAmount = initialFinalPayment; // ✅ 원래 결제 금액을 기준으로 재계산
    
        // ✅ 입력값이 음수이거나 숫자가 아니면 경고 후 초기화
        if (isNaN(inputMileage) || inputMileage < 0) {
            alert("올바른 마일리지 값을 입력하세요.");
            mileageInput.value = 0;
            return;
        }
    
        // ✅ 사용 가능한 마일리지 제한 (보유 마일리지보다 많이 입력할 수 없음)
        if (inputMileage > totalMileage) {
            alert(`사용할 마일리지가 보유 마일리지(${totalMileage.toLocaleString("en-US")})를 초과할 수 없습니다.`);
            inputMileage = totalMileage;
        }
    
        // ✅ (오류 수정) 사용 마일리지가 결제 금액보다 클 경우 자동 조정
        if (inputMileage > finalTotalAmount) {
            alert(`최대 ${finalTotalAmount.toLocaleString("en-US")} 마일리지만 사용할 수 있습니다.`);
            inputMileage = finalTotalAmount;
        }
    
        let updatedFinalAmount = finalTotalAmount - inputMileage;

        // ✅ 마일리지 적용 후 새로운 earned-mileage 계산
        let newEarnedMileage = Math.floor(updatedFinalAmount * 0.03);
        let newTotalMileageFinal = totalMileage - inputMileage + newEarnedMileage;
    
        appliedMileage = inputMileage;
    
        // ✅ 업데이트된 값들을 화면에 적용 (단위 포함)
        updateDisplayedValue("mileage-used", appliedMileage, "M");
        updateDisplayedValue("final-payment", updatedFinalAmount, "KRW");
        updateDisplayedValue("earned-mileage", newEarnedMileage, "M");
        updateDisplayedValue("total-mileage-final", newTotalMileageFinal, "M");

        // ✅ 변경된 `finalMileage` 값을 전역 변수에 저장
        finalMileage = newTotalMileageFinal; 
    
        console.log(`DEBUG: 사용 마일리지 = ${appliedMileage}, 최종 결제 금액 = ${updatedFinalAmount}, 적립 마일리지 = ${newEarnedMileage}, 결제 후 보유 마일리지 = ${newTotalMileageFinal}`);
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
    
    const rootPayButton = document.getElementById("rootpay");
    const kgInicisButton = document.getElementById("kg-inicis");
    const rootPaySection = document.getElementById("rootpay-section");
    const rootPayBalanceRow = document.querySelector("#rootpay-section p:nth-child(1)"); 
    selectedPayment = "rootpay"; // ✅ 기본 선택값 (중복 선언 방지)
    paymentWindow = null;

    function updatePaymentUI(selectedId) {
        // ✅ 모든 버튼의 'selected' 클래스 제거
        document.querySelectorAll('.payment-item').forEach(btn => btn.classList.remove('selected'));

        // ✅ 클릭한 버튼에 'selected' 클래스 추가
        document.getElementById(selectedId).classList.add('selected');

        // ✅ UI 업데이트
        if (selectedId === "rootpay") {
            rootPaySection.style.display = "block"; // 전체 섹션 표시
            rootPayBalanceRow.style.display = "block"; // ROOT PAY 잔액 표시
            console.log("✅ DEBUG: Root PAY 선택됨 → 모든 정보 표시");
        } else if (selectedId === "kg-inicis") {
            rootPaySection.style.display = "block"; // 전체 섹션 표시
            rootPayBalanceRow.style.display = "none"; // ROOT PAY 잔액 숨김
            console.log("✅ DEBUG: KG 이니시스 선택됨 → ROOT PAY 잔액 숨김");
        }

        // ✅ 선택된 결제 수단 저장
        selectedPayment = selectedId;
    }

    // ✅ 버튼 클릭 이벤트 리스너 추가
    document.querySelectorAll(".payment-item").forEach(button => {
        button.addEventListener("click", function () {
            updatePaymentUI(button.id);
        });
    });

    // ✅ 초기 상태 (Root PAY 선택 시 모든 정보 표시)
    updatePaymentUI("rootpay");

    // ✅ 결제 버튼 클릭 이벤트
    document.getElementById("pay-button").addEventListener("click", async function () { 
        console.log("DEBUG: 결제 버튼 클릭됨, 선택된 결제 수단 →", selectedPayment);
    
        if (!selectedPayment) {
            alert("결제 수단을 선택해주세요!");
            return;
        }

        // ✅ 최종 결제 금액 가져오기 (정확한 값 확인)
        let finalPaymentAmount = getIntValue("final-payment"); // ✅ 최종 결제 금액
        let rootpayBalance = getIntValue("rootpay-balance");
        let appliedMileage = getIntValue("mileage-used"); // ✅ 사용된 마일리지

        console.log(`✅ DEBUG: 최종 결제 금액 = ${finalPaymentAmount}`);
        console.log(`✅ DEBUG: Root PAY 잔액 = ${rootpayBalance}`);
        
        let flightIdElement = localStorage.getItem("selected_flight_id");
    
        if (!flightIdElement) {
            console.error("🚨 ERROR: flight_id 요소를 찾을 수 없습니다.");
            alert("항공편 정보를 불러올 수 없습니다. 다시 예약해 주세요.");
            return;
        }
    
        let flightId = flightIdElement;
    
        // ✅ Root PAY 결제 금액 부족 오류 해결
        if (selectedPayment === "rootpay" && rootpayBalance < finalPaymentAmount) {
            alert(`결제 금액(${finalPaymentAmount.toLocaleString("en-US")}원)이 부족합니다! 현재 잔액: ${rootpayBalance.toLocaleString("en-US")}원`);
            return;
        }
    
        // ✅ 세션에서 사용자 정보 가져오기
        let userId, username;
        try {
            let response = await fetch("http://58.127.241.84:60119/api/member/status", {
                method: "GET",
                credentials: "include"
            });
    
            if (!response.ok) {
                throw new Error("세션에서 사용자 정보를 가져올 수 없습니다.");
            }
    
            let data = await response.json();
            if (!data.is_authenticated) {
                alert("로그인이 필요합니다.");
                return;
            }
    
            userId = data.user_id || "";
            username = encodeURIComponent(data.username || "");
    
        } catch (error) {
            console.error("🚨 ERROR: 세션에서 사용자 정보를 가져오지 못했습니다.", error);
            alert("사용자 정보를 불러오지 못했습니다. 다시 로그인해주세요.");
            return;
        }
    
        let usedRootPay = Math.min(finalPaymentAmount, rootpayBalance);
        let remainingBalance = Math.max(rootpayBalance - usedRootPay, 0);
        let passengerNames = localStorage.getItem("passenger_names");
        let passensgerCnt = JSON.parse(localStorage.getItem("passenger_names")) || [];

        let queryParams = new URLSearchParams({
            total_price: finalPaymentAmount.toString(),
            user_id: userId,
            username: username,
            eng_name: passengerNames,
            mileage_used: appliedMileage,
            final_mileage: finalMileage,
            used_rootpay: usedRootPay.toString(),
            remaining_balance: remainingBalance.toString(),
            passenger_count: passensgerCnt.length,
            flight_id: flightId
        });
    
        let paymentUrl = `http://58.127.241.84:61080/pay/pay_info?${queryParams.toString()}`;
    
        if (selectedPayment === "rootpay") {
            console.log("✅ DEBUG: Root PAY 결제 진행 중...");
            paymentWindow = window.open(paymentUrl, "PaymentInfo", "width=400,height=400,resizable=yes");
    
            if (!paymentWindow) {
                alert("팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.");
            } else {
                paymentWindow.focus();
            }
        } else if (selectedPayment === "kg-inicis") {
            console.log("✅ DEBUG: KG 이니시스 결제 진행 중...");
            processInicisPayment(finalPaymentAmount);
        }
    });

    // ✅ 결제 완료 후 부모 창 닫고 결과 이동
    window.addEventListener("message", function (event) {
        if (event.data && event.data.redirect_url) {
            console.log(`DEBUG: 결제 완료 → ${event.data.redirect_url}`);
            if (paymentWindow) {
                paymentWindow.close();
            }
            window.location.href = event.data.redirect_url;
        }
    });

    async function processInicisPayment(amount) {  
        console.log("DEBUG: KG 이니시스 결제 시작 (금액: " + amount + "원)");
    
        let buyerEmail = document.getElementById("email")?.value || "test@default.com";
        let buyerName = document.getElementById("username")?.value || "Guest";
        let buyerTel = document.getElementById("phone_number")?.value || "010-0000-0000";
        let passengerNames = JSON.parse(localStorage.getItem("passenger_names")) || [];
        let flightId = localStorage.getItem("selected_flight_id");
    
        try {
            let response = await fetch("http://58.127.241.84:60119/api/member/status", {  
                method: "GET",
                credentials: "include"
            });
    
            if (!response.ok) {
                throw new Error("세션에서 사용자 정보를 가져올 수 없습니다.");
            }
    
            let data = await response.json();
    
            let userId = data.user_id; // ✅ userId 가져오기 완료
    
            IMP.init("imp87014111");
    
            IMP.request_pay({
                pg: "html5_inicis.INIpayTest",
                pay_method: "card",
                merchant_uid: "order_" + new Date().getTime(),
                name: "항공권 결제",
                amount: amount,
                buyer_email: buyerEmail,
                buyer_name: buyerName,
                buyer_tel: buyerTel
            }, async function (rsp) {  
                if (rsp.success) {
                    try {
                        let paymentResponse = await fetch("http://58.127.241.84:60119/api/pay/process_inicis_payment", {
                            method: "POST",
                            credentials: "include",
                            body: new URLSearchParams({
                                imp_uid: rsp.imp_uid,
                                merchant_uid: rsp.merchant_uid,
                                total_price: amount,
                                user_id: userId,
                                flight_id: flightId,
                                eng_name: JSON.stringify(passengerNames),
                                final_mileage: finalMileage
                            })
                        });
    
                        let result = await paymentResponse.json();
    
                        if (result.success && result.redirect_url) {
                            console.log("✅ DEBUG: 부모창으로 리다이렉트 메시지 전송");
                            
                            // ✅ 부모창이 있는 경우 → 부모창으로 리다이렉트 요청
                            if (window.opener) {
                                window.opener.postMessage({ redirect_url: result.redirect_url }, "*");
                                window.close(); // ✅ 팝업 창 닫기
                            } else {
                                // ✅ 부모창이 없을 경우 → 현재 창에서 바로 이동
                                window.location.href = result.redirect_url;
                            }
                        }
                    } catch (error) {
                        console.error("🚨 ERROR: 결제 API 요청 실패", error);
                        alert("결제 정보를 저장하는 중 오류가 발생했습니다.");
                    }
                } else {
                    alert("결제 실패: " + rsp.error_msg);
                }
            });
    
        } catch (error) {
            console.error("🚨 ERROR: 세션에서 사용자 정보를 가져오지 못했습니다.", error);
            alert("사용자 정보를 불러오지 못했습니다. 다시 로그인해주세요.");
        }
    }
    
});
