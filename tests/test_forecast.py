import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import numpy as np
from services.forecast_service import get_forecast, train_forecast_model
from services.compatibility import get_compatible_blood_types, who_can_donate_to
from services.location_service import haversine, get_nearest_entities

# ─── FORECAST SERVICE TESTS ──────────────────────────────
class TestForecastService:
    def test_train_model_creates_pkl(self):
        cols = train_forecast_model()
        assert isinstance(cols, list)
        assert len(cols) > 0
        from services.forecast_service import MODEL_PATH
        assert os.path.exists(MODEL_PATH)

    def test_forecast_returns_correct_length(self):
        for days in [3, 7, 14]:
            result = get_forecast('O+', days=days)
            assert len(result) == days, f"Expected {days} days, got {len(result)}"

    def test_forecast_values_are_positive(self):
        result = get_forecast('AB-', days=7)
        assert all(v >= 0 for v in result)

    def test_forecast_all_blood_types(self):
        for bt in ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']:
            result = get_forecast(bt, days=7)
            assert len(result) == 7, f"Failed for blood type {bt}"

# ─── COMPATIBILITY SERVICE TESTS ─────────────────────────
class TestCompatibility:
    def test_universal_donor_o_neg(self):
        """O- can donate to all 8 blood types."""
        compatible = get_compatible_blood_types('O-')
        assert len(compatible) == 8

    def test_o_pos_donates_to_positives(self):
        compatible = get_compatible_blood_types('O+')
        assert 'AB+' in compatible
        assert 'O-' not in compatible   # O+ cannot donate to O-

    def test_ab_pos_donates_only_to_ab_pos(self):
        compatible = get_compatible_blood_types('AB+')
        assert compatible == ['AB+']

    def test_who_can_donate_to_ab_pos(self):
        """AB+ can receive from everyone."""
        donors = who_can_donate_to('AB+')
        assert len(donors) == 8

    def test_who_can_donate_to_o_neg(self):
        """O- can only receive from O-."""
        donors = who_can_donate_to('O-')
        assert donors == ['O-']

    def test_symmetry(self):
        """If X can donate to Y, then Y appears in get_compatible_blood_types(X)."""
        for bt in ['O-', 'O+', 'A+', 'B-', 'AB+']:
            compatible = get_compatible_blood_types(bt)
            for recipient in compatible:
                donors = who_can_donate_to(recipient)
                assert bt in donors, f"{bt} should appear in donors for {recipient}"

# ─── LOCATION SERVICE TESTS ──────────────────────────────
class TestLocationService:
    def test_haversine_same_point(self):
        dist = haversine(28.6139, 77.2090, 28.6139, 77.2090)
        assert dist == pytest.approx(0.0, abs=0.001)

    def test_haversine_delhi_to_gurgaon(self):
        """Delhi to Gurgaon is roughly 24–30km."""
        dist = haversine(28.6139, 77.2090, 28.4595, 77.0266)
        assert 20 < dist < 40, f"Expected ~25km, got {dist:.1f}km"

    def test_haversine_delhi_to_mumbai(self):
        """Delhi to Mumbai is ~1150km."""
        dist = haversine(28.6139, 77.2090, 19.0760, 72.8777)
        assert 1100 < dist < 1250

    def test_get_nearest_entities_filters_by_radius(self):
        class FakeEntity:
            def __init__(self, lat, lng, name):
                self.latitude = lat
                self.longitude = lng
                self.name = name

        entities = [
            FakeEntity(28.6200, 77.2100, "Very Near"),        # ~1 km from Delhi center
            FakeEntity(28.4595, 77.0266, "Gurgaon"),          # ~30 km away
            FakeEntity(19.0760, 72.8777, "Mumbai"),            # ~1150 km away
        ]
        results = get_nearest_entities(28.6139, 77.2090, entities, min_radius_km=25)
        names = [r['entity'].name for r in results]
        assert "Very Near" in names
        assert "Mumbai" not in names

    def test_get_nearest_entities_sorted_by_distance(self):
        class FakeEntity:
            def __init__(self, lat, lng):
                self.latitude = lat
                self.longitude = lng

        entities = [
            FakeEntity(28.65, 77.20),   # farther
            FakeEntity(28.615, 77.209), # closer
        ]
        results = get_nearest_entities(28.6139, 77.2090, entities, min_radius_km=25)
        assert len(results) == 2
        assert results[0]['distance'] <= results[1]['distance']
