# Lyka Realty — Voice Lead Agent & AI Property Assistant MVP Architecture 🏗️🎙️

A production-grade, human-sounding outbound voice qualification system and conversational AI property assistant built with **Google Gemini Live Native Audio (`gemini-3.8-live`)**, **Google Gemini Flash (`gemini-3.5-flash`)**, **Twilio Voice PSTN Telephony**, **MySQL CRM Persistence**, an **Express full-stack Node.js backend** (with optional **Python FastAPI telephony service**), and a **React 19 + TypeScript + Tailwind CSS** frontend.

---

## 📐 High-Level Architecture Diagram

```
[ Real Customer / Mobile Phone ]                 [ Website Customer / Browser User ]
              │                                                     │
              │ PSTN Call (G.711 mu-law 8kHz)                       │ Web Audio API (16kHz PCM mic / 24kHz audio)
              ▼                                                     │ & REST JSON Chat Messages
      [ Twilio Telephony ]                                          ▼
              │                                        [ React 19 Frontend Client (App.tsx) ]
              │ WebSocket Stream (/api/twilio/media)     • Vivo Mobile Full-Screen Call UI
              ▼                                          • Native Web Audio Marimba Ringtone
   ┌──────────────────────────────────────────────────┐  • 10-Second Auto-Miss Countdown
   │       Node.js / Express Server (server.ts)       │  • Smart VAD & Barge-in Suppression
   │   (or Python FastAPI Service in /backend)        │  • Interactive Property Requirement Cards
   ├──────────────────────────────────────────────────┤  • Multi-Language & Executive Persona Switcher
   │                                                  │  • Date-Wise Analytics (Hot/Warm/Cold)
   │  • Gemini Live Bridge (audio/pcm 16k ⇄ 24k)     │  • Multi-Format Export (Excel CSV, PDF, JSON)
   │  • Structured Lead Extraction (update_lead_info) │  • Codebase ZIP Exporter & GitHub Sync
   │  • Zero-AI-Disclosure System Prompt & Persona    │◄────────────────────┘
   │  • Soft Positive Rejection Objection Engine      │   WebSocket (/api/live-ws)
   │  • Identity Confirmation & Alt Contact Logic     │   & REST API Endpoints (/api/chat, /api/call)
   │  • Telephony API (/api/call, /api/twilio/*)      │
   │  • G.711 mu-law ⇄ Linear PCM Audio Transcoder    │
   └─────────────┬──────────────────────┬─────────────┘
                 │                      │
                 ▼                      ▼
      [ Google Gemini API ]    [ MySQL Database (db.ts & leadService.ts) ]
        • gemini-3.8-live        • customers (identity & contacts)
        • gemini-3.5-flash       • leads (22+ qualification slots)
        • Function Calling       • conversations (session-scoped channels)
                                 • conversation_messages (turn history)
                                 • lead_interactions (audit log)
```

---

## 🗂️ Complete File Structure & Directory Tree

```
├── .env                              # Active local environment variables
├── .env.example                      # Environment variables template (GEMINI_API_KEY, DB, TWILIO)
├── MVP.md                            # Comprehensive MVP architecture & module interaction guide
├── README.md                         # Project quickstart, executive overview, and setup guide
├── db.ts                             # MySQL connection pool & safe idempotent schema migration
├── index.html                        # HTML5 entry point with metadata, viewport, and root mounting
├── leadService.ts                    # Shared CRM service (upsertLead, conversations, messages)
├── metadata.json                     # Application metadata, capabilities, and permissions
├── package.json                      # NPM dependencies, scripts, dev server, and build config
├── server.ts                         # Full-stack Express backend, WebSockets, Twilio, Gemini bridge
├── tsconfig.json                     # TypeScript compiler configuration for client app
├── tsconfig.node.json                # TypeScript compiler configuration for Node/Vite tools
├── vite.config.ts                    # Vite configuration with React and Tailwind CSS v4 plugins
├── backend/                          # Standalone Python FastAPI Telephony Microservice
│   ├── .env.example                  # Python backend environment template
│   ├── config.py                     # Pydantic settings management
│   ├── main.py                       # FastAPI application, Twilio webhooks, WebSocket media bridge
│   ├── requirements.txt              # Python dependencies (fastapi, uvicorn, twilio, google-genai)
│   ├── twilio_service.py             # Twilio outbound call creation & TwiML generation
│   └── voice_agent.py                # Audio resampling (mu-law ⇄ PCM) & Gemini prompt logic
└── src/
    ├── App.tsx                       # Root application controller, state orchestrator, tabs, modals
    ├── index.css                     # Tailwind CSS v4, dark/light theme variables, luxury styling
    ├── main.tsx                      # React 19 application bootstrapping
    ├── components/
    │   ├── ApiUsageTab.tsx           # Real-time API consumption metrics, session counts, quotas
    │   ├── ArchitectureCard.tsx      # Interactive system architecture visualization
    │   ├── CallControls.tsx          # Microphone selector, mute toggle, audio visualizer meter
    │   ├── CallHistoryView.tsx       # Past call records, detailed modals, turn-by-turn transcripts
    │   ├── DashboardStatsView.tsx    # Core conversion KPIs, operational metrics, reset confirmation
    │   ├── DateLeadVisualization.tsx # Date-filtered Hot/Warm/Cold charts, qualification ratios
    │   ├── EditLeadModal.tsx         # Prospect editing form, status override, internal notes
    │   ├── ExportModal.tsx           # Basic JSON/CSV export modal
    │   ├── Header.tsx                # App bar, executive persona toggle, language selector, ZIP export
    │   ├── ImportLeadsModal.tsx      # CSV lead importer with preview and mapping
    │   ├── IncomingCallScreen.tsx    # Vivo-style full-screen call UI with ringtone & 10s auto-miss
    │   ├── LeadPanel.tsx             # Real-time 6 CRM qualification slots and spoken notes card
    │   ├── LeadReportExportModal.tsx # Advanced date & status filtered export (Excel CSV, PDF, JSON)
    │   ├── LeadTable.tsx             # Comprehensive leads table with calling actions and filtering
    │   ├── LiveConnectInspector.tsx  # Real-time dashboard card (who is connected, what they told)
    │   ├── SimulatedCallScreen.tsx   # Outbound calling view, audio waveforms, Twilio polling, summary
    │   ├── StageTracker.tsx          # 5-stage visual progress tracker (Interest → Timeline)
    │   ├── TranscriptView.tsx        # Live conversation turns, audio energy pulses, barge-in badges
    │   └── TwilioConfigModal.tsx     # Twilio SID, Auth Token, and caller ID configuration modal
    ├── storage/
    │   ├── calls.ts                  # LocalStorage persistence for CallRecords, date calculations
    │   ├── index.ts                  # Re-exports for storage utilities
    │   ├── leads.ts                  # Default seed leads, CRUD operations, DNC suppression
    │   └── settings.ts               # Local persistence for user settings and preferences
    ├── types/
    │   └── agent.ts                  # TypeScript interfaces for Leads, Calls, Personas, VAD, Slots
    └── utils/
        ├── audio.ts                  # Web Audio API engine (LiveAudioPlayer, LiveMicRecorder, PhoneRingtone)
        ├── csv.ts                    # CSV lead parser and serializer
        ├── exportReport.ts           # Multi-format report generator (Excel CSV, printable PDF, JSON)
        └── scoring.ts                # Deterministic lead scoring (HOT, WARM, COLD, OPT-OUT)
```

---

## 🔗 How Components & Modules Are Connected

### 1. Root Application State & Flow (`src/App.tsx`)
`App.tsx` serves as the primary UI controller:
- **Dual Display Modes**:
  - **Welcome Screen**: Visual luxury orb animation, brand logo, language selection (English vs. தமிழ்), and one-click launch for either Voice or Text mode.
  - **Chat & Voice Workspace**: Multi-turn conversation stream, live mic visualizer, customer requirement cards, manual lead editing drawers, and connection status badges.
- **State Managed**: `messages`, `voiceState`, `lead`, `theme`, `language`, `sessionId`, `conversationId`, `audioEnergy`, `micEnergy`, `saveStatus`.
- **Connections**:
  - Instantiates `LiveAudioPlayer` and `LiveMicRecorder` from `src/utils/audio.ts`.
  - Connects to `/api/live-ws` for bidirectional voice streaming.
  - Sends text turns to `/api/chat` via HTTP POST.
  - Syncs extracted qualification slots with backend MySQL persistence via `/api/lead/save` and `leadService.ts`.

### 2. Enterprise MySQL Persistence Layer (`db.ts` & `leadService.ts`)
To support production CRM workflows, the system includes a hardened MySQL database layer:
- **Connection Pooling (`db.ts`)**: Manages up to 10 pooled connections with keep-alive pings and automatic reconnection.
- **Safe Schema Initialization (`initSchema()`)**:
  - Executes `CREATE DATABASE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`.
  - **Zero Data Loss Guarantee**: Never drops tables or truncates existing rows.
  - **Graceful Offline Fallback**: If MySQL/XAMPP is not running, the application logs a warning and operates smoothly using memory state without crashing.
- **Normalized Relational Schema**:
  1. `customers`: Prospect contact details (`id`, `full_name`, `phone`, `email`, `current_location`, `preferred_contact`, `created_at`).
  2. `leads`: 22+ qualification attributes (`id`, `customer_id`, `guest_session_id`, `intent`, `property_type`, `country`, `city`, `locality`, `budget_min`, `budget_max`, `currency`, `property_size`, `area_unit`, `bedrooms`, `bathrooms`, `amenities`, `timeline`, `temperature`, `notes`).
  3. `conversations`: Channel audit table (`id`, `lead_id`, `session_id`, `channel` [text/voice], `language`, `started_at`, `ended_at`).
  4. `conversation_messages`: Turn-by-turn history (`id`, `conversation_id`, `role`, `content`, `message_type`).
  5. `lead_interactions`: Event timeline (`id`, `lead_id`, `interaction_type`, `summary`, `metadata`).
- **Unified Upsert Engine (`leadService.ts`)**:
  - `upsertLead(sessionId, payload)`: The single source of truth for saving leads across both `/api/chat` and `/api/live-ws`.
  - Prevents duplicate lead records within the same guest session.
  - Parses budget strings (e.g., *"₹80 Lakhs"*, *"2.5M AED"*, *"$1.2M"*) into normalized `budget_min`, `budget_max`, and ISO `currency`.
  - Parses geographic locations into hierarchical `city`, `state_province`, and `country`.

### 3. Executive Personas & Language Engine (`src/types/agent.ts` & `server.ts`)
The system provides tailored executive personas engineered for natural rapport:
- **Lyka** (Female Senior Property Relationship Manager):
  - Primary voice across Tamil, English, Hindi, Arabic, and Tanglish.
  - Backed by Google Gemini prebuilt voice **`Kore`** (warm, natural, polished female tone).
- **Vinakya Mahadev** (Male Senior Property Portfolio Executive):
  - Dedicated male executive persona for Tamil and Chennai Tanglish.
  - Backed by Google Gemini prebuilt voice **`Puck`** (authoritative, friendly male tone).
- **Stark** (Male Senior Executive):
  - Male persona for English, Hindi, and Arabic.
- **Language Coverage**:
  - **Tamil**: Colloquial spoken Tamil (பேச்சுத் தமிழ்).
  - **Chennai Tanglish**: Natural urban conversational blend.
  - **English**: International executive English.
  - **Hindi**: Spoken conversational Hindi (हिंदी).
  - **Arabic**: Modern conversational Arabic (العربية).

### 4. Zero AI Disclosure, Identity Verification & Alt Contacts
- **Zero AI Disclosure**: The model speaks with 100% human cadence, natural breathing pauses, and contextual empathy, never stating or implying that it is an artificial intelligence.
- **Opening Identity Verification**:
  - Opens calls verifying the recipient's identity:
    > *"வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து லைகா பேசறேன். நான் [Lead Name] அவங்க கூட தான் பேசறேனாங்க, இல்ல வேற யாராச்சும் பேசறீங்களா?"*
    > *(English: "Vanakkam and hello! This is Lyka calling from Lyka Realty. Am I speaking with [Lead Name], or is someone else on the line?")*
- **Alternative Contact Handling**:
  - If a colleague, spouse, or family member answers:
    - The agent addresses them politely by name or relation.
    - Asks when the prospect will be available.
    - Inquires if they themselves have any property requirements.
    - Automatically updates the CRM `notes` slot (e.g., *"Attended by brother Ramesh; prospect traveling; callback requested tomorrow"*).

### 5. Structured Lead Extraction Tool Schema (`update_lead_info`)
Gemini's function calling engine executes structured extraction across 22+ parameters:
| Field | Type | Description / Valid Values |
|---|---|---|
| `name` | string | Customer full name |
| `phone` | string | Normalized contact phone number |
| `email` | string | Contact email address |
| `lead_source` | string | `instagram`, `facebook`, `youtube`, `google`, `friend`, `portal`, `referral`, `other` |
| `intent` | string | `buy`, `sell`, `rent`, `list_for_rent`, `lease`, `invest`, `buy_land`, `sell_land`, `valuation`, `agent_enquiry`, `general_enquiry` |
| `buyer_type` | string | `first-time homebuyer`, `investor`, `family upgrading`, `luxury buyer`, `landlord`, `seller`, `tenant` |
| `property_type` | string | `apartment`, `house`, `villa`, `townhouse`, `penthouse`, `residential_land`, `agricultural_land`, `commercial_land`, `farm`, `office`, `shop`, `warehouse`, `commercial`, `industrial` |
| `location` | string | Full verbatim location as stated (e.g., *"Tuticorin, Tamil Nadu"* or *"Downtown Dubai, UAE"*) |
| `city` / `state` / `country` | string | Normalized geographic entities |
| `budget` | string | Raw stated budget (e.g., *"₹85 Lakhs"*, *"3M AED"*, *"$900,000"*) |
| `currency` | string | Standard ISO currency: `INR`, `AED`, `USD`, `GBP`, `EUR`, `SGD` |
| `rental_period` | string | `monthly`, `annual` |
| `property_size` | string | Quantitative dimension (e.g., *"1500"*, *"5"*, *"2"*) |
| `area_unit` | string | `sqft`, `sqm`, `cents`, `acres`, `hectares`, `grounds`, `sqyd` |
| `bedrooms` | string | `1`, `2`, `3`, `4`, `5+`, `studio`, `2BHK`, `3BHK` |
| `bathrooms` | string | Number of bathrooms |
| `amenities` | string | Comma-separated list (e.g., *"swimming pool, gym, covered car parking, 24/7 security"*) |
| `timeline` | string | `immediately`, `within_1_month`, `within_3_months`, `within_6_months`, `just_exploring` |
| `qualification_status` | string | `HOT`, `WARM`, `COLD`, `PENDING`, `REACH_AGAIN`, `OPT_OUT` |
| `stage_reached` | integer | Active qualification stage (1 to 5) |
| `notes` | string | Key takeaways, callback preferences, and alternative contact observations |

### 6. Vivo Smartphone Browser Test Calling Screen (`src/components/IncomingCallScreen.tsx`)
- **OriginOS Chassis**: High-fidelity full-screen smartphone UI with 5G connectivity icons, dynamic time, and camera notch.
- **Web Audio Vivo Marimba Ringtone (`PhoneRingtone` in `src/utils/audio.ts`)**:
  - Custom polyphonic Web Audio oscillator generating the signature Vivo chord progression (E5 → G#5 → B5 → E6) without external MP3 files.
- **10-Second Auto-Miss Timer**:
  - Visual 10-second countdown ring.
  - If unanswered or declined, the ringtone stops, the screen closes, the lead status changes to **`NO_ANSWER`**, and a call record is archived.
- **Answer Call (Green Button)**:
  - Immediately silences ringtone, activates microphone capture, opens the WebSocket connection, and plays the personalized greeting.

### 7. Smart Noise-Immune VAD & Web Audio Engine (`src/utils/audio.ts`)
- **`LiveAudioPlayer`**: 24kHz linear PCM playback buffer with an 80ms jitter queue to prevent audio stuttering over variable network latencies.
- **`LiveMicRecorder` (Smart VAD)**:
  - Downsamples audio to 16kHz linear PCM.
  - **Dynamic Noise Floor Tracking**: Measures background room energy (fans, typing, breathing) and continuously adapts the gating threshold.
  - **Elevated Interruption Guard**: While the agent is actively speaking, the gate threshold rises dynamically (`Math.max(0.042, ambientFloor * 3.8)`) with multi-frame energy validation.
  - **Barge-In**: Interruption signals are dispatched only when genuine human vocalization is sustained, preventing false stops.

### 8. Twilio PSTN Telephony & Audio Transcoder (`server.ts`)
- **Outbound PSTN Trigger (`/api/call`)**:
  - Dials real mobile phone numbers using the Twilio REST API.
  - Automatically resolves public URLs (`PUBLIC_BASE_URL` or auto-detected forwarding domain).
  - Enforces safeguards against unverified trial numbers and accidental self-calling.
- **Bidirectional Audio Transcoding**:
  - Telephony G.711 mu-law (8kHz) ⇄ Gemini Live linear PCM (16kHz upload / 24kHz download).
  - Uses ITU-T G.711 companding mathematics:
    - `muLaw8kToPcm16k()`: Decodes 8-bit mu-law to 16-bit linear PCM and upsamples to 16,000 Hz.
    - `pcm24kToMuLaw8k()`: Downsamples 24,000 Hz Gemini audio by 3x and encodes to 8-bit mu-law.
- **Barge-In over Telephony**: When Gemini detects an interruption from the phone recipient, the server sends a Twilio `clear` event on the media stream to instantly purge queued phone audio.

### 9. Python FastAPI Alternative Telephony Service (`backend/`)
For teams operating Python-centric microservice infrastructures:
- **`backend/main.py`**: FastAPI application exposing `/api/call`, `/api/twilio/voice`, and `/api/twilio/status`.
- **`backend/twilio_service.py`**: Outbound call initialization and TwiML WebSocket stream generation.
- **`backend/voice_agent.py`**: Gemini Live native audio integration with Python `audioop` / struct companding routines.

### 10. Multi-Format Report Generator (`src/utils/exportReport.ts`)
- **Excel CSV**: Clean, sanitized CSV ready for Microsoft Excel, Google Sheets, or CRM imports.
- **Printable PDF**: Formatted executive report with KPI cards, qualification breakdowns, and detailed call transcripts.
- **JSON**: Full hierarchical export of lead objects, slot attributes, and turn-by-turn timestamps.

---

## 📡 API Endpoints Reference

### HTTP Endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service health status, Gemini model, and key verification |
| `GET` | `/api/health/db` | MySQL connection status and database name |
| `POST` | `/api/chat` | Multi-turn text chat with Gemini Flash and tool extraction |
| `POST` | `/api/conversation` | Create session-scoped conversation tracker |
| `GET` | `/api/lead` | Fetch current session's lead from MySQL |
| `POST` | `/api/lead/save` | Manual lead save/update from frontend summary panel |
| `GET` | `/api/usage` | Real-time API consumption metrics, daily quotas, rate limits |
| `GET` | `/api/config` | Available personas, voices, and supported languages |
| `GET` | `/api/twilio/config` | Twilio settings and configuration status |
| `POST` | `/api/twilio/config` | Save Twilio SID, Auth Token, and phone number |
| `GET` | `/api/twilio/account-info` | Fetch live Twilio account details, numbers, verified caller IDs |
| `POST` | `/api/call` | Place outbound PSTN telephone call via Twilio |
| `POST` | `/api/twilio/voice` | Webhook returning TwiML stream when phone answers |
| `POST` | `/api/twilio/status` | Twilio call lifecycle status updates callback |
| `GET` | `/api/twilio/call/:callSid` | Poll live status and transcripts for a specific call |
| `POST` | `/api/github-push` | Commit and push codebase to GitHub using Personal Access Token |
| `GET` | `/api/download-zip` | Download complete project source code as a ZIP archive |

### WebSocket Endpoints
| Path | Protocol | Purpose |
|---|---|---|
| `/api/live-ws` | `ws:` / `wss:` | Browser Web Audio streaming to Gemini Live (`gemini-3.8-live`) |
| `/api/twilio/media` | `ws:` / `wss:` | Twilio Media Stream bidirectional audio bridge |

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+ (or Bun)
- Google Gemini API Key
- (Optional) Local MySQL or XAMPP running on port 3306
- (Optional) Twilio Account for real mobile telephony
- (Optional) Python 3.10+ for the `backend/` microservice

### Step-by-Step Execution
```bash
# 1. Install Node.js dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, DB settings, and Twilio credentials

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with Lyka. You can export the complete project anytime by clicking **"Download ZIP"** in the top-right corner.

