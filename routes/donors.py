from flask import Blueprint, request, jsonify
from database.db import db
from database.models import Donor

donors_bp = Blueprint('donors', __name__)

@donors_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    try:
        new_donor = Donor(
            name=data['name'],
            blood_type=data['blood_type'],
            phone=data['phone'],
            email=data.get('email'),
            city=data.get('city'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            is_available=data.get('is_available', True)
        )
        db.session.add(new_donor)
        db.session.commit()
        return jsonify({"message": "Donor registered successfully!", "donor_id": new_donor.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@donors_bp.route('', methods=['GET'])
def get_donors():
    donors = Donor.query.filter_by(is_available=True).all()
    results = [
        {
            "id": d.id, "name": d.name, "blood_type": d.blood_type,
            "city": d.city, "latitude": d.latitude, "longitude": d.longitude,
            "last_donated": str(d.last_donated) if d.last_donated else None
        } for d in donors
    ]
    return jsonify(results), 200

@donors_bp.route('/<int:donor_id>', methods=['GET'])
def get_donor(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    return jsonify({
        "id": donor.id, "name": donor.name, "blood_type": donor.blood_type,
        "phone": donor.phone, "email": donor.email, "city": donor.city,
        "is_available": donor.is_available, "health_status": donor.health_status,
        "latitude": donor.latitude, "longitude": donor.longitude
    }), 200

@donors_bp.route('/<int:donor_id>/availability', methods=['PATCH'])
def toggle_availability(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    data = request.json
    if 'is_available' in data:
        donor.is_available = data['is_available']
        db.session.commit()
        return jsonify({"message": "Availability updated successfully", "is_available": donor.is_available}), 200
    return jsonify({"error": "Missing is_available field"}), 400
