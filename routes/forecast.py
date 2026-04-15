from flask import Blueprint, jsonify, request
from services.forecast_service import get_forecast
from database.db import db
from database.models import ForecastLog

forecast_bp = Blueprint('forecast', __name__)

@forecast_bp.route('/<blood_type>', methods=['GET'])
def forecast_demand(blood_type):
    # Support blood types that might come in as URL encoded, e.g. O%2B -> O+
    # Flask handles path decoding, but just to be sure we can check
    days = request.args.get('days', default=7, type=int)
    
    try:
        predictions = get_forecast(blood_type, days)
        
        total_predicted = sum(predictions)
        recommendation = f"Stock up {blood_type} by at least {int(total_predicted * 1.5)} units to maintain a safe buffer over the next {days} days."
        
        # Log this forecast in our database
        log = ForecastLog(
            blood_type=blood_type,
            predicted_demand=total_predicted,
            confidence_score=0.87 # Synthetic confidence
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "blood_type": blood_type,
            f"next_{days}_days": predictions,
            "recommendation": recommendation,
            "confidence": 0.87
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
