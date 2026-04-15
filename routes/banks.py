from flask import Blueprint, jsonify, request
from database.models import BloodBank
from services.location_service import get_nearest_entities

banks_bp = Blueprint('banks', __name__)

@banks_bp.route('', methods=['GET'])
def get_banks():
    banks = BloodBank.query.filter_by(is_active=True).all()
    results = [
        {
            "id": b.id, "name": b.name, "address": b.address,
            "city": b.city, "latitude": b.latitude, "longitude": b.longitude,
            "contact_number": b.contact_number, "operating_hours": b.operating_hours
        } for b in banks
    ]
    return jsonify(results), 200

@banks_bp.route('/nearest', methods=['GET'])
def get_nearest_banks():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    rad = request.args.get('radius', default=25, type=float)

    if lat is None or lng is None:
        return jsonify({"error": "Latitude (lat) and Longitude (lng) are required"}), 400

    banks = BloodBank.query.filter_by(is_active=True).all()
    nearest = get_nearest_entities(lat, lng, banks, min_radius_km=rad)

    results = []
    for item in nearest:
        b = item['entity']
        results.append({
            "id": b.id, "name": b.name, "distance_km": item['distance'],
            "latitude": b.latitude, "longitude": b.longitude
        })
    
    # Return top 3 nearest banks
    return jsonify(results[:3]), 200
