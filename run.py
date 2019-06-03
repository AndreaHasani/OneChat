from app import socketio, application


if __name__ == '__main__':
    socketio.run(application, debug=True)
