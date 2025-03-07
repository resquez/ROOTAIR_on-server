document.addEventListener("DOMContentLoaded", function () {
    checkLoginStatus();
    loadUserInfo();
    generateTickets();

    // 회원 정보 수정 버튼 클릭 시 이벤트
    document.getElementById("editProfileBtn").addEventListener("click", function () {
        fetch("http://58.127.241.84:60119/api/mypage/edit", {
            method: "GET",
            credentials: "include",
            mode: "cors"  // CORS 오류 방지
        })
        .then(response => response.json())
        .then(data => {
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                alert("회원정보 수정 페이지 이동 실패.");
            }
        })
        .catch(error => console.error("❌ 회원정보 수정 이동 오류:", error));
    });
});

/**
 * ✅ 로그인 상태 확인 및 네비게이션 바 업데이트
 */
function checkLoginStatus() {
    fetch("http://58.127.241.84:60119/api/member/status", {
        method: "GET",
        credentials: "include",
        mode: "cors"
    })
    .then(response => response.json())
    .then(data => {
        const navbarMember = document.getElementById("navbar_member");
        navbarMember.innerHTML = "";  // 기존 내용 초기화

        if (data.is_authenticated) {
            navbarMember.innerHTML = `
                <li><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                <li><a href="http://58.127.241.84:61080/mypage/mypage.html">마이페이지</a></li>
            `;
        } else {
            navbarMember.innerHTML = `
                <li><a href="http://58.127.241.84:61080/member/member_email.html">회원가입</a></li>
                <li><a href="http://58.127.241.84:61080/member/member_login.html">로그인</a></li>
            `;
        }
    })
    .catch(error => console.error("🚨 사용자 상태 확인 오류:", error));
}

/**
 * ✅ 사용자 정보 가져오기 및 UI 업데이트
 */
function loadUserInfo() {
    fetch("http://58.127.241.84:60119/api/mypage", {
        method: "GET",
        credentials: "include",
        mode: "cors"
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 마이페이지 API 응답:", data);

        if (!data.user) {
            alert("사용자 정보를 불러올 수 없습니다. 로그인 상태를 확인하세요.");
            window.location.href = "http://58.127.241.84:61080/member/member_login.html";
            return;
        }

        // ✅ user 객체에서 데이터 가져오기
        document.getElementById("username").textContent = data.user.username || "사용자 정보 없음";
        document.getElementById("phone_number").textContent = data.user.phone_number || "없음";
        document.getElementById("email").textContent = data.user.email || "없음";
        document.getElementById("address").textContent = (data.user.address || "없음") + " " + (data.user.add_detail || "");
        document.getElementById("balance").textContent = data.user.balance ? data.user.balance.toLocaleString() : "0";
        document.getElementById("mileage").textContent = data.user.mileage ? data.user.mileage.toLocaleString() : "0";
        document.getElementById("flight_cnt").textContent = data.flight_count || "0";
    })
    .catch(error => console.error("🚨 마이페이지 데이터 로드 오류:", error));
}

/**
 * ✅ 사용자의 예약된 항공권 목록 불러오기
 */
async function generateTickets() {
    try {
        const response = await fetch("http://58.127.241.84:60119/api/mypage/get_tickets", {
            method: "GET",
            credentials: "include",
            mode: "cors"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📌 항공권 데이터:", data);

        const container = document.getElementById("ticket-container");
        container.innerHTML = ""; // 기존 내용 초기화

        if (!data.tickets || !Array.isArray(data.tickets) || data.tickets.length === 0) {
            container.innerHTML = "<p>예약된 항공권이 없습니다.</p>";
            return;
        }

        data.tickets.forEach(ticket => {
            const ticketDiv = document.createElement("div");
            ticketDiv.classList.add("ticket");
            ticketDiv.innerHTML = `
                <div class="ticket-header">
                    <div class="header-info">
                        <img src="/static/images/plane.png">
                        <span class="title">No. ${ticket.booking_id}</span>
                    </div>
                    <button class="details-btn">상세 보기</button>
                </div>
                <div class="ticket-body">
                    <div class="passenger-name">
                        <span class="first-name">${ticket.eng_name || "이름 없음"}</span>
                    </div>

                    <div class="flight-info">
                        <div class="flight-segment">
                            <div class="date">${ticket.departure_date || "날짜 없음"}</div>
                            <div class="time">${ticket.departure_time || "시간 없음"}</div>
                            <div class="airport">${ticket.departure_airport || "공항 없음"}</div>
                        </div>

                        <div class="plane-image">
                            <img src="/static/images/from_to_flight.jpg" alt="비행기 이미지">
                        </div>

                        <div class="flight-segment">
                            <div class="date">${ticket.arrival_date || "날짜 없음"}</div>
                            <div class="time">${ticket.arrival_time || "시간 없음"}</div>
                            <div class="airport">${ticket.arrival_airport || "공항 없음"}</div>
                        </div>
                    </div>

                    <div class="cabin-class">
                        <div class="seat-image">
                            <img src="/static/images/seat.png" alt="seat">
                        </div>
                        <div class="seat-body">
                            <div class="class-label">Cabin Class & Travelers</div>
                            <div class="class-value">${ticket.age || "연령 정보 없음"}, ${ticket.seat_class || "좌석 등급 없음"}</div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(ticketDiv);
        });

    } catch (error) {
        console.error("🚨 항공권 데이터 로드 오류:", error);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    checkLoginStatus();
    loadUserInfo();
    generateTickets();

    // ✅ 회원탈퇴 버튼 클릭 이벤트 추가
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", function () {
            window.location.href = "http://58.127.241.84:61080/mypage/mypage_cancel.html";
        });
    }
});

