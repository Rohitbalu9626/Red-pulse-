from flask_socketio import SocketIO, emit
import logging

# Set up logging for sockets
logging.basicConfig(level=logging.INFO)

socketio = SocketIO(cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected via WebSocket')
    emit('status', {'msg': 'Connected to Red Pulse WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    logging.info('Client disconnected')

@socketio.on('update_location')
def handle_update_location(data):
    # This event will be used to receive donor location updates every 30 seconds
    donor_id = data.get('donor_id')
    lat = data.get('latitude')
    lng = data.get('longitude')
    # In a full implementation, we will update the donor's location in the DB here
    # Example snippet:
    # from database.models import Donor
    # from database.db import db
    # donor = Donor.query.get(donor_id)
    # donor.latitude = lat; donor.longitude = lng
    # db.session.commit()
    logging.info(f"Location updated for donor {donor_id}: {lat}, {lng}")
