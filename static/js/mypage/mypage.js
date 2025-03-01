

async function generateTickets() {
    try {
        const response = await fetch("http://58.127.241.84:60119/api/mypage/get_tickets");  // Flask API 요청
        const tickets = await response.json();  // JSON 데이터 변환

        console.log(tickets); // JSON 데이터 확인 (F12 콘솔)

        const container = document.getElementById("ticket-container");
        container.innerHTML = ""; // 기존 내용 초기화

        tickets.forEach(ticket => {
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
                    <!-- 좌측: 승객 이름 -->
                    <div class="passenger-name">
                        <!--span class="last-name">${ticket.first_name}</span-->
                        <!--span class="first-name">${ticket.last_name}</span-->
                        <span class="first-name">${ticket.eng_name}</span>
                    </div>

                    <!-- 중앙: 비행 정보 -->
                    <div class="flight-info">
                        <!-- 출발 정보 -->
                        <div class="flight-segment">
                        <div class="date">${ticket.departure_date}</div>
                        <div class="time">${ticket.departure_time}</div>
                        <div class="airport">${ticket.departure_airport}</div>
                        </div>

                        <div class="plane-image">
                        <img src="/static/images/from_to_flight.jpg" alt="비행기 이미지">
                        </div>

                        <!-- 도착 정보 -->
                        <div class="flight-segment">
                        <div class="date">${ticket.arrival_date}</div>
                        <div class="time">${ticket.arrival_time}</div>
                        <div class="airport">${ticket.arrival_airport}</div>
                        </div>
                    </div>

                    <!-- 우측: 캐빈 클래스 -->
                    <div class="cabin-class">
                        <div class="seat-image">
                            <img src="/static/images/seat.png" alt="seat">
                        </div>
                        <div class="seat-body">
                            <div class="class-label">Cabin Class & Travelers</div>
                            <div class="class-value">${ticket.age}, ${ticket.seat_class}</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            container.appendChild(ticketDiv);
        });

    } catch (error) {
        console.error("Error fetching tickets:", error);
    }
}

// ✅ 페이지 로드 시 자동 실행
document.addEventListener("DOMContentLoaded", generateTickets);
