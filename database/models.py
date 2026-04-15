from database.db import db
import datetime

class Donor(db.Model):
    __tablename__ = 'donors'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    blood_type = db.Column(db.String(5), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    last_donated = db.Column(db.Date, nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    health_status = db.Column(db.String(20), default='fit')  # fit, deferred, pending
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    donations = db.relationship('Donation', backref='donor', lazy=True)

class BloodBank(db.Model):
    __tablename__ = 'blood_banks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    contact_number = db.Column(db.String(20), nullable=True)
    operating_hours = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    inventory = db.relationship('BloodInventory', backref='bank', lazy=True)
    donations = db.relationship('Donation', backref='bank', lazy=True)

class BloodInventory(db.Model):
    __tablename__ = 'blood_inventory'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    blood_type = db.Column(db.String(5), nullable=False)
    units_available = db.Column(db.Integer, default=0)
    expiry_date = db.Column(db.Date, nullable=True)
    bank_id = db.Column(db.Integer, db.ForeignKey('blood_banks.id'), nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Request(db.Model):
    __tablename__ = 'requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_name = db.Column(db.String(100), nullable=False)
    blood_type = db.Column(db.String(5), nullable=False)
    units_needed = db.Column(db.Integer, nullable=False)
    hospital_name = db.Column(db.String(150), nullable=True)
    hospital_latitude = db.Column(db.Float, nullable=True)
    hospital_longitude = db.Column(db.Float, nullable=True)
    urgency_level = db.Column(db.String(20), nullable=True)  # low, medium, critical, SOS
    status = db.Column(db.String(20), default='pending')     # pending, matched, fulfilled, expired
    requested_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    requester_phone = db.Column(db.String(20), nullable=True)
    
    sos_alert = db.relationship('SOSAlert', backref='request_alert', uselist=False)

class Donation(db.Model):
    __tablename__ = 'donations'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=False)
    bank_id = db.Column(db.Integer, db.ForeignKey('blood_banks.id'), nullable=False)
    blood_type = db.Column(db.String(5), nullable=True)
    units = db.Column(db.Integer, default=1)
    donated_on = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)

class ForecastLog(db.Model):
    __tablename__ = 'forecast_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    blood_type = db.Column(db.String(5), nullable=True)
    predicted_demand = db.Column(db.Integer, nullable=True)
    confidence_score = db.Column(db.Float, nullable=True)
    forecast_date = db.Column(db.Date, nullable=True)
    generated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class SOSAlert(db.Model):
    __tablename__ = 'sos_alerts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, db.ForeignKey('requests.id'), nullable=False)
    alert_sent_to = db.Column(db.Text, nullable=True)         # JSON list of donor phone numbers
    alert_method = db.Column(db.String(50), nullable=True)    # SMS, push, email, in-app
    response_count = db.Column(db.Integer, default=0)
    resolved = db.Column(db.Boolean, default=False)
    triggered_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
