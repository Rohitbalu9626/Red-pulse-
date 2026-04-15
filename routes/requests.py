from flask import Blueprint, jsonify, request
from database.db import db
from database.models import Request
from sockets.events import socketio

requests_bp = Blueprint('requests', __name__)

@requests_bp.route('/new', methods=['POST'])
def submit_request():
    data = request.json
    try:
        urgency = data.get('urgency_level', 'medium')
        new_request = Request(
            patient_name=data['patient_name'],
            blood_type=data['blood_type'],
            units_needed=data['units_needed'],
            hospital_name=data.get('hospital_name'),
            hospital_latitude=data.get('hospital_latitude'),
            hospital_longitude=data.get('hospital_longitude'),
            urgency_level=urgency,
            requester_phone=data.get('requester_phone')
        )
        db.session.add(new_request)
        db.session.commit()
        
        # Emit a real-time event for new requests
        socketio.emit('new_request', {
            "id": new_request.id,
            "blood_type": new_request.blood_type,
            "units_needed": new_request.units_needed,
            "hospital_name": new_request.hospital_name,
            "urgency_level": new_request.urgency_level
        })
        
        # If SOS, we would trigger SOS logic here or via another endpoint
        
        return jsonify({"message": "Request submitted successfully", "request_id": new_request.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@requests_bp.route('/active', methods=['GET'])
def get_active_requests():
    # active requests are simply requests that are 'pending' or 'matched'
    active_requests = Request.query.filter(Request.status.in_(['pending', 'matched'])).all()
    results = [
        {
            "id": r.id, "patient_name": r.patient_name, "blood_type": r.blood_type,
            "units_needed": r.units_needed, "hospital_name": r.hospital_name,
            "urgency_level": r.urgency_level, "status": r.status,
            "hospital_latitude": r.hospital_latitude, "hospital_longitude": r.hospital_longitude,
            "requested_at": str(r.requested_at)
        } for r in active_requests
    ]
    return jsonify(results), 200

@requests_bp.route('/<int:request_id>/status', methods=['PATCH'])
def update_status(request_id):
    req = Request.query.get_or_404(request_id)
    data = request.json
    if 'status' in data:
        req.status = data['status']
        db.session.commit()
        return jsonify({"message": "Status updated successfully", "status": req.status}), 200
    return jsonify({"error": "Missing status field"}), 400
