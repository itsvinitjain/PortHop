from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from jose import jwt, JWTError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"
MOCK_OTP = "123456"
PORTS = ["Gateway of India", "Mandwa", "Alibaug", "Elephanta", "Mora", "Karanja", "Rewas", "Murud"]

security = HTTPBearer(auto_error=False)

# ─── Models ───────────────────────────────────────────────────────────────────

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: Optional[str] = None
    photo: Optional[str] = None
    role: Optional[str] = None  # "captain" | "passenger"
    rating: float = 5.0
    total_ratings: int = 0
    push_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Trip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    captain_id: str
    from_port: str
    to_port: str
    date: str
    time: str
    seats: int
    available_seats: int
    price: float
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TripCreate(BaseModel):
    from_port: str
    to_port: str
    date: str
    time: str
    seats: int
    price: float

class Interest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    passenger_id: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    sender_id: str
    receiver_id: str
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    title: str
    body: str
    read: bool = False
    related_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    text: str

# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_token(user_id: str) -> str:
    return jwt.encode({"user_id": user_id}, SECRET_KEY, algorithm=ALGORITHM)

def strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

def serialize(obj: BaseModel) -> dict:
    d = obj.model_dump()
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        doc = await db.users.find_one({"id": user_id})
        if not doc:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**strip_id(doc))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@api_router.post("/auth/send-otp")
async def send_otp(data: dict):
    phone = str(data.get("phone", "")).strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    return {"message": "OTP sent", "phone": phone}

@api_router.post("/auth/verify-otp")
async def verify_otp(data: dict):
    phone = str(data.get("phone", "")).strip()
    otp = str(data.get("otp", "")).strip()
    if otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP. Use 123456 for demo.")
    doc = await db.users.find_one({"phone": phone})
    if not doc:
        user = User(phone=phone)
        await db.users.insert_one(user.model_dump())
        doc = user.model_dump()
    else:
        strip_id(doc)
    user = User(**doc)
    token = create_token(user.id)
    return {"token": token, "user": serialize(user), "is_new": not user.name}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return serialize(current_user)

@api_router.put("/auth/profile")
async def update_profile(data: dict, current_user: User = Depends(get_current_user)):
    update = {}
    if "name" in data and data["name"]:
        update["name"] = data["name"]
    if "photo" in data:
        update["photo"] = data["photo"]
    if "role" in data and data["role"] in ["captain", "passenger"]:
        update["role"] = data["role"]
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields")
    await db.users.update_one({"id": current_user.id}, {"$set": update})
    doc = strip_id(await db.users.find_one({"id": current_user.id}))
    return serialize(User(**doc))

@api_router.put("/auth/push-token")
async def update_push_token(data: dict, current_user: User = Depends(get_current_user)):
    await db.users.update_one({"id": current_user.id}, {"$set": {"push_token": data.get("token", "")}})
    return {"message": "Updated"}

@api_router.get("/ports")
async def get_ports():
    return {"ports": PORTS}

# ─── Trip Routes ──────────────────────────────────────────────────────────────

@api_router.get("/trips")
async def search_trips(
    from_port: Optional[str] = None,
    to_port: Optional[str] = None,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query: dict = {"status": "active"}
    if from_port:
        query["from_port"] = from_port
    if to_port:
        query["to_port"] = to_port
    if date:
        query["date"] = date
    trips = await db.trips.find(query).sort("created_at", -1).to_list(100)
    
    # Batch fetch all captain IDs to avoid N+1 queries
    captain_ids = list(set(t["captain_id"] for t in trips))
    captains_cursor = db.users.find({"id": {"$in": captain_ids}})
    captains_list = await captains_cursor.to_list(len(captain_ids))
    captains_map = {strip_id(c)["id"]: User(**strip_id(c)) for c in captains_list}
    
    result = []
    for t in trips:
        strip_id(t)
        trip = Trip(**t)
        td = serialize(trip)
        cap = captains_map.get(trip.captain_id)
        if cap:
            td["captain"] = {"id": cap.id, "name": cap.name, "photo": cap.photo, "rating": cap.rating, "total_ratings": cap.total_ratings}
        result.append(td)
    return result

@api_router.post("/trips")
async def create_trip(data: TripCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "captain":
        raise HTTPException(status_code=403, detail="Only captains can create trips")
    trip = Trip(
        captain_id=current_user.id,
        from_port=data.from_port,
        to_port=data.to_port,
        date=data.date,
        time=data.time,
        seats=data.seats,
        available_seats=data.seats,
        price=data.price
    )
    await db.trips.insert_one(trip.model_dump())
    return serialize(trip)

@api_router.get("/trips/captain/my")
async def get_my_trips(current_user: User = Depends(get_current_user)):
    if current_user.role != "captain":
        raise HTTPException(status_code=403, detail="Captains only")
    trips = await db.trips.find({"captain_id": current_user.id}).sort("created_at", -1).to_list(100)
    result = []
    for t in trips:
        strip_id(t)
        trip = Trip(**t)
        td = serialize(trip)
        interests = await db.interests.find({"trip_id": trip.id}).to_list(100)
        td["interests_count"] = len(interests)
        td["confirmed_count"] = sum(1 for i in interests if i.get("status") == "confirmed")
        td["pending_count"] = sum(1 for i in interests if i.get("status") == "pending")
        result.append(td)
    return result

@api_router.get("/trips/{trip_id}/interests")
async def get_trip_interests(trip_id: str, current_user: User = Depends(get_current_user)):
    t = await db.trips.find_one({"id": trip_id})
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    if t["captain_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip")
    interests = await db.interests.find({"trip_id": trip_id}).to_list(100)
    
    # Batch fetch all passenger IDs to avoid N+1 queries
    passenger_ids = list(set(i["passenger_id"] for i in interests))
    passengers_cursor = db.users.find({"id": {"$in": passenger_ids}})
    passengers_list = await passengers_cursor.to_list(len(passenger_ids))
    passengers_map = {strip_id(p)["id"]: User(**strip_id(p)) for p in passengers_list}
    
    result = []
    for i in interests:
        strip_id(i)
        interest = Interest(**i)
        id_ = serialize(interest)
        p = passengers_map.get(interest.passenger_id)
        if p:
            id_["passenger"] = {"id": p.id, "name": p.name, "photo": p.photo, "rating": p.rating}
        result.append(id_)
    return result

@api_router.get("/trips/{trip_id}/my-interest")
async def get_my_interest(trip_id: str, current_user: User = Depends(get_current_user)):
    doc = await db.interests.find_one({"trip_id": trip_id, "passenger_id": current_user.id})
    if not doc:
        return None
    return serialize(Interest(**strip_id(doc)))

@api_router.get("/trips/{trip_id}")
async def get_trip(trip_id: str, current_user: User = Depends(get_current_user)):
    t = await db.trips.find_one({"id": trip_id})
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    strip_id(t)
    trip = Trip(**t)
    td = serialize(trip)
    cap_doc = await db.users.find_one({"id": trip.captain_id})
    if cap_doc:
        strip_id(cap_doc)
        cap = User(**cap_doc)
        td["captain"] = {"id": cap.id, "name": cap.name, "photo": cap.photo, "rating": cap.rating, "total_ratings": cap.total_ratings}
    return td

@api_router.post("/trips/{trip_id}/interest")
async def express_interest(trip_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "passenger":
        raise HTTPException(status_code=403, detail="Only passengers can express interest")
    t = await db.trips.find_one({"id": trip_id})
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    existing = await db.interests.find_one({"trip_id": trip_id, "passenger_id": current_user.id})
    if existing:
        return serialize(Interest(**strip_id(existing)))
    if t.get("available_seats", 0) <= 0:
        raise HTTPException(status_code=400, detail="No seats available")
    interest = Interest(trip_id=trip_id, passenger_id=current_user.id)
    await db.interests.insert_one(interest.model_dump())
    notif = Notification(
        user_id=t["captain_id"],
        type="new_interest",
        title="New Interest! 🌊",
        body=f"{current_user.name or 'Someone'} wants to join your trip to {t['to_port']}",
        related_id=trip_id
    )
    await db.notifications.insert_one(notif.model_dump())
    return serialize(interest)

@api_router.put("/trips/{trip_id}/interest/{interest_id}")
async def update_interest_status(trip_id: str, interest_id: str, data: dict, current_user: User = Depends(get_current_user)):
    new_status = data.get("status")
    if new_status not in ["confirmed", "declined"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    t = await db.trips.find_one({"id": trip_id})
    if not t or t["captain_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip")
    i = await db.interests.find_one({"id": interest_id, "trip_id": trip_id})
    if not i:
        raise HTTPException(status_code=404, detail="Interest not found")
    old_status = i["status"]
    await db.interests.update_one({"id": interest_id}, {"$set": {"status": new_status}})
    if new_status == "confirmed" and old_status != "confirmed":
        await db.trips.update_one({"id": trip_id}, {"$inc": {"available_seats": -1}})
    elif new_status == "declined" and old_status == "confirmed":
        await db.trips.update_one({"id": trip_id}, {"$inc": {"available_seats": 1}})
    notif = Notification(
        user_id=i["passenger_id"],
        type=new_status,
        title="Trip Confirmed! 🎉" if new_status == "confirmed" else "Trip Update",
        body=f"Your trip {t['from_port']} → {t['to_port']} was {'confirmed' if new_status == 'confirmed' else 'declined'}",
        related_id=trip_id
    )
    await db.notifications.insert_one(notif.model_dump())
    updated = strip_id(await db.interests.find_one({"id": interest_id}))
    return serialize(Interest(**updated))

# ─── Chat Routes ──────────────────────────────────────────────────────────────

@api_router.get("/chat/{trip_id}/{other_user_id}")
async def get_messages(trip_id: str, other_user_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.messages.find({
        "trip_id": trip_id,
        "$or": [
            {"sender_id": current_user.id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user.id}
        ]
    }).sort("created_at", 1).to_list(500)
    return [serialize(Message(**strip_id(m))) for m in messages]

@api_router.post("/chat/{trip_id}/{other_user_id}")
async def send_message(trip_id: str, other_user_id: str, data: MessageCreate, current_user: User = Depends(get_current_user)):
    t = await db.trips.find_one({"id": trip_id})
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    if current_user.role == "passenger":
        if not await db.interests.find_one({"trip_id": trip_id, "passenger_id": current_user.id}):
            raise HTTPException(status_code=403, detail="Express interest first to unlock chat")
    else:
        if not await db.interests.find_one({"trip_id": trip_id, "passenger_id": other_user_id}):
            raise HTTPException(status_code=403, detail="No interest from this passenger")
    msg = Message(trip_id=trip_id, sender_id=current_user.id, receiver_id=other_user_id, text=data.text)
    await db.messages.insert_one(msg.model_dump())
    return serialize(msg)

# ─── Notification Routes ──────────────────────────────────────────────────────

@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifs = await db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).to_list(50)
    return [serialize(Notification(**strip_id(n))) for n in notifs]

@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": current_user.id}, {"$set": {"read": True}})
    return {"message": "All marked as read"}

@api_router.put("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id, "user_id": current_user.id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# ─── App ──────────────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
