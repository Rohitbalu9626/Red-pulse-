import sys
if 'gunicorn' not in sys.argv[0]:
    import eventlet
    eventlet.monkey_patch()

from app import app, socketio

if __name__ == "__main__":
    socketio.run(app)
