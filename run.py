from app import app  # app.py에서 Flask 앱을 가져옴

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
