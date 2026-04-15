import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import json
from app import create_app
from database.db import db as _db

@pytest.fixture(scope='session')
def app():
    """Create application with a test SQLite database."""
    test_app = create_app()
    test_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'WTF_CSRF_ENABLED': False,
    })
    with test_app.app_context():
        _db.create_all()
        yield test_app
        _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def seed_donor(client):
    """Helper: register a donor and return its ID."""
    res = client.post('/api/donors/register', json={
        'name': 'Test Donor',
        'phone': '0000000001',
        'blood_type': 'O+',
        'city': 'Delhi',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'is_available': True
    })
    data = res.get_json()
    return data.get('donor_id')

# ─── DONOR TESTS ────────────────────────────────────────
class TestDonors:
    def test_register_donor_success(self, client):
        res = client.post('/api/donors/register', json={
            'name': 'Alice',
            'phone': '9999000001',
            'blood_type': 'A+',
            'city': 'Mumbai',
        })
        assert res.status_code == 201
        data = res.get_json()
        assert 'donor_id' in data

    def test_register_duplicate_phone_fails(self, client):
        payload = {'name': 'Dup', 'phone': '9999000001', 'blood_type': 'B+'}
        client.post('/api/donors/register', json=payload)
        res = client.post('/api/donors/register', json=payload)
        assert res.status_code == 400

    def test_register_missing_required_field(self, client):
        res = client.post('/api/donors/register', json={'name': 'NoPhone', 'blood_type': 'AB+'})
        assert res.status_code == 400

    def test_get_donors_list(self, client, seed_donor):
        res = client.get('/api/donors')
        assert res.status_code == 200
        donors = res.get_json()
        assert isinstance(donors, list)
        assert len(donors) > 0

    def test_get_single_donor(self, client):
        res = client.post('/api/donors/register', json={
            'name': 'Profile Test',
            'phone': '8880000010',
            'blood_type': 'O+',
        })
        donor_id = res.get_json()['donor_id']
        res2 = client.get(f'/api/donors/{donor_id}')
        assert res2.status_code == 200
        assert res2.get_json()['blood_type'] == 'O+'

    def test_toggle_availability(self, client):
        res = client.post('/api/donors/register', json={
            'name': 'Toggle Test',
            'phone': '8880000011',
            'blood_type': 'A-',
        })
        donor_id = res.get_json()['donor_id']
        res2 = client.patch(f'/api/donors/{donor_id}/availability', json={'is_available': False})
        assert res2.status_code == 200
        assert res2.get_json()['is_available'] is False

# ─── INVENTORY TESTS ────────────────────────────────────
class TestInventory:
    def test_get_inventory(self, client):
        res = client.get('/api/inventory')
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

    def test_low_stock_endpoint(self, client):
        res = client.get('/api/inventory/low-stock?threshold=100')
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

# ─── REQUEST TESTS ───────────────────────────────────────
class TestRequests:
    def test_submit_request(self, client):
        res = client.post('/api/requests/new', json={
            'patient_name': 'John Doe',
            'blood_type': 'B+',
            'units_needed': 2,
            'hospital_name': 'AIIMS',
            'urgency_level': 'medium',
            'requester_phone': '9998887770'
        })
        assert res.status_code == 201
        assert 'request_id' in res.get_json()

    def test_get_active_requests(self, client):
        res = client.get('/api/requests/active')
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

    def test_update_request_status(self, client):
        # Create a request first
        create = client.post('/api/requests/new', json={
            'patient_name': 'Status Test',
            'blood_type': 'O-',
            'units_needed': 1,
            'urgency_level': 'low'
        })
        req_id = create.get_json()['request_id']
        res = client.patch(f'/api/requests/{req_id}/status', json={'status': 'fulfilled'})
        assert res.status_code == 200
        assert res.get_json()['status'] == 'fulfilled'

# ─── BANKS TESTS ─────────────────────────────────────────
class TestBanks:
    def test_get_banks(self, client):
        res = client.get('/api/banks')
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

    def test_nearest_banks_missing_coords(self, client):
        res = client.get('/api/banks/nearest')
        assert res.status_code == 400

    def test_nearest_banks_with_coords(self, client):
        res = client.get('/api/banks/nearest?lat=28.6139&lng=77.2090')
        assert res.status_code == 200
        assert isinstance(res.get_json(), list)

# ─── FORECAST TESTS ──────────────────────────────────────
class TestForecast:
    def test_forecast_returns_7_days(self, client):
        res = client.get('/api/forecast/O%2B?days=7')
        assert res.status_code == 200
        data = res.get_json()
        assert 'next_7_days' in data
        assert len(data['next_7_days']) == 7
        assert 'recommendation' in data
        assert 'confidence' in data

    def test_forecast_custom_days(self, client):
        res = client.get('/api/forecast/A%2B?days=3')
        assert res.status_code == 200
        data = res.get_json()
        assert len(data['next_3_days']) == 3

# ─── HEALTH CHECK ─────────────────────────────────────────
class TestHealth:
    def test_health_endpoint(self, client):
        res = client.get('/health')
        assert res.status_code == 200
        assert res.get_json()['status'] == 'healthy'
