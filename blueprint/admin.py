import hashlib
from flask import Blueprint, jsonify, request, current_app, session, flash, redirect, url_for
from blueprints.utils import get_db_connection
from flask_login import login_user
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# 📌 Flask Blueprint 생성 (이름 반드시 'admin_bp'으로 맞출 것)
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# User 형식
class User(UserMixin):
    def __init__(self, id, user_id, password=None):
        self.id = id
        self.user_id = user_id
        self.password = password

def check_scrypt_password(stored_password, user_password):
    try:
        algorithm, n, r, p, salt, hashed_password = stored_password.split('$')
        n, r, p = int(n), int(r), int(p)
        
        # 입력 비밀번호 해시
        hashed_input = hashlib.scrypt(
            user_password.encode('utf-8'),
            salt=salt.encode('utf-8'),
            n=n,
            r=r,
            p=int(p),
            dklen=64
        ).hex()
        
        return hashed_input == hashed_password
    except ValueError:
        return False        

# 📌 관리자 로그인 페이지 이동 api
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    if request.method == 'POST':
        user_id = request.form.get('user_id')
        password = request.form.get('password')
        
        current_app.logger.debug("로그인 시도: user_id=%s", user_id)
        
        # Users 테이블에서 관리자 계정 조회
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM users WHERE user_id = %s AND isadmin = %s"
        current_app.logger.debug("실행할 쿼리: %s", query)
        cursor.execute(query, (user_id, 1))
        user = cursor.fetchone()
        current_app.logger.debug("쿼리 결과: %s", user)
        
        cursor.close()
        conn.close()
        
    if user and check_password_hash(user['password'], password): # 🔹 비밀번호 해시 검증
        admin_user = User(id=user['id'], user_id=user['user_id'])  # Flask-Login의 User 모델 사용
        login_user(admin_user, remember=True)  # 🔹 Flask-Login을 통해 로그인 처리
        session['admin'] = True # 관리자 세션 설정
        session['user_id'] = user_id  # 로그인한 사용자의 아이디를 세션에 저장
        current_app.logger.info("로그인 성공: user_id=%s", user_id)
        flash('로그인 성공하였습니다.', 'success')
        response = jsonify({
            'message': '로그인 성공', 
            'user_id': user_id,
            "redirect_url": "http://58.127.241.84:61080/admin/admin_man.html"
        })
        response.headers.add("Access-Control-Allow-Origin", "http://58.127.241.84:61080")  # 프론트엔드 주소
        response.headers.add("Access-Control-Allow-Credentials", "true")  # 세션 유지 허용
        return response, 200

    else:
        current_app.logger.error("회원 정보를 찾을 수 없습니다. user_id: %s", user_id)
        flash('아이디 또는 비밀번호가 올바르지 않습니다.', 'danger')
        return jsonify({'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401
    

# 관리자 페이지 접근 확인 api
@admin_bp.route('/man',methods=['GET'])
def admin_management():
    if not session.get('admin'):  # 세션에 'admin' 값이 없으면 로그인 페이지로 리다이렉트
        flash("관리자만 접근할 수 있습니다.", "danger")
        return jsonify({"error": "관리자만 접근 가능합니다."}), 403
    return jsonify({
        "message": "관리자 페이지 접근 성공", 
        "admin": session.get('user_id')
    })

# 회원 목록 조회 api
@admin_bp.route('/get_members', methods=['GET'])
def get_members():

    print('admin 세션이 있나요???')
    print(session.get('admin'))

    if not session.get('admin'):  #  관리자가 아니면 접근 불가
        return jsonify({"error": "Unauthorized access"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, user_id, username, phone_number, email FROM users")
    members = cursor.fetchall()

    print("멤버 출력")
    print(members)
    
    cursor.close()
    conn.close()
    
    return jsonify({"members":members})

# 회원 삭제 api
@admin_bp.route('/delete_member', methods=['POST'])
def delete_member():

    if not session.get('admin'):  # 관리자가 아니면 접근 불가
        return jsonify({"error": "Unauthorized access"}), 403
    
    data = request.json
    member_id = data.get("id")

    if not member_id:
        return jsonify({"error": "Invalid member ID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM users WHERE id = %s", (member_id,))
    conn.commit()
    
    cursor.close()
    conn.close()

    return jsonify({
        "message": "회원이 성공적으로 삭제되었습니다.",
        "redirect_url": url_for('admin.get_members', _external=True)
    })

# 로그아웃 api
@admin_bp.route('/logout')
def logout():
    session.clear()  # 모든 세션 데이터 삭제 (로그아웃)
    flash("로그아웃되었습니다.", "info")
    return jsonify({
        "message": "로그아웃되었습니다.",
        "redirect_url": url_for('admin.admin_login', _external=True)
    })