import eventlet
eventlet.monkey_patch()

import os
from flask import Flask, jsonify, request
from config import Config
from database.db import db
from sockets.events import socketio

def create_app():
    app = Flask(__name__)
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
        print("Database initialized successfully.")

    @app.route('/')
    @app.route('/dashboard')
    def dashboard():
        from flask import render_template
        return render_template('dashboard.html')

    @app.route('/register')
    def register_page():
        from flask import render_template
        return render_template('donor_register.html')

    @app.route('/request')
    def request_page():
        from flask import render_template
        return render_template('request_form.html')

    @app.route('/sos')
    def sos_page():
        from flask import render_template
        return render_template('sos_screen.html')

    @app.route('/donor/<int:donor_id>')
    def donor_profile(donor_id):
        from flask import render_template
        return render_template('donor_profile.html')

    @app.route('/health')
    def health():
        return jsonify({"status": "healthy"})

    @app.route('/sw.js')
    def serve_sw():
        from flask import send_from_directory
        return send_from_directory('static', 'sw.js', mimetype='application/javascript')

    @app.route('/manifest.json')
    def serve_manifest():
        from flask import send_from_directory
        return send_from_directory('static', 'manifest.json', mimetype='application/json')

    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=app.config['PORT'], debug=app.config['DEBUG'])
