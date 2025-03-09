from flask import Blueprint, render_template, request, jsonify, url_for, redirect, send_file
from blueprints.utils import get_db_connection
from flask_login import login_required, current_user
import traceback
import uuid
import base64, json
from datetime import datetime
import pymysql

pay_bp = Blueprint('pay', __name__, url_prefix='/api/pay')

@pay_bp.route("/pay_data_common", methods=["GET"])
@login_required
def pay_data_common():
    if not current_user.is_authenticated:
        return jsonify({
            "error": "로그인이 필요합니다.",
            "redirect_url": "/api/member/login"
        }), 401  # 🚨 302가 아니라 401을 반환하도록 변경

    try:
        user_id = current_user.id
        flight_id = request.args.get("flight_id")

        if not flight_id:
            return jsonify({"error": "항공편 정보가 제공되지 않았습니다."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # 사용자 정보 가져오기
        cursor.execute(
            "SELECT username, mileage, balance, email, phone_number FROM users WHERE id = %s", 
            (user_id,)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

        # 항공편 정보 가져오기
        cursor.execute("SELECT * FROM flights WHERE flight_id = %s", (flight_id,))
        flight = cursor.fetchone()
        if not flight:
            return jsonify({"error": "해당 항공편이 존재하지 않습니다."}), 404

        # 응답 데이터 구성
        response_data = {
            "departure_airport": flight["departure_airport"],
            "departure_time": flight["departure_time"],
            "arrival_airport": flight["arrival_airport"],
            "arrival_time": flight["arrival_time"],
            "seat_class": flight["seat_class"],
            "passenger_count": flight["passenger_count"],
            "price": flight["price"],
            "username": user["username"],
            "email": user["email"],
            "phone_number": user["phone_number"],
            "total_mileage": user["mileage"],
            "balance": user["balance"],
            "redirect_url": "http://58.127.241.84:61080/pay/pay.html"
        }

        print(response_data)

        return jsonify(response_data)

    except Exception as e:
        print(f"🚨 [FLASK ERROR] {str(e)}")
        return jsonify({"error": "서버 내부 오류 발생", "details": str(e)}), 500

@pay_bp.route("/get_mileage", methods=["GET"])
def get_mileage():
    try:
        user_id = current_user.id  # ✅ 기존 email → user_id로 변경

        if not user_id:
            return jsonify({"error": "사용자 ID가 제공되지 않았습니다."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ 마일리지 조회 (user_id 기준) -> user_id를 id로 변경
        cursor.execute("SELECT mileage FROM users WHERE id = %s", (current_user.id,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        cursor.close()
        conn.close()

        return jsonify({"mileage": user_data["mileage"]})  # ✅ 마일리지만 JSON으로 반환

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": "서버 오류 발생", "details": str(e)}), 500


@pay_bp.route("/pay_info", methods=["GET"])
def payment_info():
    try:
        print(f"DEBUG: request.args = {request.args}")  # 🔥 GET 요청 확인

        # ✅ GET 파라미터에서 데이터 추출
        flight_id = request.args.get("flight_id")
        total_price = request.args.get("total_price")
        user_id = request.args.get("user_id")
        passenger_count = request.args.get("passenger_count")
        final_mileage = request.args.get("final_mileage")
        remaining_balance = request.args.get("remaining_balance")
        eng_name = request.args.get("eng_name", "")  # ✅ None 방지

        print(user_id)

        # ✅ 필수 데이터 검증
        if not flight_id or not user_id:
            return jsonify({"error": "필수 데이터 누락"}), 400

        # ✅ DB에서 username 가져오기
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)  # ✅ 딕셔너리 모드 활성화
        cursor.execute("SELECT username FROM users WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()

        cursor.execute("SELECT * FROM flights WHERE flight_id = %s", (flight_id,))
        flight_data = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user_data:
            print(f"ERROR: 사용자 ID({user_id})를 찾을 수 없음")
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        if not flight_data:
            print(f"ERROR: 항공기 ID({flight_id})를 찾을 수 없음")
            return jsonify({"error": "항공기를 찾을 수 없습니다."}), 404

        username = user_data.get("username", "Unknown")  # ✅ KeyError 방지
        # username = flight_data.get("username", "Unknown")  # ✅ KeyError 방지

        # ✅ GET 파라미터 값과 응답 데이터 비교 (디버깅)
        print("✅ DEBUG: GET 파라미터 vs 응답 데이터 비교")
        print(f"  flight_id (GET)  = {flight_id}, flight_id (응답)  = {flight_id}")
        print(f"  user_id (GET)  = {user_id}, user_id (응답)  = {user_id}")
        print(f"  total_price (GET)  = {total_price}, total_price (응답)  = {total_price}")
        print(f"  final_mileage (GET)  = {final_mileage}, final_mileage (응답)  = {final_mileage}")
        print(f"  remaining_balance (GET)  = {remaining_balance}, remaining_balance (응답)  = {remaining_balance}")
        print(f"  passenger_count (GET)  = {passenger_count}, passenger_count (응답)  = {passenger_count}")
        print(f"  eng_name (GET)  = {eng_name}, eng_name (응답)  = {eng_name}")

        # ✅ JSON 형태로 데이터 반환
        return jsonify({
            "final_mileage": final_mileage,
            "remaining_balance": remaining_balance,
            "total_price": total_price,
            "username": username,
            "user_id": user_id,
            "eng_name": eng_name,
            "passenger_count": passenger_count,
            "flight_id": flight_id
        })

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ✅ 결제 처리 (이메일 인증 없이)
from datetime import datetime
# 이제 사용한 마일리지와 rootpay잔액을 users 테이블에 id값을 검증해서 업데이트해야함


@pay_bp.route("/process_payment", methods=["POST"])
def process_payment():
    print("DEBUG: request.form 데이터", request.form)

    try:
        print("DEBUG: Processing payment request")
        print("DEBUG: request.form =", request.form)

        # 필수 데이터 확인
        required_fields = [
            "total_price", "flight_id", 
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
        # ✅ 리스트 형태 제거하고, 따옴표만 빼고 텍스트 + 공백 유지
        eng_name_cleaned = eng_name.strip("[]").replace('"', '')
        eng_name_list = [name.strip() for name in eng_name_cleaned.split(",")]  # ✅ 쉼표 기준으로 분리
  #     passenger_count = int(request.form["passenger_count"])
        final_mileage = int(request.form["final_mileage"])  # ✅ 최종 남은 마일리지 (JS에서 계산됨)
        remaining_balance = int(request.form["remaining_balance"])  # ✅ 최종 남은 Root PAY (JS에서 계산됨)

        print(type(eng_name))

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
        cursor.execute("SELECT username FROM users WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()

        print(user_data)

        if not user_data or not user_data["username"]:
            print(f"ERROR: 사용자 ID({user_id})를 찾을 수 없음 또는 username이 NULL")
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        username = user_data["username"]  # 🚀 username을 DB에서 가져옴

        print(username)
                
        for full_name in eng_name_list:
            print(f"DEBUG: Inserting booking for {full_name}")

            # ✅ 각 승객 개별 예약 INSERT
            cursor.execute(""" 
                INSERT INTO bookings (booking_id, user_id, username, eng_name, airplane_name, seat_class,
                departure_airport, arrival_airport, departure_time, arrival_time, price, payment_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Paid')
            """, (
                booking_id, user_id, username, full_name, airplane_name, seat_class,
                departure_airport, arrival_airport, departure_time, arrival_time, total_price
            ))

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
            "redirect_url": f"http://58.127.241.84:61080/pay/pay_succ?booking_id={booking_id}",
            "final_mileage": final_mileage,
            "remaining_balance": remaining_balance
        }), 200  

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500


@pay_bp.route("/process_inicis_payment", methods=["POST"])
def process_inicis_payment():
    print("DEBUG: request.form 데이터", request.form)

    try:
        print("DEBUG: Processing Inicis payment request")

        # # 🔥 필수 데이터 확인
        # required_fields = [
        #     "imp_uid", "merchant_uid", "total_price", "flight_id", "user_id", "eng_name",
        #     "final_mileage"
        # ]
        # missing_fields = [field for field in required_fields if not request.form.get(field)]

        # if missing_fields:
        #     print(f"ERROR: 필수 데이터 누락: {missing_fields}")
        #     return jsonify({"error": f"필수 데이터 누락: {missing_fields}"}), 400

        # 🔥 데이터 추출
        # imp_uid = request.form["imp_uid"]  # ✅ 이니시스 결제 고유 ID
        # merchant_uid = request.form["merchant_uid"]  # ✅ 우리 시스템에서 생성한 주문 ID
        total_price = int(request.form["total_price"])
        user_id = request.form["user_id"]
        eng_name = request.form["eng_name"]
        eng_name_list = [name.strip() for name in eng_name.strip("[]").replace('"', '').split(",")]
        final_mileage = int(request.form["final_mileage"])
        # remaining_balance = int(request.form["remaining_balance"])

        # 🔥 flight_id 변환
        try:
            flight_id = int(request.form["flight_id"])
        except ValueError:
            print(f"ERROR: flight_id 값이 정수가 아님: {request.form['flight_id']}")
            return jsonify({"error": "flight_id 값이 올바르지 않습니다."}), 400

        print(f"DEBUG: 변환된 flight_id = {flight_id}")

        # # ✅ 이니시스 결제 검증 (별도로 구현 필요)
        # if not verify_inicis_signature(imp_uid, merchant_uid, total_price):
        #     print(f"ERROR: 이니시스 결제 검증 실패! imp_uid={imp_uid}, merchant_uid={merchant_uid}")
        #     return jsonify({"error": "이니시스 결제 검증 실패"}), 400

        # ✅ DB 연결
        conn = get_db_connection()
        cursor = conn.cursor()

        # ✅ `flights` 테이블에서 항공편 정보 가져오기
        cursor.execute("""
            SELECT airplane_name, seat_class, departure_airport, arrival_airport, 
                DATE_FORMAT(departure_time, '%%Y-%%m-%%d %%H:%%i:%%s') AS departure_time, 
                DATE_FORMAT(arrival_time, '%%Y-%%m-%%d %%H:%%i:%%s') AS arrival_time
            FROM flights WHERE flight_id = %s
        """, (flight_id,))
        flight_data = cursor.fetchone()

        if not flight_data:
            print(f"ERROR: flight_id({flight_id})에 대한 항공편 정보를 찾을 수 없음!")
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

        # ✅ departure_time과 arrival_time을 `DATETIME` 객체로 변환
        departure_time = datetime.strptime(departure_time_str, "%Y-%m-%d %H:%M:%S")
        arrival_time = datetime.strptime(arrival_time_str, "%Y-%m-%d %H:%M:%S")

        # ✅ `booking_id` 생성
        booking_id = str(uuid.uuid4())[:20]

        # ✅ 사용자 이름 가져오기
        cursor.execute("SELECT username FROM users WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()

        if not user_data or not user_data["username"]:
            print(f"ERROR: 사용자 ID({user_id})를 찾을 수 없음 또는 username이 NULL")
            return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

        username = user_data["username"]

        # ✅ `bookings` 테이블에 예약 정보 저장
        for full_name in eng_name_list:
            cursor.execute("""
                INSERT INTO bookings (booking_id, user_id, username, eng_name, airplane_name, seat_class,
                departure_airport, arrival_airport, departure_time, arrival_time, price, payment_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Paid')
            """, (
                booking_id, user_id, username, full_name, airplane_name, seat_class,
                departure_airport, arrival_airport, departure_time, arrival_time, total_price
            ))

        # ✅ `users` 테이블의 마일리지 업데이트
        cursor.execute("UPDATE users SET mileage = %s WHERE user_id = %s",
                    (final_mileage, user_id))
        conn.commit()

        print(f"DEBUG: 사용자 {user_id} - 남은 마일리지 = {final_mileage}")

        cursor.close()
        conn.close()

        print(f"DEBUG: 예약 성공 - ID: {booking_id}")

        # ✅ 결제 성공 후 리디렉트
        return jsonify({
            "success": True,
            "redirect_url": f"http://58.127.241.84:61080/pay/pay_succ?booking_id={booking_id}"
        })

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500



# # ✅ 예약 결과 페이지
# @pay_bp.route("/result/<booking_id>", methods=["GET"])
# def result(booking_id):
#     try:
#         print(f"DEBUG: /pay/result 요청됨 - booking_id: {booking_id}")  # ✅ 요청 확인

#         conn = get_db_connection()
#         cursor = conn.cursor()  # ✅ 결과를 딕셔너리 형태로 가져오기

#         cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
#         booking = cursor.fetchone()

#         cursor.close()
#         conn.close()

#         if not booking:
#             print(f"ERROR: booking_id({booking_id})에 대한 예약 정보를 찾을 수 없음")
#             return "주문 정보를 찾을 수 없습니다.", 404  # ✅ 404 응답 추가

#         print(f"DEBUG: 예약 정보 가져오기 성공 - {booking}")

#         return jsonify({

#     except Exception as e:
#         print(f"ERROR: /pay/result 처리 중 예외 발생 - {str(e)}")  # ✅ 예외 출력
#         return f"서버 오류 발생: {str(e)}", 500  # ✅ 500 에러 메시지 반환