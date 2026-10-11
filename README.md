# Lyka Realty — AI Voice Lead Agent & Property Assistant 🎙️🏡

A production-grade, human-sounding outbound real estate qualification calling system and inbound conversational AI property assistant powered by **Google Gemini Live Native Audio (`gemini-3.8-live`)**, **Google Gemini Flash (`gemini-3.5-flash`)**, **Twilio Voice PSTN Telephony**, and **MySQL CRM Persistence**.

The system empowers real estate brokerages, developers, and property consultants to qualify leads at scale through human-like natural conversations across **Tamil, English, Hindi, Arabic, and Chennai Tanglish**, extracting structured CRM qualification slots in real time.

---

## 🌟 Key Highlights

- **Dual AI Operation Modes**:
  - **Outbound Voice Calling Agent (`mode: agent`)**: Telephony and browser-based outbound qualification calling with zero AI disclosure, identity verification, objection handling, and structured slot extraction.
  - **Inbound AI Property Assistant (`mode: chatbot`)**: Customer-facing property assistant featuring an interactive welcome orb, rich text chat, voice streaming, and real-time requirement cards.
- **Executive Personas & Identity Verification**:
  - **Lyka** (Female Senior Property Relationship Manager) across all languages (Tamil, English, Hindi, Arabic, Tanglish).
  - **Vinakya Mahadev** (Male Senior Property Portfolio Executive for Tamil & Chennai Tanglish).
  - **Stark** (Male Senior Executive for English, Hindi, and Arabic).
  - **Zero AI Disclosure**: 100% human cadence, warmth, active listening, and contextual empathy.
  - **Identity Confirmation**: Verifies the call recipient before qualification (*"Vanakkam! Am I speaking with [Lead Name], or someone else?"*).
  - **Alternative Contact Recording**: If a family member, colleague, or representative answers, the agent politely notes who answered in the CRM slot records.
- **Enterprise MySQL CRM Persistence (`db.ts` & `leadService.ts`)**:
  - Normalized schema: `customers`, `leads`, `conversations`, `conversation_messages`, and `lead_interactions`.
  - **Single Shared Upsert Service**: Both text chat (`/api/chat`) and voice calling (`/api/live-ws`) share the exact same `upsertLead()` logic, preventing duplicate records.
  - **Safe Offline Fallback**: Idempotent schema initialization (`CREATE TABLE IF NOT EXISTS`) ensures the app runs smoothly even if MySQL is disconnected.
- **Vivo Smartphone Browser Test Calling Screen**:
  - Full-screen smartphone chassis styled after Vivo OriginOS / Funtouch OS with 5G status, time, and camera notch.
  - Native Web Audio API synthesis of the iconic **Vivo Marimba Ringtone** (zero external audio files).
  - **10-Second Auto-Miss Timer**: If the user does not answer within 10 seconds, the call automatically terminates, the lead is moved to `NO_ANSWER`, and a missed call record is logged.
  - **Answer Call (Green Button)**: Immediately connects to the live Gemini agent session.
- **Smart Voice Activity Detection (VAD) & Noise Immunity**:
  - Dynamic noise floor gating filters out ambient computer fans, room hum, breathing, and typing clicks.
  - Multi-frame energy debounce ensures the agent does not get interrupted by background noise.
  - Barge-in (interruption) triggers **only when a real person speaks** with sustained vocal energy.
- **Global Real Estate Intent & Multi-Currency Engine**:
  - **Comprehensive Intents**: Buy, Sell, Rent, List for Rent, Lease, Invest, Buy Land, Sell Land, Property Valuation, Agent Inquiry.
  - **Property Types**: Apartments, Villas, Houses, Townhouses, Penthouses, Residential Land, Agricultural Land, Commercial Land, Farms, Offices, Shops, Warehouses.
  - **Currencies Supported**: INR (₹, Lakhs, Crores), AED (Dirhams), USD ($), GBP (£), EUR (€), SGD.
  - **Area Units**: sqft, sqm, cents, acres, hectares, grounds, sqyd.
- **Soft Positive Handling for "Not Interested" Objections**:
  - When a prospect expresses disinterest, the agent responds softly, politely, and positively with appreciation for their thoughts and time, leaving an open door for future contact across all 5 languages.
- **Dual Calling Engines**:
  - **Browser Voice Testing**: Ultra-low-latency Web Audio API streaming (16kHz PCM upload, 24kHz PCM playback) with live waveform meters and Bluetooth/USB mic support.
  - **Real Mobile PSTN Telephony**: Places outbound calls to real phones via Twilio Voice and connects real-time audio through Twilio Media Streams (`/api/twilio/media`).
- **Dual Backend Architecture**:
  - **Full-Stack Node.js/Express (`server.ts`)** with integrated Vite middleware and WebSocket bridges.
  - **Python FastAPI Service (`backend/`)** with Uvicorn, Twilio SDK, and Gemini Live streaming.
- **Date-Wise Qualification Analytics & Multi-Format Export**:
  - Filter conversion metrics and lead lists by specific date or view aggregate totals.
  - Instant visualization of HOT 🔥, WARM ☀️, and COLD ❄️ qualification ratios.
  - Export filtered lead reports in **Excel CSV**, **Printable PDF**, or **JSON**.
  - One-click **ZIP codebase export** (`/api/download-zip`) and GitHub synchronization (`/api/github-push`).

---

## 🏗️ Project Architecture & File Usage

For a comprehensive architectural breakdown and file-by-file module connection guide, refer to [`MVP.md`](./MVP.md).

### Core Modules:
- **`server.ts`**: Full-stack Express server, WebSocket bridge to Gemini Live, Twilio Media Stream converter, identity verification prompt engine, and project ZIP exporter (`/api/download-zip`).
- **`db.ts`**: MySQL connection pool configuration, connection health checks, and safe schema initialization.
- **`leadService.ts`**: Shared lead management service providing unified `upsertLead()`, conversation tracking, and message persistence for both chat and voice.
- **`backend/`**: Alternative Python FastAPI backend (`main.py`, `twilio_service.py`, `voice_agent.py`, `config.py`) for dedicated telephony deployments.
- **`src/App.tsx`**: Central application state, calling orchestration, welcome screen, chat/voice interface, and modal controllers.
- **`src/components/IncomingCallScreen.tsx`**: Vivo-style full-screen calling interface with Web Audio synthesized ringtone and 10s countdown timer.
- **`src/utils/audio.ts`**: Web Audio API engine featuring `LiveAudioPlayer` (24kHz jitter-buffered playback), `LiveMicRecorder` (adaptive VAD noise gate), and `PhoneRingtone` (Vivo synthesizer).
- **`src/components/LiveConnectInspector.tsx`**: Real-time dashboard view displaying active customer details, live dialogue, and extracted budget/timeline slots.
- **`src/components/DateLeadVisualization.tsx`**: Date-filtered qualification charts and stated prospect requirements.
- **`src/components/SimulatedCallScreen.tsx`**: Dedicated call console with live waveform animation, Twilio polling, and CRM action summaries.

---

## 📞 Supported Languages & Rejection Handling

When a prospect states they are not interested, the agent gracefully responds with gratitude and an open invitation:

- **Tamil (பேச்சுத் தமிழ்)**:
  > *"ஓகே சார், சரிங்க சார், கண்டிப்பாங்க! உங்க பொன்னான எண்ணங்களுக்கும், நேரத்துக்கும் ரொம்ப நன்றிங்க. எதிர்காலத்துல உங்களுக்கு ஏதாச்சும் ஐடியா அல்லது யோசனை இருந்தா தாராளமா எங்களை காண்டாக்ட் பண்ணுங்க. ரொம்ப நன்றிங்க சார், நல்ல நாளாக அமையட்டும்!"*
- **English**:
  > *"Ok sir, no problem at all! Sure sir, thank you so much for your valuable thoughts and time. If you have any idea or plans in the future, please feel free to contact us anytime. Thank you so much, have a wonderful day!"*
- **Hindi (हिंदी)**:
  > *"ओके सर, बिल्कुल सर, कोई बात नहीं! आपके बहुमूल्य विचारों और समय के लिए बहुत-बहुत धन्यवाद। यदि भविष्य में आपका कोई भी विचार या योजना बने, तो कृपया बेझिझक हमसे संपर्क करें। बहुत-बहुत धन्यवाद सर, आपका दिन शुभ हो!"*
- **Arabic (العربية)**:
  > *"أوكي يا فندم، بكل تأكيد وسرور! شكراً جزيلاً لأفكارك القيّمة ووقتك الثمين. إذا كانت لديك أي فكرة أو خطة في المستقبل، تفضل بالتواصل معنا في أي وقت. شكراً جزيلاً ويومك مبارك!"*
- **Bilingual (Chennai Tanglish)**:
  > *"Ok sir, sure sir! No problem at all. உங்க valuable thoughts-க்கும் time-க்கும் ரொம்ப thanks sir. Future-ல உங்களுக்கு ஏதாச்சும் idea இருந்தா please feel free to contact us. Thank you sir, have a great day!"*

---

## ⚡ Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=3000

# MySQL Database (Optional - App runs safely without MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lyka_crm

# Twilio Telephony (Optional for real outbound PSTN calls)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
PUBLIC_BASE_URL=https://your-public-url.ngrok-free.app
```

### 2. Install & Run (Node.js Full-Stack)
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. (Optional) Run Python Telephony Backend
If you want to run the standalone Python FastAPI telephony microservice:
```bash
cd backend
pip install -r requirements.txt
uvicorn main.py:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📦 Exporting Codebase
To export the complete source code and documentation:
1. Click the **"Download ZIP"** button in the top-right corner of the application header (or visit `/api/download-zip`).
2. The server packages all source files, configurations, and documentation into a downloadable ZIP archive.
3. To sync changes to GitHub, use the `/api/github-push` endpoint or push directly via git.

