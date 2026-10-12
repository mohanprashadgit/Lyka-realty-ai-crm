# Lyka Realty — AI Voice Lead Agent, Property Assistant & Aura Privé CRM 🎙️🏡🏛️

A production-grade, human-sounding outbound real estate qualification calling system, inbound conversational AI property assistant, and full-featured real estate CRM platform powered by **Google Gemini Live Native Audio (`gemini-3.8-live`)**, **Google Gemini Flash (`gemini-3.5-flash`)**, **Twilio Voice PSTN Telephony**, **MySQL CRM Persistence**, and a **React 19 + TypeScript + Tailwind CSS v4** frontend.

The platform empowers real estate brokerages, developers, and property consultants to qualify leads at scale through natural conversations across **Tamil, English, Hindi, Arabic, and Chennai Tanglish**, seamlessly funneling qualified inquiries into a luxury-grade **Aura Privé CRM** with customer profiles, deal pipelines, agent task follow-ups, and property inventory matching.

---

## 🌟 Key Highlights

### 1. Dual AI Operation Modes & Protected Voice Assistant
- **Outbound Voice Calling Agent (`mode: agent`)**: Telephony and browser-based outbound qualification calling with zero AI disclosure, identity verification, objection handling, and structured slot extraction.
- **Inbound AI Property Assistant (`mode: chatbot`)**: Customer-facing property assistant featuring an interactive welcome orb, rich text chat, voice streaming, and real-time requirement cards.
- **Executive Personas**:
  - **Lyka** (Female Senior Property Relationship Manager) across all languages (Tamil, English, Hindi, Arabic, Tanglish).
  - **Vinakya Mahadev** (Male Senior Property Portfolio Executive for Tamil & Chennai Tanglish).
  - **Stark** (Male Senior Executive for English, Hindi, and Arabic).
- **Identity Confirmation & Alternative Contacts**: Verifies recipient identity (*"Vanakkam! Am I speaking with [Lead Name]...?"*) and notes alternative contacts (brother, spouse, colleague) when someone else answers.
- **Zero AI Disclosure**: 100% human cadence, warmth, active listening, and contextual empathy.
- **Smart Voice Activity Detection (VAD) & Noise Immunity**: Multi-frame energy gating, noise floor adaptation, and interruption protection.
- **Vivo OriginOS Browser Phone Console**: Full-screen smartphone chassis with native Web Audio Vivo Marimba Ringtone synthesis and 10s auto-miss timer.

### 2. Aura Privé Real Estate CRM Platform (`src/crm/`)
- **Reliable Application Shell (`CrmLayout.tsx`)**: Full viewport layout (`h-screen w-screen overflow-hidden flex font-sans`) with a dedicated two-column structure: fixed desktop sidebar (`w-72 shrink-0`) and main content area (`min-w-0 flex-1 overflow-y-auto min-h-0`). Content is wrapped in a centered max-width container (`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`). Destructive `overflow-x-hidden` masking is strictly eliminated.
- **Tailwind CSS v4 Layer Architecture (`index.css`)**: Global universal reset `*, *::before, *::after` is strictly wrapped in `@layer base` alongside `@source "../index.html"` and `@source "../src"`, ensuring Tailwind v4 utility classes (`p-5`, `p-6`, `px-4`, etc.) maintain proper cascade priority and are never overridden to 0px.
- **Independent Dual-Scrolling Strategy**: Sidebar navigation (`min-h-0 overflow-y-auto`) and main viewport scroll independently. Header and sidebar remain fixed in view while dashboard or module views scroll smoothly vertically without nested scroll contention.
- **Stable Sidebar Navigation (`Sidebar.tsx`)**: Explicit `w-72` (288px) width with `shrink-0` ensures navigation labels, counts, and accordion headers never clip on the left margin. Standardized item padding (`px-3.5 py-2.5`), aligned icons, and official local `/logo.png` branding.
- **Responsive Top Header (`CrmHeader.tsx`)**: Responsive flex layout with dynamic breadcrumbs (`min-w-0 shrink truncate`), keyboard-driven search (`Ctrl + K`) hidden on small viewports (`hidden xl:block`), compact role preview selector, and fixed action buttons (`shrink-0 whitespace-nowrap`).
- **100% Real MySQL Database Integration**: Zero mock data. All KPIs, leads, customers, pipelines, activities, and tasks link directly to live MySQL queries.
- **Responsive KPI Metrics Grid**: Dynamic CSS grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4`) providing generous 20px padding (`p-5`), preventing text clipping and border collisions across 1024px, 1366px, and 1440px viewports.
- **Readable 8-Stage Pipeline Funnel**: Multi-row responsive stage grid (`grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-3`) displaying 4 wide columns in 2 rows on standard screens (or 8 on 2xl), guaranteeing full readability for all 8 stages ("1. New" through "6. Negotiation", "7. Deal Closed", "8. Disqualified") without label truncating.
- **Scroll-Protected Data Tables**: Wide data tables (Recent Leads `min-w-[880px]`, Customer Directory `min-w-[1080px]`, Lead Management `min-w-[1250px]`) wrapped in `overflow-x-auto` containers with dedicated column widths and reachable Actions columns.
- **7-Tab Unified Customer Profile (`CustomerDetailModal.tsx`)**: Complete view of customer overview, linked leads, conversation history, scheduled follow-ups, property interests, deals, and activity timeline.
- **Aura Privé Luxury Visual Design**: Graphite charcoal surfaces (`#0B0A0C`, `#141217`, `#18161B`, `#28232D`), warm ivory text, and muted champagne-gold accents (`#d8a868`, `#f0be7c`), with dark and light theme support.

---

## 🗂️ Complete Directory Structure & File Usage

```
lyka-chatbot/
├── .env                              # Active local environment variables
├── .env.example                      # Environment variables template
├── MVP.md                            # Comprehensive MVP architecture & requirements
├── README.md                         # Project documentation, setup, APIs, & architecture
├── crmRoutes.ts                      # Dedicated modular CRM Express router (25+ REST endpoints)
├── db.ts                             # MySQL connection pool & safe idempotent schema migration
├── index.html                        # HTML5 entry point with metadata, viewport, and favicon
├── leadService.ts                    # Shared lead upsert service for voice, chat, and CRM
├── public/
│   └── logo.png                      # Official Lyka Realty company logo (86 KB PNG asset)
├── metadata.json                     # Application metadata and capabilities
├── package.json                      # NPM dependencies, scripts, and build configuration
├── server.ts                         # Full-stack Express server, WebSocket bridges, Vite middleware
├── tsconfig.json                     # TypeScript compiler configuration (client)
├── tsconfig.node.json                # TypeScript compiler configuration (tools)
├── vite.config.ts                    # Vite configuration with React & Tailwind CSS v4 plugins
├── backend/                          # Standalone Python FastAPI Telephony Microservice
│   ├── .env.example                  # Python backend environment template
│   ├── config.py                     # Pydantic settings management
│   ├── main.py                       # FastAPI application, Twilio webhooks, WebSocket media bridge
│   ├── requirements.txt              # Python dependencies
│   ├── twilio_service.py             # Twilio outbound call creation & TwiML generation
│   └── voice_agent.py                # Audio transcoding (mu-law ⇄ PCM) & Gemini prompt logic
└── src/
    ├── App.tsx                       # Root app controller, screen switcher (#welcome, #chat, #crm)
    ├── index.css                     # Tailwind CSS v4, Aura Privé design tokens, dark/light themes
    ├── main.tsx                      # React 19 application entry point
    ├── components/                   # AI Chatbot & Calling Screen Components
    │   ├── ApiUsageTab.tsx           # Real-time API consumption metrics & quotas
    │   ├── ArchitectureCard.tsx      # System architecture visualization
    │   ├── CallControls.tsx          # Microphone selector, mute toggle, visualizer meter
    │   ├── CallHistoryView.tsx       # Past call records and transcripts
    │   ├── DashboardStatsView.tsx    # Chatbot qualification KPIs & statistics
    │   ├── DateLeadVisualization.tsx # Date-filtered Hot/Warm/Cold charts
    │   ├── EditLeadModal.tsx         # Prospect editing form & status override
    │   ├── ExportModal.tsx           # JSON/CSV export modal
    │   ├── Header.tsx                # Chatbot header, persona switcher, language selector
    │   ├── ImportLeadsModal.tsx      # CSV lead importer
    │   ├── IncomingCallScreen.tsx    # Vivo full-screen phone call UI with synthesized ringtone
    │   ├── LeadPanel.tsx             # Real-time qualification slots card
    │   ├── LeadReportExportModal.tsx # Filtered report export (Excel CSV, PDF, JSON)
    │   ├── LeadTable.tsx             # Chatbot leads table
    │   ├── LiveConnectInspector.tsx  # Live call slot extraction inspector
    │   ├── SimulatedCallScreen.tsx   # Outbound calling console with waveforms
    │   ├── StageTracker.tsx          # Visual qualification progress tracker
    │   ├── TranscriptView.tsx        # Live conversation turns stream
    │   └── TwilioConfigModal.tsx     # Twilio SID & Token configuration modal
    ├── crm/                          # Aura Privé Real Estate CRM Subsystem (Isolated)
    │   ├── CrmApp.tsx                # CRM entry wrapper with CrmProvider
    │   ├── components/
    │   │   ├── AddCustomerModal.tsx  # Modal to register verified customer profiles
    │   │   ├── AddLeadModal.tsx      # Modal to add manual lead inquiries
    │   │   ├── CrmHeader.tsx         # Unified responsive header (breadcrumb, Ctrl+K search, role switcher, AI button)
    │   │   ├── CrmLayout.tsx         # Full-viewport layout shell (fixed w-72 sidebar, independent scroll, max-w-[1600px] container)
    │   │   ├── CustomerDetailModal.tsx # 7-tab customer profile view
    │   │   ├── LeadDetailDrawer.tsx  # Slide-in comprehensive lead drawer with triage & notes
    │   │   ├── MetricCard.tsx        # Reusable KPI metric card component
    │   │   ├── RolePreviewSelector.tsx # Development role preview switcher (Super Admin to Agent)
    │   │   └── Sidebar.tsx           # Compact navigation sidebar (w-72 fixed, independent vertical scroll, logo.png)
    │   ├── context/
    │   │   └── CrmContext.tsx        # Global CRM state provider (KPIs, active role, theme, modals)
    │   ├── modules/
    │   │   ├── AuditLogsView.tsx         # Security audit log view with actor, action, and IP tracking (Admin/Super Admin only)
    │   │   ├── CampaignsManagementView.tsx # Digital marketing campaigns, spend ROI, and lead attribution
    │   │   ├── CustomerManagementView.tsx # Dedicated customer directory with search, 3 filters, pagination, and modal triggers
    │   │   ├── DealsManagementView.tsx   # Real estate deals pipeline, transaction values, and commission calculations
    │   │   ├── EmployeeManagementView.tsx # Staff directory with targets, territory, and role badges (Management only)
    │   │   ├── LandManagementView.tsx    # Agricultural, residential, and commercial land listings with survey details
    │   │   ├── LeadManagementView.tsx    # Lead tracking table with 9 filters & pagination (min-w-[1250px])
    │   │   ├── ModuleDispatcher.tsx      # Central view router dispatching active module to its dedicated component
    │   │   ├── NotificationsView.tsx     # In-app operational notifications and assignment alerts
    │   │   ├── OverviewDashboard.tsx     # Responsive dashboard (auto-fit KPIs, 8-stage pipeline, Recent Leads min-w-[880px], Tasks)
    │   │   ├── PerformanceRewardsView.tsx # Gamification leaderboard and points transaction ledger
    │   │   ├── PropertiesView.tsx        # Residential & commercial property inventory with specs, pricing, and status filters
    │   │   ├── RoadmapModuleView.tsx     # Honest roadmap status view for upcoming modules (matching, ai-listing, reports)
    │   │   ├── SalesPipelineView.tsx     # Kanban board representation of deal pipeline
    │   │   ├── SettingsView.tsx          # System settings (currency, area units, scoring weights) with live PATCH persistence
    │   │   ├── SiteVisitsView.tsx        # Scheduled property viewings and client visit feedback
    │   │   ├── TasksManagementView.tsx   # Daily task management with 1-click completion and task creation modal
    │   │   ├── TeamsManagementView.tsx   # Department teams and hierarchy management (Management only)
    │   │   └── UserManagementView.tsx    # System user accounts and access administration (Super Admin only)
    │   └── types/
    │       └── crm.ts                # TypeScript interfaces for CRM entities, roles, and stages
    ├── storage/                      # Browser storage helpers (calls, leads, settings)
    │   ├── calls.ts
    │   ├── index.ts
    │   ├── leads.ts
    │   └── settings.ts
    ├── types/                        # Core agent & chatbot types
    │   └── agent.ts
    └── utils/                        # Audio processing & report utilities (Protected)
        ├── audio.ts                  # LiveAudioPlayer, LiveMicRecorder, PhoneRingtone
        ├── csv.ts                    # CSV parser & serializer
        ├── exportReport.ts           # Multi-format report exporter
        └── scoring.ts                # Deterministic qualification scoring
```

---

## 🗄️ Database Architecture (`db.ts`)

The CRM database (`lyka_crm`) runs on MySQL with connection pooling and idempotent schema migrations (`CREATE TABLE IF NOT EXISTS`). Existing tables and production rows are never dropped or truncated.

### Core Tables & Relationships:

1. **`customers`**: Verified client relationship profiles.
   - Primary key: `id` (UUID).
   - Columns: `full_name`, `phone`, `phone_normalized`, `email`, `current_location`, `preferred_contact`, timestamps.
2. **`leads`**: Real estate property inquiries (captured via AI chatbot, voice agent, or CRM manual entry).
   - Primary key: `id` (UUID), Foreign key: `customer_id` → `customers.id`.
   - Columns: `guest_session_id`, `lead_source`, `intent`, `property_type`, `country`, `state_province`, `city`, `locality`, `postal_code`, `budget_min`, `budget_max`, `currency`, `property_size`, `area_unit`, `bedrooms`, `bathrooms`, `amenities`, `timeline`, `temperature` (`HOT`, `WARM`, `COLD`), `pipeline_status` (`new`, `contacted`, `qualified`, `property matching`, `site visit`, `negotiation`, `won`, `lost`), `assigned_agent` → `employees.id`, `notes`.
3. **`conversations`**: Audit log of all guest sessions and channels.
   - Primary key: `id`, Foreign keys: `lead_id`, `customer_id`.
   - Columns: `session_id`, `channel` (`text`, `voice`), `language`, `started_at`, `ended_at`.
4. **`conversation_messages`**: Turn-by-turn dialogue history between prospect and AI assistant.
   - Primary key: `id`, Foreign key: `conversation_id`.
   - Columns: `role` (`user`, `assistant`), `content`, `message_type`, `created_at`.
5. **`lead_interactions`**: Event audit trail for timeline inspection.
   - Primary key: `id`, Foreign key: `lead_id`.
   - Columns: `interaction_type`, `summary`, `metadata`, `created_at`.
6. **`teams`**: Brokerage departments and teams.
   - Primary key: `id`.
   - Columns: `name`, `department`, `manager_id`, `description`, `created_at`.
7. **`employees`**: Staff directory with roles, monthly targets, and reward points.
   - Primary key: `id` (e.g., `emp-super-admin`, `emp-sales-mgr`, `emp-sales-agent`).
   - Columns: `full_name`, `email`, `phone`, `department`, `role`, `team_id`, `monthly_target`, `points_balance`, `assigned_territory`.
8. **`properties`**: Residential and commercial inventory.
   - Primary key: `id`.
   - Columns: `title`, `description`, `purpose`, `property_type`, `status`, `city`, `price`, `currency`, `bedrooms`, `bathrooms`, `built_up_area`, `amenities`, `cover_image_url`, `assigned_agent_id`.
9. **`land_listings`**: Agricultural, residential, and commercial land parcels.
   - Primary key: `id`.
   - Columns: `title`, `description`, `land_type`, `status`, `city`, `survey_number`, `total_area`, `area_unit`, `expected_price`, `currency`, `road_access`, `water_availability`.
10. **`deals`**: Commercial transactions, contract tracking, and commissions.
    - Primary key: `id`, Foreign keys: `lead_id`, `customer_id`, `property_id`, `agent_id`.
    - Columns: `title`, `transaction_type`, `deal_status`, `deal_value`, `projected_value`, `commission_rate`, `commission_amount`, `expected_close_date`.
11. **`site_visits`**: Scheduled client property viewings and agent tours.
    - Primary key: `id`, Foreign keys: `customer_id`, `lead_id`, `property_id`, `employee_id`.
    - Columns: `visit_date`, `visit_time`, `status`, `feedback`, `outcome`.
12. **`tasks`**: Daily follow-up reminders and action items for agents.
    - Primary key: `id`, Foreign keys: `assigned_to` → `employees.id`, `lead_id`, `customer_id`.
    - Columns: `title`, `description`, `due_date`, `priority` (`high`, `medium`, `low`), `status` (`pending`, `completed`), `completion_notes`.
13. **`reward_ledger`**: Gamification and incentive point transactions.
14. **`campaigns`**: Digital marketing campaigns (Meta Ads, Google Ads) with lead generation attribution.
15. **`crm_notifications`**: In-app operational alerts and assignments.
16. **`audit_logs`**: Immutable security and event trail.
17. **`crm_settings`**: Brokerage currency configurations, scoring weights, and company profile.

---

## 📡 API Endpoints Reference

### 1. Aura Privé CRM Endpoints (`crmRoutes.ts`)
All CRM endpoints enforce Role-Based Access Control (RBAC) via the `x-user-role` header (or `?role=` query). Missing credentials default to `'Unauthenticated'` and return `403 Forbidden` on protected admin/management endpoints.

| Method | Endpoint | RBAC Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/crm/dashboard` | All authenticated roles | Returns 6 core KPIs, Recent Leads, Follow-ups Today, Pipeline distribution, and Leaderboards |
| `GET` | `/api/crm/leads` | All authenticated roles | Paginated lead inquiries with filters (`search`, `temperature`, `status`, `unassigned`, `followup_due`, `won`, `lost`) |
| `POST` | `/api/crm/leads` | All authenticated roles | Create manual lead inquiry with automated customer profile linking |
| `GET` | `/api/crm/leads/:id` | All authenticated roles | Full lead inspection (details, dialogue turns, tasks, notes, timeline) |
| `PATCH` | `/api/crm/leads/:id` | All authenticated roles | Update lead qualification slots, pipeline status, or assigned employee |
| `POST` | `/api/crm/leads/:id/notes` | All authenticated roles | Add notes to a lead |
| `POST` | `/api/crm/leads/:id/tasks` | All authenticated roles | Schedule follow-up task or viewing appointment |
| `GET` | `/api/crm/customers` | All authenticated roles | Paginated customer directory with search (`query`) and filters (`has_leads`, `preferred_contact`, `sort`) |
| `POST` | `/api/crm/customers` | All authenticated roles | Register verified customer profile with server-side validation and duplicate phone detection |
| `GET` | `/api/crm/customers/:id` | All authenticated roles | 7-tab customer profile data (inquiries, conversations, tasks, deals) |
| `PATCH` | `/api/crm/customers/:id` | All authenticated roles | Update customer profile details (`full_name`, `phone`, `email`, `current_location`, `preferred_contact`) with validation and audit logging |
| `GET` | `/api/crm/properties` | All authenticated roles | Available property listings with specifications |
| `GET` | `/api/crm/land` | All authenticated roles | Available land parcels with survey and utility details |
| `GET` | `/api/crm/deals` | All authenticated roles | Deal pipeline, closed deals, and revenue numbers |
| `GET` | `/api/crm/site-visits` | All authenticated roles | Scheduled and completed site visits |
| `GET` | `/api/crm/tasks` | All authenticated roles | Pending and completed follow-up tasks |
| `PATCH` | `/api/crm/tasks/:id/complete` | All authenticated roles | Mark task complete with completion notes |
| `POST` | `/api/crm/tasks` | All authenticated roles | Create task reminder |
| `GET` | `/api/crm/employees` | Super Admin, Admin, Sales Manager | Staff directory with targets and points balance |
| `GET` | `/api/crm/teams` | Super Admin, Admin, Sales Manager | Team departments and hierarchy |
| `GET` | `/api/crm/rewards` | All authenticated roles | Employee reward point transactions |
| `GET` | `/api/crm/campaigns` | Super Admin, Admin, Marketing Exec | Marketing campaigns and lead counts |
| `GET` | `/api/crm/notifications` | All authenticated roles | In-app alerts |
| `GET` | `/api/crm/audit-logs` | Super Admin, Admin | Operational system audit events |
| `POST` | `/api/crm/audit-logs` | Super Admin, Admin | Log operational action |
| `GET` | `/api/crm/settings` | Super Admin, Admin | Brokerage currency, area unit, and scoring settings |
| `PATCH` | `/api/crm/settings` | Super Admin, Admin | Update brokerage configuration settings |
| `GET` | `/api/crm/users` | Super Admin | System user accounts with email, role, and last login |

### 2. Conversational AI & Telephony Endpoints (`server.ts`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check for Gemini model and server status |
| `GET` | `/api/health/db` | MySQL connection health verification |
| `POST` | `/api/chat` | Multi-turn text chat with Gemini Flash and tool extraction |
| `POST` | `/api/conversation` | Create session-scoped conversation tracker |
| `GET` | `/api/lead` | Fetch current session's extracted lead slots |
| `POST` | `/api/lead/save` | Manual lead save/update from frontend summary panel |
| `GET` | `/api/usage` | API quota and token usage metrics |
| `GET` | `/api/config` | Personas, voices, and supported languages |
| `GET` | `/api/twilio/config` | Twilio configuration status |
| `POST` | `/api/twilio/config` | Save Twilio SID, Auth Token, and caller ID |
| `POST` | `/api/call` | Trigger outbound PSTN phone call |
| `POST` | `/api/twilio/voice` | Twilio voice webhook returning TwiML stream |
| `POST` | `/api/twilio/status` | Twilio call lifecycle updates callback |
| `GET` | `/api/download-zip` | Download complete project source code as a ZIP archive |

### 3. WebSocket Endpoints
| Path | Protocol | Description |
|---|---|---|
| `/api/live-ws` | `ws:` / `wss:` | Ultra-low latency Web Audio streaming to Gemini Live (`gemini-3.8-live`) |
| `/api/twilio/media` | `ws:` / `wss:` | Bidirectional Twilio Media Stream audio transcoder (mu-law 8kHz ⇄ PCM 24kHz) |

---

## ⚡ Setup, Commands & How to Run

### Prerequisites
- Node.js 18+ (Node 20 or 22 recommended)
- Google Gemini API Key
- MySQL Database (e.g., MySQL 8.0 or XAMPP on port 3306)

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
# Google Gemini API Key (Required for voice & chat)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=3000

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lyka_crm

# Twilio Telephony (Optional for real outbound mobile calls)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
PUBLIC_BASE_URL=
```

### 2. Install & Run Locally
```bash
# Install dependencies
npm install

# Start full-stack development server (Express API + Vite SPA middleware)
npm run dev
```

The application will be live at:
- **AI Chatbot & Voice Assistant**: `http://localhost:3000/#welcome` or `http://localhost:3000/#chat`
- **Aura Privé CRM Portal**: `http://localhost:3000/#crm`

### 3. Production Build & Verification
```bash
# Run production build (Vite + TypeScript)
npm run build
```
Build output & verification:
- `dist/index.html` (~1.03 kB)
- `dist/assets/*.css` (~117 kB)
- `dist/assets/*.js` (~378 kB)
- Multi-viewport layout verification (1366×768, 1440×900, 1024×768) with verified zero overlapping, full 8 pipeline stages visible, preserved 20-32px padding, and functional table horizontal scroll.

---

## 🔒 Strict Technical Protection Rules

1. **AI Chatbot Integrity**: The client AI chatbot, Gemini Live voice streaming, microphone capture, audio playback, VAD noise immunity, `src/utils/audio.ts`, and WebSocket protocols are completely isolated and protected.
2. **Database Safety**: All database schema operations use `CREATE TABLE IF NOT EXISTS`. Destructive migrations (`DROP TABLE`, `TRUNCATE`) are strictly forbidden.
3. **Data Authenticity**: All CRM metrics and dashboard tables reflect real MySQL database records. Static mock data is prohibited.
