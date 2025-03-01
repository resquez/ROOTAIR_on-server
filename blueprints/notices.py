from flask import Blueprint, render_template, request, jsonify, url_for, send_from_directory, redirect, session
from blueprints.utils import get_db_connection
from datetime import datetime
import pytz
import os
from werkzeug.utils import secure_filename  # 파일명 보호

# 블루프린트 생성
notices_bp = Blueprint('notices', __name__, url_prefix='/api/notices')

UPLOAD_FOLDER = 'static/uploads/'

# 📌 공지사항 목록 페이지 (HTML 반환)
@notices_bp.route('/')
def notices_page():
    return render_template('notices/notices.html')  # JS에서 API 호출하여 데이터 표시

# 📌 공지사항 목록 API (JSON 반환)
@notices_bp.route('/api/list')
def notices_api():
    conn = get_db_connection()
    cursor = conn.cursor()

    per_page = 5  
    page = request.args.get('page', 1, type=int)  
    offset = (page - 1) * per_page  

    cursor.execute('SELECT notice_id, title, file, created_at FROM notices ORDER BY created_at DESC LIMIT %s OFFSET %s', (per_page, offset))
    notices = cursor.fetchall()

    cursor.execute('SELECT COUNT(*) AS total FROM notices')
    total_notices = cursor.fetchone()
    total_count = total_notices['total'] if total_notices else 0
    total_pages = (total_count + per_page - 1) // per_page  

    conn.close()

    # ✅ `created_at`을 문자열로 변환 (JSON 직렬화 오류 방지)
    for notice in notices:
        if notice['created_at']:
            notice['created_at'] = notice['created_at'].strftime('%Y-%m-%d %H:%M:%S')

    return jsonify({'notices': notices, 'total_pages': total_pages})

# 📌 공지사항 상세 페이지 (HTML 반환)
@notices_bp.route('/<int:notice_id>')
def notice_detail_page(notice_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT notice_id, title, file, content, created_at FROM notices WHERE notice_id = %s', (notice_id,))
    notice = cursor.fetchone()
    conn.close()

    if not notice:
        return "공지사항을 찾을 수 없습니다.", 404

    return render_template('notices/notice_detail.html', notice=notice)

# 📌 공지사항 상세 API (JSON 반환)
@notices_bp.route('/api/<int:notice_id>')
def notice_detail_api(notice_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT notice_id, title, content, file, created_at FROM notices WHERE notice_id = %s', (notice_id,))
    notice = cursor.fetchone()
    conn.close()

    if not notice:
        return jsonify({'error': '공지사항을 찾을 수 없습니다.'}), 404

    # ✅ `created_at`을 문자열로 변환
    if notice['created_at']:
        notice['created_at'] = notice['created_at'].strftime('%Y-%m-%d %H:%M:%S')

    # ✅ 파일 경로 추가
    file_url = None
    if notice['file']:
        file_url = url_for('notices.download_file', filename=os.path.basename(notice['file']))

    return jsonify({
        'notice_id': notice['notice_id'],
        'title': notice['title'],
        'content': notice['content'],
        'created_at': notice['created_at'],
        'file_url': file_url
    })

# 📌 파일 다운로드 API
@notices_bp.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

# 📌 공지사항 등록 페이지
@notices_bp.route('/create', methods=['GET'])
def notice_create_page():
    return render_template('notices/notice_create.html')

# 📌 공지사항 등록 API
@notices_bp.route('/api/create', methods=['POST'])
def notice_create_api():
    conn = get_db_connection()
    cursor = conn.cursor()

    data = request.form
    title = data.get('title')
    content = data.get('content')
    file = request.files.get('file')

    # ✅ 필수 필드 확인
    if not title or not content:
        return jsonify({'error': '제목과 내용을 입력하세요.'}), 400

    # ✅ 파일 저장
    file_url = None
    if file:
        filename = secure_filename(file.filename)  # 파일명 보호
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        file_url = file_path

    kst = pytz.timezone('Asia/Seoul')
    created_at = datetime.now(kst).strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute('INSERT INTO notices (title, content, file, created_at) VALUES (%s, %s, %s, %s)',
                   (title, content, file_url, created_at))

    conn.commit()
    conn.close()

    return redirect(url_for('notices.notices_page'))

# 📌 공지사항 삭제 API
@notices_bp.route('/api/delete/<int:notice_id>', methods=['DELETE'])
def notice_delete_api(notice_id):
    if not session.get('admin', False):
        return jsonify({'error': '관리자만 삭제할 수 있습니다.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT file FROM notices WHERE notice_id = %s", (notice_id,))
    notice = cursor.fetchone()

    if not notice:
        conn.close()
        return jsonify({'error': '공지사항을 찾을 수 없습니다.'}), 404

    # ✅ 파일 삭제
    if notice['file'] and os.path.exists(notice['file']):
        os.remove(notice['file'])

    cursor.execute("DELETE FROM notices WHERE notice_id = %s", (notice_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': '공지사항이 성공적으로 삭제되었습니다.', 'redirect_url': url_for('notices.notices_page')})

# 📌 공지사항 수정 페이지
@notices_bp.route('/edit/<int:notice_id>', methods=['GET'])
def notice_edit_page(notice_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT notice_id, title, content, file FROM notices WHERE notice_id = %s', (notice_id,))
    notice = cursor.fetchone()
    conn.close()

    if not notice:
        return "공지사항을 찾을 수 없습니다.", 404

    return render_template('notices/notice_edit.html', notice=notice)

# 📌 공지사항 수정 API
@notices_bp.route('/api/edit/<int:notice_id>', methods=['POST'])
def notice_edit_api(notice_id):
    """공지사항을 수정하는 API"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT title, content, file FROM notices WHERE notice_id = %s", (notice_id,))
    notice = cursor.fetchone()

    if not notice:
        conn.close()
        return jsonify({'error': '공지사항을 찾을 수 없습니다.'}), 404

    data = request.form
    title = data.get('title', "").strip()
    content = data.get('content', "").strip()
    file = request.files.get('file')

    existing_file_url = notice['file'] if notice['file'] else ""
    file_url = existing_file_url

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        file_url = file_path

    if (title == (notice['title'] or "").strip() and
        content == (notice['content'] or "").strip() and
        file_url == existing_file_url):
        conn.close()
        return jsonify({'redirect_url': url_for('notices.notice_detail_page', notice_id=notice_id)})

    cursor.execute('UPDATE notices SET title = %s, content = %s, file = %s WHERE notice_id = %s',
                   (title, content, file_url, notice_id))

    conn.commit()
    conn.close()

    return jsonify({'redirect_url': url_for('notices.notice_detail_page', notice_id=notice_id)})
