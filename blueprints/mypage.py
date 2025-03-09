from flask import Blueprint, current_app, flash, request, jsonify, session, redirect, url_for
import pymysql
from blueprints.utils import get_db_connection
from flask_login import login_required, current_user, logout_user
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from pymysql.cursors import DictCursor

# 블루프린트 생성
mypage_bp = Blueprint('mypage', __name__, url_prefix='/api/mypage')



# ✅ 예약된 항공권 목록 조회 API
@mypage_bp.route('/get_tickets')
@login_required
def get_tickets():
    """예약된 항공권 정보를 JSON 데이터로 반환하는 API"""
    try:
        print(f"📌 현재 사용자 ID: {current_user.username}")  # ✅ 현재 로그인한 사용자의 ID 확인 로그 추가

        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:

                # ✅ 현재 로그인한 사용자의 예약 목록 조회 (user_id로 검색)
                cursor.execute("SELECT * FROM bookings WHERE username = %s", (current_user.username,))
                tickets = cursor.fetchall()
                ticket_cnt = len(tickets)

        print(f"📌 예약된 항공권 개수: {ticket_cnt}")  # ✅ 예약 개수 확인 로그 추가

        if not tickets:
            return jsonify({"tickets": []})  # ✅ 조회된 데이터가 없으면 빈 리스트 반환

        processed_tickets = []
        for ticket in tickets:
            full_name = ticket["eng_name"]
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) == 2 else ""

            # ✅ 날짜, 시간 형식 변환 (예외 발생 방지)
            try:
                departure_dt = ticket["departure_time"].strftime('%Y-%m-%d %H:%M')
                arrival_dt = ticket["arrival_time"].strftime('%Y-%m-%d %H:%M')
            except AttributeError:  # `NoneType` 예외 방지
                departure_dt = "정보 없음"
                arrival_dt = "정보 없음"

            processed_ticket = {
                "id": ticket["id"],
                "booking_id": ticket["booking_id"],
                "username": ticket["username"],
                "eng_name": ticket["eng_name"],
                "first_name": first_name,
                "last_name": last_name,
                "airplane_name": ticket["airplane_name"],
                "departure_airport": ticket["departure_airport"],
                "arrival_airport": ticket["arrival_airport"],
                "price": ticket["price"],
                "seat_class": ticket["seat_class"],
                "departure_time": departure_dt,
                "arrival_time": arrival_dt
            }
            processed_tickets.append(processed_ticket)

        return jsonify({"tickets": processed_tickets})

    except Exception as e:
        print(f"🚨 Error fetching tickets: {e}")
        return jsonify({"error": "Failed to fetch ticket data"}), 500


@mypage_bp.route('/')
@login_required
def mypage():
    """마이페이지 정보 조회"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("""
                    SELECT username, user_id, email, phone_number, address, add_detail, postal_code, balance, mileage 
                    FROM users WHERE id = %s
                """, (current_user.id,))
                user = cursor.fetchone()

                if not user:
                    return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

                cursor.execute("SELECT * FROM bookings WHERE username = %s", (current_user.username,))
                tickets = cursor.fetchall()
                ticket_cnt = len(tickets)

                return jsonify({"user": user, "flight_count": ticket_cnt})

    except Exception as e:
        print(f"🚨 Error fetching user data: {e}")
        return jsonify({"error": "Failed to fetch user data"}), 500


# ✅ 회원정보 수정 페이지 API (리디렉트 대신 JSON 반환)
@mypage_bp.route('/edit', methods=['GET'])
@login_required
def edit_page():
    """회원정보 수정 페이지 URL 반환"""
    return jsonify({"redirect_url": "http://58.127.241.84:61080/mypage/mypage_edit.html"})


# ✅ 회원정보 조회 API
@mypage_bp.route('/user_info', methods=['GET'])
@login_required
def get_user_info():
    """회원 정보 조회"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("""
                    SELECT username, user_id, phone_number, postal_code, address, add_detail, email 
                    FROM users WHERE id = %s
                """, (current_user.id,))
                user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'message': '사용자 정보를 찾을 수 없습니다.'}), 404

        return jsonify({'success': True, 'user': user}), 200

    except pymysql.MySQLError as db_error:
        print(f"🚨 데이터베이스 오류: {db_error}")
        return jsonify({'success': False, 'message': '데이터베이스 오류 발생'}), 500


# ✅ 회원정보 수정 API
@mypage_bp.route('/update', methods=['POST'])
@login_required
def user_edit():
    """회원 정보 수정"""
    try:
        data = request.json
        updates = []
        values = []

        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.id,))
                user = cursor.fetchone()

                if not user:
                    return jsonify({'success': False, 'message': '사용자 정보를 찾을 수 없습니다.'}), 404

                # ✅ 비밀번호 변경 처리
                new_password = data.get('password', '').strip()
                confirm_password = data.get('confirm_password', '').strip()
                if new_password and new_password == confirm_password:
                    updates.append("password = %s")
                    values.append(generate_password_hash(new_password))

                # ✅ 주소 변경 처리
                if data.get('extra_address'):
                    updates.append("add_detail = %s")
                    values.append(data['extra_address'])
                if data.get('postal_code'):
                    updates.append("postal_code = %s")
                    values.append(data['postal_code'])
                if data.get('address'):
                    updates.append("address = %s")
                    values.append(data['address'])

                if not updates:
                    return jsonify({'success': False, 'message': '변경할 내용이 없습니다.'}), 400

                query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
                values.append(current_user.id)
                cursor.execute(query, tuple(values))
                conn.commit()

                return jsonify({'success': True, 'message': '회원정보가 성공적으로 업데이트되었습니다.'}), 200

    except pymysql.MySQLError as db_error:
        print(f"🚨 데이터베이스 오류: {db_error}")
        return jsonify({'success': False, 'message': '데이터베이스 오류 발생'}), 500

    except Exception as e:
        print(f"🚨 회원정보 수정 중 오류: {e}")
        return jsonify({'success': False, 'message': '업데이트 중 오류가 발생했습니다.'}), 500


# ✅ 비밀번호 확인 API
@mypage_bp.route('/verify_password', methods=['POST'])
@login_required
def verify_password():
    """비밀번호 확인"""
    try:
        data = request.json
        password = data.get('password')

        if not password:
            return jsonify({'success': False, 'message': '비밀번호를 입력해주세요.'}), 400

        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT password FROM users WHERE id = %s", (current_user.id,))
                user = cursor.fetchone()

                if not user or not check_password_hash(user['password'], password):
                    return jsonify({'success': False, 'message': '비밀번호가 일치하지 않습니다.'}), 400

                return jsonify({'success': True, 'message': '비밀번호 확인 완료'}), 200

    except Exception as e:
        print(f"🚨 비밀번호 확인 중 오류 발생: {e}")
        return jsonify({'success': False, 'message': '서버 오류 발생'}), 500

# 회원 탈퇴 api    
@mypage_bp.route('/cancel', methods=['POST'])
@login_required
def user_cancel():
    """회원 탈퇴"""
    try:
        data = request.json
        password = data.get('password')

        if not password:
            return jsonify({"error": "비밀번호를 입력해주세요."}), 400

        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT password FROM users WHERE id = %s", (current_user.id,))
                user = cursor.fetchone()

                if not user or not check_password_hash(user["password"], password):
                    return jsonify({"error": "비밀번호가 일치하지 않습니다."}), 400

                cursor.execute("DELETE FROM users WHERE id = %s", (current_user.id,))
                conn.commit()

                logout_user()
                session.clear()

                return jsonify({
                    "message": "회원 탈퇴가 완료되었습니다.", 
                    "success": True
                }), 200

    except Exception as e:
        print(f"🚨 Error during user deletion: {e}")
        return jsonify({"error": "회원 탈퇴 중 오류가 발생했습니다."}), 500