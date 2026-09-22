# SANJAYA — Privacy-First AI Home Safety & Visitor-Awareness Platform

> *"Know who's there. Stay in control."*

SANJAYA is an edge-first, ethical AI platform engineered to transform ordinary entrance cameras into intelligent, privacy-respecting awareness systems. 

Unlike conventional surveillance systems that trigger false alarms or default to treating strangers as threats, SANJAYA provides context without paranoia:

- **Known/Trusted Person**: Displays "Known — [Name]" with a warm recognition badge.
- **Unknown Person**: Displays "Unknown person approaching", captures a verified snapshot, and guides the homeowner through verification without accusatory labeling.
- **Homeowner in Control**: The homeowner chooses whether to talk via two-way audio, mark safe, dismiss, or activate emergency escalation.

---

## The 5-Step Awareness Concept

```
┌─────────┐     ┌────────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│   SEE   │ ──> │ UNDERSTAND │ ──> │  VERIFY  │ ──> │  RESPOND  │ ──> │  ESCALATE  │
└─────────┘     └────────────┘     └──────────┘     └───────────┘     └────────────┘
 Live camera      Neural Face        Homeowner        Live 2-way         30s timer
 feed & motion    Recognition        alert modal      audio & chimes     dispatch
```

1. **SEE**: Low-latency edge camera feed with real-time motion and bounding-box detection.
2. **UNDERSTAND**: Edge neural network evaluates face embeddings against enrolled trusted profiles.
3. **VERIFY**: Real-time homeowner notification with snapshot and camera location zone.
4. **RESPOND**: Instant two-way intercom talk, quick doorbell chime response, or mark as safe.
5. **ESCALATE**: 30-second abortable SOS countdown that dispatches GPS coordinates, snapshots, and alerts to designated emergency contacts.

---

## Key Features

- **Indoor Monitor Kiosk Mode**: Tailored for wall-mounted touchscreens and counter tablets with high-contrast layout, enlarged tap targets, and continuous live telemetry.
- **Decoupled AI/CV Architecture**: Built on a clean JSON RPC / REST interface (`/ai-service/interface.ts`) enabling plug-and-play replacement of the in-browser simulator with a real Python OpenCV / FaceNet / YOLO edge pipeline (`/ai-service/detection_service.py`).
- **Emergency SOS Escalation Machine**:
  - 30-second high-visibility audible countdown.
  - Large cancel button to prevent false alarms.
  - Automatic geolocation capture (`navigator.geolocation`).
  - Multi-tier emergency contact dispatch sequence with delivery confirmation logs.
- **Trusted Circle Directory**: Enroll family members, neighbors, and trusted delivery workers with photos, relationship labels, and custom notes.
- **Incident Timeline & Audit Trail**: Chronological immutable log of detections, classifications, homeowner responses, and resolutions.
- **Supabase Integration**: Complete PostgreSQL schema (`/supabase/schema.sql`) and Row-Level Security policies (`/supabase/policies.sql`) ready for production deployment.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Web Audio API.
- **Backend Server**: Node.js, Express, tsx, esbuild.
- **Database & Auth**: Supabase PostgreSQL with RLS policies, Supabase Realtime event bus.
- **AI/CV Layer**: Python Face Recognition / YOLOv8 edge service blueprint + client-side realistic simulator.

---

## Directory Structure

```
├── ai-service/
│   ├── detection_service.py   # Python OpenCV/FaceNet edge inference service
│   ├── interface.ts           # Protocol contract for detection engine
│   └── requirements.txt       # Python dependencies (opencv-python, facenet-pytorch)
├── supabase/
│   ├── schema.sql             # PostgreSQL tables, relations, and indexes
│   └── policies.sql           # Row Level Security (RLS) security definitions
├── src/
│   ├── components/
│   │   ├── auth/              # Sign in / Sign up screens
│   │   ├── cameras/           # Camera stream grid and management
│   │   ├── common/            # Header, Desktop Sidebar, Mobile Nav
│   │   ├── dashboard/         # Main situational awareness dashboard
│   │   ├── emergency/         # Priority emergency contacts manager
│   │   ├── incidents/         # Incident logs and timeline audit viewer
│   │   ├── live/              # Low-latency camera canvas player & 2-way intercom
│   │   ├── modals/            # Detection verification modals
│   │   ├── notifications/     # Notification drawer & security logs
│   │   ├── people/            # Trusted persons circle management
│   │   ├── profile/           # User account and home coordinates
│   │   ├── settings/          # System rules, privacy controls & kiosk toggle
│   │   └── sos/               # 30s SOS countdown overlay and escalation modal
│   ├── context/
│   │   ├── AuthContext.tsx    # User session & identity state
│   │   └── DataContext.tsx    # State store with localStorage & Realtime sync
│   ├── lib/
│   │   └── supabase.ts        # Supabase client & Event Bus
│   ├── services/
│   │   ├── cvSimulator.ts     # Realistic CV event generator
│   │   ├── mockData.ts        # Seed data for immediate evaluation
│   │   └── sosService.ts      # SOS countdown & dispatch state machine
│   ├── types/
│   │   └── index.ts           # Core domain TypeScript models
│   ├── utils/
│   │   └── audio.ts           # Web Audio API procedural chime & siren synthesizer
│   ├── App.tsx                # Master responsive shell
│   └── main.tsx               # Client entry point
├── server.ts                  # Express REST backend + Vite middleware
└── package.json
```

---

## Quick Start (Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (optional for local simulation mode, as local mock mode runs out of the box):
```bash
cp .env.example .env
```

```env
# Optional Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Interactive Simulators

Click the **"Test Simulation"** dropdown in the top navigation bar to trigger realistic events:

1. **Unknown Person**: Triggers the detection alert modal with snapshot, confidence rating, and prompt to initiate two-way talk or monitor live.
2. **Known Person (Arjun)**: Generates a recognized family member arrival card with confidence score and greeting.
3. **Doorbell Chime**: Triggers the realistic two-tone chime via Web Audio API.
4. **SOS Panic Trigger**: Click the red **SOS** button in the header or on the live camera page to experience the 30-second countdown, location acquisition, and emergency contact dispatch cycle.

---

## Supabase Database Setup

To connect to a live Supabase database:

1. Create a new project in [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** in the Supabase Dashboard.
3. Copy and run the contents of `supabase/schema.sql`.
4. Copy and run the contents of `supabase/policies.sql`.
5. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.

---

## Connecting the Python Computer Vision Service

1. Navigate to `/ai-service/`:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python detection_service.py
   ```
2. The service listens on `http://localhost:5050` and provides endpoints:
   - `POST /detect` — Accepts raw frames, runs YOLO + face embeddings, and returns matches against enrolled profiles.
   - `POST /enroll` — Enrolls new reference faces for trusted circle members.

---

## License & Ethics Statement

SANJAYA adheres strictly to ethical AI principles:
- No biometric data is sold, monetized, or shared with third-party ad networks.
- Unknown individuals approaching residential areas are never pre-labeled as threats.
- All escalation actions require direct human authorization or an explicit countdown lapse.
