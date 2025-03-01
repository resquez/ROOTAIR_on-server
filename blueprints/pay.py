from flask import Blueprint, render_template, request, jsonify, url_for, redirect, send_file
from blueprints.utils import get_db_connection
from flask_login import login_required, current_user
import traceback
import uuid
import base64, json
from datetime import datetime

pay_bp = Blueprint('pay', __name__, url_prefix='/api/pay')

@pay_bp.route("/api/get_mileage", methods=["GET"])
def get_mileage():
    try:
        user_id = request.args.get("current_user.id,")  # ✅ 기존 email → user_id로 변경

        if not user_id:
            return jsonify({"error": "사용자 ID가 제공되지 않았습니다."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ 마일리지 조회 (user_id 기준)
        cursor.execute("SELECT mileage FROM users WHERE user_id = %s", (current_user.id,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        cursor.close()
        conn.close()

        return jsonify({"mileage": user_data["mileage"]})  # ✅ 마일리지만 JSON으로 반환

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": "서버 오류 발생", "details": str(e)}), 500


@pay_bp.route("/payment_info", methods=["GET"])
def payment_info():
    try:
        print(f"DEBUG: request.args = {request.args}")  # 🔥 GET 요청 확인

        # ✅ GET 파라미터에서 데이터 추출
        flight_id = request.args.get("flight_id")
        total_price = request.args.get("total_price")
        user_id = request.args.get("user_id")  # 🚀 수정: 올바른 user_id 요청 방식
        passenger_count = request.args.get("passenger_count")
        final_mileage = request.args.get("final_mileage")
        remaining_balance = request.args.get("remaining_balance")
        eng_name = request.args.get("eng_name")

        # 🔥 필수 데이터 검증
        if not flight_id or not user_id:
            return jsonify({"error": "필수 데이터 누락"}), 400

        # ✅ DB에서 username 가져오기 (user_id가 존재하는지 확인)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user_data:
            print(f"ERROR: 사용자 ID({user_id})를 찾을 수 없음")
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        username = user_data["username"]  # 🚀 DB에서 가져온 username 사용

        return render_template("pay/pay_info.html",
                            final_mileage=final_mileage,
                            remaining_balance=remaining_balance,
                            total_price=total_price,
                            username=username,  # 🚀 username을 DB에서 가져온 값으로 설정
                            user_id=user_id,
                            eng_name=eng_name,
                            passenger_count=passenger_count,
                            flight_id=flight_id)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ✅ 결제 처리 (이메일 인증 없이)
from datetime import datetime
# 이제 사용한 마일리지와 rootpay잔액을 users 테이블에 id값을 검증해서 업데이트해야함


@pay_bp.route("/api/process_payment", methods=["POST"])
def process_payment():
    try:
        print("DEBUG: Processing payment request")
        print("DEBUG: request.form =", request.form)

        # 필수 데이터 확인
        required_fields = [
            "total_price", "user_id", "passenger_count", "flight_id", 
            "final_mileage", "remaining_balance"  # ✅ JS에서 계산된 최종 값
        ]
        missing_fields = [field for field in required_fields if not request.form.get(field)]

        if missing_fields:
            print(f"ERROR: 필수 데이터 누락: {missing_fields}")
            return jsonify({"error": f"필수 데이터 누락: {missing_fields}"}), 400

        # 🔥 데이터 추출
        total_price = int(request.form["total_price"])
        user_id = request.form["user_id"]
        eng_name = request.form["eng_name"]
        passenger_count = int(request.form["passenger_count"])
        final_mileage = int(request.form["final_mileage"])  # ✅ 최종 남은 마일리지 (JS에서 계산됨)
        remaining_balance = int(request.form["remaining_balance"])  # ✅ 최종 남은 Root PAY (JS에서 계산됨)

        # 🔥 flight_id 변환
        try:
            flight_id = int(request.form["flight_id"])
        except ValueError:
            print(f"ERROR: flight_id 값이 정수가 아님: {request.form['flight_id']}")
            return jsonify({"error": "flight_id 값이 올바르지 않습니다."}), 400

        print(f"DEBUG: 변환된 flight_id = {flight_id}")

        # ✅ DB 연결
        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ `flights` 테이블에서 `flight_id`에 해당하는 데이터 가져오기
        cursor.execute("""
            SELECT airplane_name, seat_class, departure_airport, arrival_airport, 
                DATE_FORMAT(departure_time, '%%Y-%%m-%%d %%H:%%i:%%s') AS departure_time, 
                DATE_FORMAT(arrival_time, '%%Y-%%m-%%d %%H:%%i:%%s') AS arrival_time
            FROM flights WHERE flight_id = %s
        """, (flight_id,))
        flight_data = cursor.fetchone()

        if not flight_data:
            print(f"ERROR: 해당 flight_id({flight_id})에 대한 항공편 정보를 찾을 수 없음!")
            cursor.close()
            conn.close()
            return jsonify({"error": f"해당 flight_id({flight_id})에 대한 항공편 정보를 찾을 수 없습니다."}), 404

        # ✅ 데이터 설정
        airplane_name = flight_data["airplane_name"]
        seat_class = flight_data["seat_class"]
        departure_airport = flight_data["departure_airport"]
        arrival_airport = flight_data["arrival_airport"]
        departure_time_str = flight_data["departure_time"]
        arrival_time_str = flight_data["arrival_time"]

        print(f"DEBUG: DB에서 가져온 항공편 정보 -> 비행기 이름: {airplane_name}, 좌석 등급: {seat_class}, 출발 공항: {departure_airport}, 도착 공항: {arrival_airport}, 출발 시간: {departure_time_str}, 도착 시간: {arrival_time_str}")

        # ✅ departure_time과 arrival_time을 `DATETIME` 객체로 변환
        try:
            departure_time = datetime.strptime(departure_time_str, "%Y-%m-%d %H:%M:%S")
            arrival_time = datetime.strptime(arrival_time_str, "%Y-%m-%d %H:%M:%S")
        except ValueError as ve:
            print(f"ERROR: 날짜 변환 실패 - {ve}")
            return jsonify({"error": f"날짜 형식 오류: {ve}"}), 400

        # ✅ `booking_id` 생성
        booking_id = str(uuid.uuid4())[:20]

        # ✅ `bookings` 테이블에 데이터 저장
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if not user_data or not user_data["username"]:
            print(f"ERROR: 사용자 ID({user_id})를 찾을 수 없음 또는 username이 NULL")
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        username = user_data["username"]  # 🚀 username을 DB에서 가져옴
        
        cursor.execute(""" 
            INSERT INTO bookings (booking_id, user_id, username, eng_name, airplane_name, seat_class,
            departure_airport, arrival_airport, 
            departure_time, arrival_time, price, payment_status)
            VALUES (%s, %s, (SELECT username FROM users WHERE id = %s), %s, %s, %s, %s, %s, %s, %s, %s, 'Paid')
        """, (booking_id, user_id, user_id, eng_name, airplane_name, seat_class,
            departure_airport, arrival_airport, departure_time, arrival_time, total_price))

        # ✅ `users` 테이블의 마일리지 및 Root PAY 업데이트 (JS에서 계산된 값 사용)
        cursor.execute("UPDATE users SET mileage = %s, balance = %s WHERE user_id = %s", 
                    (final_mileage, remaining_balance, user_id))
        conn.commit()

        print(f"DEBUG: 사용자 {user_id} - 남은 마일리지 = {final_mileage}, 남은 Root PAY = {remaining_balance}")

        cursor.close()
        conn.close()

        print(f"DEBUG: 예약 성공 - ID: {booking_id}")

        # ✅ 결제 성공 후 리디렉트
        return jsonify({
            "redirect_url": url_for("pay.result", booking_id=booking_id, _external=True),
            "final_mileage": final_mileage,
            "remaining_balance": remaining_balance
        }), 200  

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500



# ✅ 예약 결과 페이지
@pay_bp.route("/result/<booking_id>", methods=["GET"])
def result(booking_id):
    try:
        print(f"DEBUG: /pay/result 요청됨 - booking_id: {booking_id}")  # ✅ 요청 확인

        conn = get_db_connection()
        cursor = conn.cursor()  # ✅ 결과를 딕셔너리 형태로 가져오기

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()

        cursor.close()
        conn.close()

        if not booking:
            print(f"ERROR: booking_id({booking_id})에 대한 예약 정보를 찾을 수 없음")
            return "주문 정보를 찾을 수 없습니다.", 404  # ✅ 404 응답 추가

        print(f"DEBUG: 예약 정보 가져오기 성공 - {booking}")

        return render_template("pay/pay_succ.html", booking=booking)  # ✅ 정상적인 경우 HTML 반환

    except Exception as e:
        print(f"ERROR: /pay/result 처리 중 예외 발생 - {str(e)}")  # ✅ 예외 출력
        return f"서버 오류 발생: {str(e)}", 500  # ✅ 500 에러 메시지 반환