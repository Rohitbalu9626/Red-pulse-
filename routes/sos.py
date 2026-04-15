from flask import Blueprint, jsonify, request
from database.db import db
from database.models import Request, SOSAlert, Donor
from services.compatibility import who_can_donate_to
from services.location_service import get_nearest_entities
from services.alert_service import send_sos_alert
import json

sos_bp = Blueprint('sos', __name__)

@sos_bp.route('/trigger', methods=['POST'])
def trigger_sos():
    """
    Triggers an emergency SOS broadcast.
    Finds nearest compatible donors and dispatches alerts via WebSocket/Email.
    """
    data = request.json
    try:
        # 1. Create the Emergency Request first
        new_request = Request(
            patient_name=data.get('patient_name', 'EMERGENCY PATIENT'),
            blood_type=data['blood_type'],
            units_needed=data['units'],
            hospital_name=data.get('hospital_name'),
            hospital_latitude=data.get('lat'),
            hospital_longitude=data.get('lng'),
            urgency_level='SOS',
            requester_phone=data.get('contact_phone')
        )
        db.session.add(new_request)
        db.session.flush() # get ID before commit
        
        # 2. Get Compatible Donor Types
        compatible_types = who_can_donate_to(data['blood_type'])
        
        # 3. Find Available Donors with matching type
        potential_donors = Donor.query.filter(
            Donor.blood_type.in_(compatible_types),
            Donor.is_available == True
        ).all()
        
        # 4. Filter by Radius (Nearest 25km)
        lat = data.get('lat')
        lng = data.get('lng')
        
        matched_donors = []
        if lat and lng:
            matched_donors = get_nearest_entities(lat, lng, potential_donors, min_radius_km=25)
            # Take top 20 nearest
            matched_donors = matched_donors[:20]
        else:
            # Fallback if no location provided
            matched_donors = [{'entity': d, 'distance': 0.0} for d in potential_donors[:20]]
            
        # 5. Extract donor phone/email info to track
        donor_phones = [item['entity'].phone for item in matched_donors]
        
        alert = SOSAlert(
            request_id=new_request.id,
            alert_sent_to=json.dumps(donor_phones),
            alert_method="websocket, email"
        )
        db.session.add(alert)
        db.session.commit()
        
        # 6. Dispatch the actual alerts
        send_sos_alert(data, matched_donors)
        
        return jsonify({
            "message": "SOS ALERT TRIGGERED",
            "request_id": new_request.id,
            "donors_alerted": len(matched_donors)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
