from datetime import timedelta
from flask import Flask
from flask_mail import Mail
from blueprints import blueprints  
from blueprints.member import member_bp
from flask_login import LoginManager
from blueprints.member import User
from blueprints.utils import get_db_connection
from flask_login import UserMixin
from flask_cors import CORS
from flask_session import Session
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = '1234'
CORS(app,supports_credentials=True,resources={r"/api/*":{"origins":"http://58.127.241.84:61080"}})

login_manager = LoginManager()
login_manager.init_app(app)


# Flask-Login 초기화
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'member.login'  # 로그인 페이지 라우트 설정
login_manager.login_message = "로그인이 필요합니다."  # 로그인 필요 메시지 설정
# 🔹 Blueprint 등록

for bp in blueprints:
    app.register_blueprint(bp)
    
    
# 📌 현재 등록된 모든 URL 확인 (디버깅 용도)
print(app.url_map)

app.config.update(
    MAIL_SERVER='smtp.gmail.com',  # Gmail SMTP 서버
    MAIL_PORT=465,                # SSL 포트
    MAIL_USE_SSL=True,            # SSL 사용
    MAIL_USERNAME='dhthdals0723@gmail.com',  # Gmail 계정
    MAIL_PASSWORD='xooz nwaj ohvf defu'     # Gmail 앱 비밀번호
)
mail = Mail(app)


class User(UserMixin):
    def __init__(self, user_id, id,isadmin, username, password):
        self.id = id
        self.user_id = user_id
        self.isadmin=isadmin
        self.username = username
        self.password = password
        

@login_manager.user_loader
def load_user(user_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    connection.close()

    if user_data:
        return User(id=user_data['id'], username=user_data['username'],isadmin=user_data['isadmin'], password=user_data['password'], user_id = user_data['user_id'])
    return None

# app.config['SESSION_COOKIE_NAME'] = "cookiethatImade"
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
app.config['SESSION_COOKIE_HTTPONLY'] = True  # 기본값: True
app.config['SESSION_COOKIE_SECURE'] = False  # HTTPS 환경에서만 세션 쿠키를 사용하는 경우, False로 설정
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # HTTPS 환경에서만 세션 쿠키를 사용하는 경우, False로 설정
app.config['SESSION_FILE_DIR'] = os.path.join(os.getenv('TEMP'), 'flask_session')
app.config['SESSION_REFRESH_EACH_REQUEST'] = False
Session(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
