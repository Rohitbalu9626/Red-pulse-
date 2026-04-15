from flask import Blueprint, jsonify, request
from database.db import db
from database.models import BloodInventory, BloodBank
from sockets.events import socketio

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('', methods=['GET'])
def get_full_inventory():
    inventories = BloodInventory.query.all()
    results = [
        {
            "id": inv.id, "bank_id": inv.bank_id, 
            "blood_type": inv.blood_type, "units_available": inv.units_available,
            "expiry_date": str(inv.expiry_date) if inv.expiry_date else None,
            "last_updated": str(inv.last_updated)
        } for inv in inventories
    ]
    return jsonify(results), 200

@inventory_bp.route('/update', methods=['POST'])
def update_inventory():
    data = request.json
    try:
        bank_id = data['bank_id']
        blood_type = data['blood_type']
        units_change = data['units'] # can be positive (add) or negative (remove)

        inventory = BloodInventory.query.filter_by(bank_id=bank_id, blood_type=blood_type).first()
        if not inventory:
            # Create new record if it doesn't exist
            inventory = BloodInventory(bank_id=bank_id, blood_type=blood_type, units_available=max(0, units_change))
            db.session.add(inventory)
        else:
            inventory.units_available = max(0, inventory.units_available + units_change)
            
        db.session.commit()
        
        # Emit real-time inventory update
        socketio.emit('inventory_update', {
            "bank_id": bank_id, 
            "blood_type": blood_type, 
            "units_available": inventory.units_available
        })

        return jsonify({"message": "Inventory updated", "units_available": inventory.units_available}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@inventory_bp.route('/low-stock', methods=['GET'])
def get_low_stock():
    threshold_units = request.args.get('threshold', default=5, type=int)
    low_stocks = BloodInventory.query.filter(BloodInventory.units_available < threshold_units).all()
    results = []
    
    for stock in low_stocks:
        bank = BloodBank.query.get(stock.bank_id)
        results.append({
            "bank_name": bank.name if bank else "Unknown",
            "blood_type": stock.blood_type,
            "units_available": stock.units_available
        })

    return jsonify(results), 200
