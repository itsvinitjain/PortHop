# PortHop PRD — Sea Trip Booking App

## Original Problem Statement
Build a mobile app called PortHop for iOS and Android.  
**Tagline**: Hop across the sea, together.

Two users: Captain and Passenger. Signup via mobile OTP only. Name + photo. No documents.
- **Captain**: List a trip (From port → To port → Date → Time → Seats → Price → Post). See listings. Chat with interested passengers. Confirm or decline.
- **Passenger**: Search From → To → Date. See listing cards with captain photo, name, rating, price, seats left. Express interest. Chat with captain. Get confirmed.
- **Chat**: Unlocks when passenger expresses interest. Text only.
- **Notifications**: New interest, trip confirmed, 30 min reminder.
- **Preloaded ports**: Gateway of India, Mandwa, Alibaug, Elephanta, Mora, Karanja, Rewas, Murud.
- **Design**: Clean, premium. Sunset Gold + Deep Sea Blue + White. Minimal screens.
- **No payments. No maps. No KYC. No admin panel. V1 only.**

---

## User Choices (Confirmed)
- Mock OTP (always `123456`) for V1
- Expo Push Notifications (built-in)
- Photos stored as base64 in MongoDB
- Clean & minimal design — Sunset Gold + Deep Sea Blue + White

---

## Architecture

### Backend (FastAPI + MongoDB)
- **Language**: Python / FastAPI
- **Database**: MongoDB via Motor (async)
- **Auth**: JWT (python-jose) with mock OTP (always 123456)
- **Port**: 8001, all routes prefixed with `/api`

### Frontend (React Native Expo)
- **Framework**: Expo Router v6 (file-based routing)
- **State**: React Context (AuthContext)
- **Storage**: AsyncStorage (cross-platform token persistence)
- **Fonts**: PlayfairDisplay Bold (headings) + Manrope (body)
- **Icons**: @expo/vector-icons (Ionicons)

### Data Models
- **User**: id, phone, name, photo (base64), role, rating, push_token
- **Trip**: id, captain_id, from_port, to_port, date, time, seats, available_seats, price, status
- **Interest**: id, trip_id, passenger_id, status (pending/confirmed/declined)
- **Message**: id, trip_id, sender_id, receiver_id, text, created_at
- **Notification**: id, user_id, type, title, body, read, related_id

---

## What's Been Implemented (2026-03-08)

### Auth Flow
- [x] Phone number entry screen (with +91 prefix)
- [x] OTP verification (mock - always 123456)
- [x] Role selection: Captain / Passenger
- [x] Profile setup: Name + Photo (base64 image picker)
- [x] JWT token-based session management
- [x] Persistent sessions via AsyncStorage

### Captain Features
- [x] Dashboard: My trips list with interest/confirmation counts
- [x] Post Trip form: Port picker modal, date, time, seats stepper, price
- [x] Trip detail: View interested passengers
- [x] Confirm/Decline passenger interest
- [x] Chat with interested passengers
- [x] Notifications: new interest alerts

### Passenger Features
- [x] Explore screen: Port-based search (from/to)
- [x] Trip cards: Captain photo, name, rating, price, seats
- [x] Trip detail: Express interest
- [x] Interest status tracking (pending/confirmed/declined)
- [x] Chat with captain after expressing interest
- [x] Notifications: confirmation alerts

### Shared
- [x] Chat screen: Real-time (3s polling), message bubbles
- [x] Notifications screen: Unread indicator, mark all read
- [x] Profile screen: Edit name/photo, logout
- [x] Bottom tab navigation (Captain: 4 tabs, Passenger: 3 tabs)
- [x] 8 preloaded ports dropdown

### Backend APIs (18 endpoints)
- `/api/auth/*`: send-otp, verify-otp, me, profile, push-token
- `/api/trips/*`: search, create, my-trips, detail, interests, express-interest, update-interest
- `/api/chat/:tripId/:userId`: get/send messages
- `/api/notifications`: get, mark-read, mark-all-read

---

## Design Tokens
- **Primary**: Deep Sea Blue `#0A2342`
- **Accent**: Sunset Gold `#F5A623`
- **Background**: `#F8FAFC`
- **Card bg**: White with 12px shadow
- **Fonts**: PlayfairDisplay_700Bold (headings), Manrope family (body)
- **Spacing**: 8pt grid

---

## Prioritized Backlog

### P0 (V1 — Done)
- [x] Full auth flow
- [x] Captain trip posting
- [x] Passenger trip search & interest
- [x] Chat system (polling)
- [x] Notifications

### P1 (V2 — Next Sprint)
- [ ] Real SMS OTP integration (Twilio/Firebase)
- [ ] WebSocket-based real-time chat (replace polling)
- [ ] Expo Push Notifications (actual push to device)
- [ ] Trip cancellation by captain
- [ ] Passenger rating system after trip
- [ ] Captain's trip history (completed trips)
- [ ] 30-minute trip reminders

### P2 (V3 — Future)
- [ ] Trip sharing (deep link)
- [ ] Captain reputation: show trip count, reviews
- [ ] Passenger wishlist / saved trips
- [ ] Weather integration for trip dates
- [ ] Multi-language support (Marathi/Hindi)
- [ ] In-app onboarding tutorial

---

## Next Tasks (Immediate)
1. Integrate real OTP (Twilio SMS) to replace mock
2. Add WebSocket chat for real-time messaging
3. Implement Expo Push Notifications for background alerts
4. Add trip cancellation feature for captains
5. Add passenger-captain mutual rating after trip completion
