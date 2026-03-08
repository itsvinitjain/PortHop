"""PortHop API Tests - Auth, Trips, Chat, Notifications"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def captain_token():
    # Create a captain user
    phone = "TEST_9000000001"
    r = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": phone})
    assert r.status_code == 200
    r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": phone, "otp": "123456"})
    assert r2.status_code == 200
    token = r2.json()["token"]
    # Update role and name
    headers = {"Authorization": f"Bearer {token}"}
    requests.put(f"{BASE_URL}/api/auth/profile", json={"role": "captain", "name": "TEST_Captain"}, headers=headers)
    return token

@pytest.fixture(scope="module")
def passenger_token():
    phone = "TEST_9000000002"
    r = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": phone})
    assert r.status_code == 200
    r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": phone, "otp": "123456"})
    assert r2.status_code == 200
    token = r2.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    requests.put(f"{BASE_URL}/api/auth/profile", json={"role": "passenger", "name": "TEST_Passenger"}, headers=headers)
    return token

# Auth Tests
class TestAuth:
    """Authentication endpoint tests"""

    def test_send_otp(self):
        r = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9999999999"})
        assert r.status_code == 200
        assert "message" in r.json()
        print("PASS: send-otp returns 200")

    def test_send_otp_missing_phone(self):
        r = requests.post(f"{BASE_URL}/api/auth/send-otp", json={})
        assert r.status_code == 400
        print("PASS: send-otp returns 400 for missing phone")

    def test_verify_otp_valid(self):
        r = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9111111111", "otp": "123456"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert "user" in data
        assert "is_new" in data
        print("PASS: verify-otp returns token and user")

    def test_verify_otp_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9111111111", "otp": "000000"})
        assert r.status_code == 400
        print("PASS: verify-otp rejects invalid OTP")

    def test_get_me(self, captain_token):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert "phone" in data
        assert "_id" not in data
        print("PASS: get me returns user without _id")

    def test_get_me_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401
        print("PASS: get me returns 401 without token")

    def test_get_ports(self):
        r = requests.get(f"{BASE_URL}/api/ports")
        assert r.status_code == 200
        data = r.json()
        assert "ports" in data
        assert "Gateway of India" in data["ports"]
        assert len(data["ports"]) == 8
        print(f"PASS: ports returns {len(data['ports'])} ports")


# Trip Tests
class TestTrips:
    """Trip CRUD tests"""

    def test_get_trips_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/trips")
        assert r.status_code == 401
        print("PASS: trips requires auth")

    def test_get_trips(self, captain_token):
        r = requests.get(f"{BASE_URL}/api/trips", headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print("PASS: get trips returns list")

    def test_create_trip_captain(self, captain_token):
        payload = {
            "from_port": "Gateway of India",
            "to_port": "Mandwa",
            "date": "2026-03-15",
            "time": "08:00",
            "seats": 4,
            "price": 500.0
        }
        r = requests.post(f"{BASE_URL}/api/trips", json=payload, headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["from_port"] == "Gateway of India"
        assert data["to_port"] == "Mandwa"
        assert data["seats"] == 4
        assert "_id" not in data
        print(f"PASS: trip created with id {data['id']}")
        return data["id"]

    def test_create_trip_passenger_forbidden(self, passenger_token):
        payload = {
            "from_port": "Alibaug",
            "to_port": "Rewas",
            "date": "2026-03-16",
            "time": "09:00",
            "seats": 2,
            "price": 300.0
        }
        r = requests.post(f"{BASE_URL}/api/trips", json=payload, headers={"Authorization": f"Bearer {passenger_token}"})
        assert r.status_code == 403
        print("PASS: passenger cannot create trip")

    def test_get_my_trips(self, captain_token):
        r = requests.get(f"{BASE_URL}/api/trips/captain/my", headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        trips = r.json()
        assert isinstance(trips, list)
        print(f"PASS: captain has {len(trips)} trips")


# Interest Tests
class TestInterest:
    """Interest flow tests"""

    @pytest.fixture(scope="class")
    def trip_id(self, captain_token):
        payload = {
            "from_port": "Mora",
            "to_port": "Karanja",
            "date": "2026-04-01",
            "time": "10:00",
            "seats": 3,
            "price": 400.0
        }
        r = requests.post(f"{BASE_URL}/api/trips", json=payload, headers={"Authorization": f"Bearer {captain_token}"})
        return r.json()["id"]

    def test_express_interest(self, passenger_token, trip_id):
        r = requests.post(f"{BASE_URL}/api/trips/{trip_id}/interest",
                         headers={"Authorization": f"Bearer {passenger_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["trip_id"] == trip_id
        assert data["status"] == "pending"
        print("PASS: passenger expressed interest")

    def test_get_trip_interests(self, captain_token, trip_id):
        r = requests.get(f"{BASE_URL}/api/trips/{trip_id}/interests",
                        headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        interests = r.json()
        assert len(interests) >= 1
        assert "passenger" in interests[0]
        print(f"PASS: trip has {len(interests)} interests")

    def test_get_my_interest(self, passenger_token, trip_id):
        r = requests.get(f"{BASE_URL}/api/trips/{trip_id}/my-interest",
                        headers={"Authorization": f"Bearer {passenger_token}"})
        assert r.status_code == 200
        print("PASS: passenger can get their interest")

    def test_confirm_interest(self, captain_token, passenger_token, trip_id):
        # Get interests
        r = requests.get(f"{BASE_URL}/api/trips/{trip_id}/interests",
                        headers={"Authorization": f"Bearer {captain_token}"})
        interests = r.json()
        interest_id = interests[0]["id"]
        # Confirm
        r2 = requests.put(f"{BASE_URL}/api/trips/{trip_id}/interest/{interest_id}",
                         json={"status": "confirmed"},
                         headers={"Authorization": f"Bearer {captain_token}"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "confirmed"
        print("PASS: captain confirmed interest")


# Notification Tests
class TestNotifications:
    """Notification tests"""

    def test_get_notifications(self, captain_token):
        r = requests.get(f"{BASE_URL}/api/notifications",
                        headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"PASS: notifications returned")

    def test_mark_all_read(self, captain_token):
        r = requests.put(f"{BASE_URL}/api/notifications/read-all",
                        headers={"Authorization": f"Bearer {captain_token}"})
        assert r.status_code == 200
        print("PASS: mark all read works")
