import sys
if 'gunicorn' not in sys.argv[0]:
    import eventlet
    eventlet.monkey_patch()

import os
from flask import Flask, jsonify, request
from config import Config
from database.db import db
from sockets.events import socketio

def create_app():
    # Serve React App from frontend/dist
    app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, async_mode='eventlet')

    # Register routes/blueprints
    from routes.donors import donors_bp
    from routes.banks import banks_bp
    from routes.inventory import inventory_bp
    from routes.requests import requests_bp
    from routes.forecast import forecast_bp
    from routes.sos import sos_bp

    app.register_blueprint(donors_bp, url_prefix='/api/donors')
    app.register_blueprint(banks_bp, url_prefix='/api/banks')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(requests_bp, url_prefix='/api/requests')
    app.register_blueprint(forecast_bp, url_prefix='/api/forecast')
    app.register_blueprint(sos_bp, url_prefix='/api/sos')
    
    with app.app_context():
        # Import models so SQLAlchemy creates them
        from database import models
        db.create_all()


    @app.route('/health')
    def health():
        return jsonify({"status": "healthy"})

    @app.errorhandler(404)
    def not_found(e):
        # Allow React Router to handle 404s and client-side routing
        return app.send_static_file('index.html')

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=app.config['PORT'], debug=app.config['DEBUG'])
