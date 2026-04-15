from database.db import db
from database.models import BloodBank, Donor, BloodInventory
from app import create_app
import random
from datetime import datetime, timedelta

def seed_database():
    app = create_app()
    with app.app_context():
        # First, drop and recreate tables just in case we are resetting
        db.drop_all()
        db.create_all()

        print("Seeding Blood Banks...")
        # Add sample banks (Focusing on an Indian context based on earlier setup hint or random)
        banks_data = [
            {"name": "Apollo Hospital Blood Bank", "city": "Delhi", "lat": 28.6139, "lng": 77.2090},
            {"name": "Fortis Memorial Blood Centre", "city": "Delhi", "lat": 28.5355, "lng": 77.2410},
            {"name": "Max Super Speciality Bank", "city": "Gurgaon", "lat": 28.4595, "lng": 77.0266},
        ]
        
        banks = []
        for bd in banks_data:
            bank = BloodBank(
                name=bd['name'], address="Sample Address", city=bd['city'],
                latitude=bd['lat'], longitude=bd['lng'], contact_number="1234567890",
                operating_hours="24/7"
            )
            db.session.add(bank)
            banks.append(bank)
        db.session.commit()

        print("Seeding Inventory...")
        blood_types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
        for bank in banks:
            for bt in blood_types:
                inv = BloodInventory(
                    blood_type=bt,
                    units_available=random.randint(2, 20),
                    expiry_date=datetime.utcnow() + timedelta(days=random.randint(15, 30)),
                    bank_id=bank.id
                )
                db.session.add(inv)
        db.session.commit()

        print("Seeding Donors...")
        donors_data = [
            {"name": "John Doe", "phone": "9876543210", "bt": "O+", "lat": 28.6100, "lng": 77.2000},
            {"name": "Jane Smith", "phone": "9876543211", "bt": "A-", "lat": 28.5400, "lng": 77.2500},
            {"name": "Alex Kumar", "phone": "9876543212", "bt": "AB+", "lat": 28.4600, "lng": 77.0300},
            {"name": "Priya Sharma", "phone": "9876543213", "bt": "O-", "lat": 28.6200, "lng": 77.2100},
        ]
        
        for dd in donors_data:
            donor = Donor(
                name=dd['name'], blood_type=dd['bt'], phone=dd['phone'],
                city="Delhi", latitude=dd['lat'], longitude=dd['lng'],
                is_available=True, health_status="fit"
            )
            db.session.add(donor)
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
