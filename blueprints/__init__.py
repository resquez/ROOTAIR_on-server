from flask import Blueprint

# 🔹 API 파일에서 Blueprint 가져오기
from .admin import admin_bp
from .notices import notices_bp
from .main import main_bp
from .member import member_bp
from .mypage import mypage_bp
from .pay import pay_bp
from .qna import qna_bp



# 🔹 Blueprint 리스트를 만들어서 한 번에 등록할 수 있도록 설정
blueprints = [admin_bp, notices_bp, main_bp, member_bp, mypage_bp, pay_bp, qna_bp]
