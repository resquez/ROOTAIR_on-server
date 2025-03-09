from flask import Blueprint, request, jsonify, session, redirect
from datetime import datetime
from blueprints.utils import get_db_connection
from flask_login import login_required, current_user
import uuid


# '/api/main' 하에 모든 라우트가 위치
main_bp = Blueprint('main', __name__, url_prefix='/api/main')

# 메인 API 엔드포인트 (테스트용)
@main_bp.route('/')
def main():
    return jsonify({
        "message": "Main API is working!",
        "redirect_url": "http://58.127.241.84:61080/main/main.html"
    })


# 🔹 항공권 조회 API
@main_bp.route('/list', methods=['GET'])
def search_results():
    departure_airport = request.args.get('departure_airport')
    arrival_airport = request.args.get('arrival_airport')
    departure_date_raw = request.args.get('departure_date')
    seat_class = request.args.get('seat_class', '이코노미')
    passenger_count = request.args.get('passenger_count', 1, type=int)

    if not departure_airport or not arrival_airport or not departure_date_raw:
        return jsonify({"error": "필수 입력값이 누락되었습니다."}), 400

    try:
        departure_date = datetime.strptime(departure_date_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "잘못된 날짜 형식입니다."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT flight_id, departure_airport, arrival_airport, departure_time,
               seat_class, price, passenger_count
        FROM flights
        WHERE departure_airport = %s
          AND arrival_airport = %s
          AND DATE(departure_time) = %s
          AND seat_class = %s
          AND passenger_count >= %s
    """
    cursor.execute(query, (departure_airport, arrival_airport, departure_date, seat_class, passenger_count))
    flights = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "flights":flights,
        "redirect_url":"http://58.127.241.84:61080/main/main_list.html"
    })


# 🔹 항공편 상세 조회 API
@main_bp.route('/list/detail/<int:flight_id>', methods=['GET'])
def flight_detail(flight_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM flights WHERE flight_id = %s", (flight_id,))
    flight = cursor.fetchone()

    cursor.close()
    conn.close()

    if not flight:
        return jsonify({"error": "해당 항공편이 존재하지 않습니다."}), 404

    passenger_count = request.args.get('passenger_count', 1, type=int)
    flight["passenger_count"] = passenger_count

    return jsonify({
        "flight_id": flight["flight_id"],
        "departure_airport": flight["departure_airport"],
        "arrival_airport": flight["arrival_airport"],
        "departure_time": flight["departure_time"],
        "arrival_time": flight["arrival_time"],
        "seat_class": flight["seat_class"],
        "price": flight["price"],
        "airplane_name": flight["airplane_name"],
        "departure_code": flight.get("departure_code",""),
        "arrival_code": flight.get("arrival_code",""),
        "passenger_count": passenger_count,
        "redirect_url": "http://58.127.241.84:61080/main/main_list_detail.html"
    })

@main_bp.route('/book', methods=['POST'])
def book_flight():
    try:
        # ✅ 현재 로그인한 사용자 ID 가져오기
        # user_id 체크부터 진행!
        user_id = getattr(current_user, 'user_id', None)

        if not user_id:
           # ✅ JSON으로 에러 전달과 로그인 페이지로 리디렉션을 유도
            return jsonify({
                "error": "로그인이 필요합니다.",
                "redirect_url": "/member/member_login"
            }), 401

        # ✅ JSON 요청 데이터 받기
        data = request.get_json()
        print(f"📢 [FLASK] 요청 데이터: {data}")

        flight_id = data.get("flight_id")
        eng_names = data.get("eng_name", [])

        if not flight_id or not eng_names:
            print("📢 [FLASK] 필수 예약 정보가 없음!")
            return jsonify({"error": "필수 예약 정보가 누락되었습니다."}), 400  # 400 Bad Request

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("select * from flights where flight_id = %s", (flight_id,))
        flights = cursor.fetchone()
        if not flights:
            return "해당 항공편이 존재하지 않습니다.", 404

        print(f"📢 [FLASK] 예약 요청 - flight_id: {flight_id}, eng_names: {eng_names}")

        # ✅ flights 기본값 설정

        print(f"📢 [FLASK] flights 데이터: {flights}")

        response_data = {
            "flights": flights,
            "redirect_url": "http://58.127.241.84:61080/pay/pay.html"
        }

        print(f"📢 [FLASK] 응답 데이터: {response_data}")  # ✅ 응답 데이터 확인

        return jsonify(response_data)  # ✅ 응답 데이터를 명확하게 반환

    except Exception as e:
        print(f"🚨 [FLASK ERROR] {str(e)}")  # ✅ Flask 오류 메시지 출력
        return jsonify({"error": "서버 내부 오류 발생", "details": str(e)}), 500  # 500 Internal Server Error
