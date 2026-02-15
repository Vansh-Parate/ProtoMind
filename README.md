<p align="center">
  <img src="public/barclays-eagle.svg" alt="ProtoMind Logo" width="60" />
</p>

<h1 align="center">ProtoMind — SAR Narrative Intelligence Platform</h1>

<p align="center">
  An AI-powered, full-stack compliance dashboard for triaging <strong>Suspicious Activity Reports (SARs)</strong>.<br />
  Rule-based risk scoring · LLM narrative generation · RAG-augmented knowledge retrieval · Audit trail
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Express-4-green?logo=express" />
  <img src="https://img.shields.io/badge/Prisma-5-blueviolet?logo=prisma" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-darkgreen?logo=supabase" />
  <img src="https://img.shields.io/badge/LangChain-OpenRouter-orange" />
  <img src="https://img.shields.io/badge/Pinecone-Vector%20Search-red" />
</p>

---

## 📌 Overview

**ProtoMind** is an internal compliance tool that helps AML (Anti-Money Laundering) analysts investigate alerts, generate regulatory-grade SAR narratives using LLMs, and maintain a full audit trail—all from a single modern dashboard.

The platform combines a **rule-based scoring engine**, a **typology detector**, and a **Retrieval-Augmented Generation (RAG) pipeline** to produce structured, grounded SAR narratives that analysts can review, edit, approve, or reject.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Analytics Dashboard** | Live metrics—risk distribution, case statuses, confidence scores, and recent activity |
| **Cases Overview** | Filterable / sortable table of all SAR cases with risk badges, statuses, and scores |
| **Case Detail** | Deep-dive into a single case: customer profile, risk assessment, triggered rules, and generated narrative |
| **SAR Editor** | Side-by-side view of the LLM-generated narrative and an editable draft with character count & autosave |
| **Audit Timeline** | Chronological log of every action taken on a case (generation, edits, approvals, rejections) |
| **LLM Narrative Generation** | Structured SAR generation via LangChain + OpenRouter with Zod-validated JSON output |
| **RAG Knowledge Retrieval** | Pinecone vector store queried at generation time across AML typologies, SAR templates, and regulatory guidelines |
| **Rule-based Risk Scoring** | Configurable rule engine evaluating cross-border patterns, structuring, dormant accounts, and more |
| **Typology Detection** | Automatic classification of alerts into AML typologies (Structuring, Smurfing, Mule, Layering, etc.) |
| **Full Audit Logging** | Every SAR lifecycle event is recorded with input/output snapshots for regulatory explainability |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Vite + React)             │
│  Dashboard · Cases · Case Detail · SAR Editor · Audit    │
│             Tailwind CSS · React Router                  │
└────────────────────────┬─────────────────────────────────┘
                         │  REST API (port 5173 → 4000)
┌────────────────────────▼─────────────────────────────────┐
│                   Backend (Express + TypeScript)          │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ API      │  │ Scoring      │  │ LLM Pipeline       │  │
│  │ Routes   │  │ Engine       │  │ (LangChain)        │  │
│  │ /cases   │  │ 5 AML rules  │  │                    │  │
│  │ /sar     │  │ risk_score → │  │ OpenRouter Model   │  │
│  │ /audit   │  │ LOW/MED/HIGH │  │ Structured Output  │  │
│  └──────────┘  └──────────────┘  │ Zod Validation     │  │
│                                  └──────┬─────────────┘  │
│  ┌──────────────┐  ┌────────────────────▼─────────────┐  │
│  │ Typology     │  │ RAG Vector Store (Pinecone)      │  │
│  │ Detector     │  │ Namespaces:                      │  │
│  │ 7 patterns   │  │  • aml_typologies                │  │
│  └──────────────┘  │  • sar_templates                 │  │
│                    │  • regulatory_guidelines          │  │
│  ┌──────────────┐  │ Embeddings: llama-text-embed-v2  │  │
│  │ Audit        │  └──────────────────────────────────┘  │
│  │ Service      │                                        │
│  └──────────────┘                                        │
└────────────────────────┬─────────────────────────────────┘
                         │  Prisma ORM
┌────────────────────────▼─────────────────────────────────┐
│             Supabase (PostgreSQL)                         │
│  Tables: Case · SARReport · AuditLog                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI |
| **TypeScript** | Type-safe codebase |
| **Vite 5** | Dev server & production bundler |
| **Tailwind CSS** | Utility-first styling with custom design tokens |
| **React Router v6** | Client-side routing |
| **Lucide React** | Icon library |
| **Radix UI** | Accessible select primitives |

### Backend
| Technology | Purpose |
|---|---|
| **Express 4** | REST API framework |
| **Prisma 5** | ORM & database migrations |
| **Zod** | Runtime schema validation |
| **LangChain** | LLM orchestration & prompt engineering |
| **OpenAI SDK / OpenRouter** | LLM inference (Llama 3.1 8B by default) |
| **Pinecone** | Cloud vector database for RAG (free tier) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL (pooled + direct connections) |
| **Pinecone** | Managed serverless vector search (integrated embedding) |

---

## 📂 Project Structure

```
ProtoMind/
├── prisma/
│   ├── schema.prisma          # Data models: Case, SARReport, AuditLog
│   └── migrations/            # Database migration history
│
├── backend/
│   ├── risk-prediction.ipynb  # ML notebook for risk prediction experiments
│   └── src/
│       ├── server.ts           # Express app entrypoint (port 4000)
│       ├── api/
│       │   ├── cases.ts        # GET /cases, GET /cases/:id
│       │   ├── sar.ts          # POST /sar/generate, PUT /sar/edit, POST /sar/approve|reject
│       │   └── audit.ts        # GET /audit/:caseId
│       ├── services/
│       │   ├── cases.ts        # Case business logic
│       │   └── sar.ts          # SAR generation, editing, approval, rejection
│       ├── scoring/
│       │   └── engine.ts       # Rule-based risk scorer (5 rules, 3 severity tiers)
│       ├── typologies/
│       │   └── detector.ts     # AML typology pattern classifier
│       ├── llm/
│       │   ├── provider.ts     # LLM provider interface + Mock + LangChain implementations
│       │   ├── sar_chain.ts    # LangChain pipeline: prompt → structured JSON → narrative
│       │   ├── sar_from_summary.ts  # Generate SAR from pre-structured ML summaries
│       │   ├── vector_store.ts # Pinecone retrieval across 3 knowledge namespaces
│       │   └── ingest.ts       # Script to ingest documents into Pinecone
│       ├── audit/
│       │   └── service.ts      # Audit event logger
│       ├── core/
│       │   ├── prisma.ts       # Shared Prisma client singleton
│       │   └── cache.ts        # In-memory caching utilities
│       └── scripts/
│           ├── seed.ts         # Basic database seeder
│           └── seed_synthetic_sar.ts  # Synthetic SAR dataset seeder from CSV
│
├── src/                        # Frontend source
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Route definitions
│   ├── index.css               # Global styles & Tailwind directives
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── api/                    # API client functions
│   ├── pages/
│   │   ├── DashboardPage.tsx   # Analytics & metrics overview
│   │   ├── CasesOverviewPage.tsx  # Paginated case table
│   │   ├── CaseDetailPage.tsx  # Single case deep-dive
│   │   ├── SarEditorPage.tsx   # Dual-pane narrative editor
│   │   └── AuditTimelinePage.tsx  # Audit event timeline
│   ├── components/
│   │   ├── layout/             # PageShell, Sidebar, Header
│   │   └── ui/                 # Reusable UI components
│   └── data/                   # Mock/fallback data
│
├── public/                     # Static assets (SVGs, custom fonts)
├── package.json
├── vite.config.ts
├── tailwind.config.cjs
├── tsconfig.json
└── .env.example                # Environment variable reference
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project (free tier works) — [supabase.com](https://supabase.com)
- **Pinecone** account (free tier works) — [pinecone.io](https://app.pinecone.io/) (optional, for RAG features)

### 1. Clone & Install

```bash
git clone https://github.com/Vansh-Parate/ProtoMind.git
cd ProtoMind
npm install
```

### 2. Configure Environment

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooled connection string (transaction mode, port `6543`) |
| `DIRECT_URL` | ✅ | Supabase direct connection string (session mode, port `5432`) |
| `VITE_API_URL` | ✅ | Backend URL for the frontend (default: `http://localhost:4000`) |
| `OPENROUTER_API_KEY` | ⚡ | OpenRouter API key — required for live SAR generation |
| `OPENROUTER_MODEL` | ❌ | LLM model identifier (default: `meta-llama/llama-3.1-8b-instruct`) |
| `OPENROUTER_TEMPERATURE` | ❌ | Generation temperature, clamped to 0.1–0.3 (default: `0.2`) |
| `PINECONE_API_KEY` | ⚡ | Pinecone API key — required for RAG features |
| `PINECONE_INDEX_NAME` | ❌ | Pinecone index name (default: `protomind-knowledge`) |

> **Note:** Without `OPENROUTER_API_KEY`, the system falls back to a **deterministic mock provider** — all features work, but narratives are placeholder text.

### 3. Set Up the Database

```bash
# Generate the Prisma client
npm run prisma:generate

# Run migrations against Supabase
npm run prisma:migrate
```

### 4. Seed Data (Optional)

```bash
# Basic seed with mock data
npm run seed

# OR: Seed from synthetic SAR CSV dataset with ML-scored risk levels
npm run seed:synthetic
```

### 5. Ingest Knowledge Base (Optional — RAG)

Add your Pinecone API key to `.env`, then ingest regulatory documents:

```bash
# Ingest documents into Pinecone vector namespaces
npm run llm:ingest
```

### 6. Run the Application

Open **two terminals**:

```bash
# Terminal 1 — Frontend (Vite dev server)
npm run dev

# Terminal 2 — Backend (Express API)
npm run backend:dev
```

| Service | URL |
|---|---|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:4000](http://localhost:4000) |
| Health Check | [http://localhost:4000/health](http://localhost:4000/health) |

---

## 🔌 API Reference

### Cases

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cases` | List all cases (supports query filters) |
| `GET` | `/cases/:id` | Get a single case with SAR and audit data |

### SAR Reports

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/sar/generate` | Generate (or regenerate) a SAR narrative for a case |
| `PUT` | `/sar/edit` | Save analyst edits to a SAR draft |
| `POST` | `/sar/approve` | Approve a SAR and move case to `APPROVED` |
| `POST` | `/sar/reject` | Reject a SAR and move case to `REJECTED` |

### Audit

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/audit/:caseId` | Get the full audit timeline for a case |

---

## ⚙️ Risk Scoring Engine

The scoring engine evaluates each alert against **5 configurable rules**:

| Rule | Code | Weight | Trigger Condition |
|---|---|---|---|
| High-volume inbound | `MANY_INBOUND_TRANSFERS_7D` | 30 | >30 inbound transfers in 7 days |
| Cross-border activity | `CROSS_BORDER` | 25 | Any foreign country transaction |
| KYC inconsistency | `INCONSISTENT_WITH_KYC` | 20 | Behavior inconsistent with KYC profile |
| Dormant reactivation | `DORMANT_ACCOUNT_ACTIVATION` | 15 | Previously dormant account becomes active |
| High-risk geography | `HIGH_RISK_GEOGRAPHY` | 10 | Transactions involving high-risk jurisdictions |

**Risk Classification:**

| Total Score | Risk Level | Confidence |
|---|---|---|
| ≥ 70 | 🔴 HIGH | 90% |
| 40 – 69 | 🟡 MEDIUM | 75% |
| < 40 | 🟢 LOW | 50% |

---

## 🧠 LLM Pipeline

The SAR generation pipeline follows a structured, auditable flow:

```
Alert Payload
    │
    ├──► Scoring Engine ──► Risk Score + Triggered Rules
    ├──► Typology Detector ──► AML Classification
    │
    ▼
RAG Retrieval (Pinecone)
    │  Query 3 namespaces:
    │  • aml_typologies
    │  • sar_templates
    │  • regulatory_guidelines
    │
    ▼
LangChain Prompt Assembly
    │  System: AML analyst persona + guardrails
    │  Human: Case JSON + Score + Typology + Rules + Context
    │
    ▼
OpenRouter LLM (Llama 3.1 8B)
    │
    ▼
Zod Schema Validation ──► Auto-retry on parse failure
    │
    ▼
Structured SAR JSON
    │  ├── customer_profile
    │  ├── activity_summary
    │  ├── transaction_analysis
    │  ├── suspicious_indicators[]
    │  ├── typology_mapping
    │  ├── risk_assessment
    │  └── recommendation
    │
    ▼
Narrative Renderer ──► Human-readable SAR text
    │
    ▼
Audit Log (input/output snapshots for explainability)
```

---

## 🗃️ Database Schema

Three core models managed by Prisma:

```prisma
model Case {
  id               BigInt     @id @default(autoincrement())
  customer_id      String
  alert_payload    Json       // Raw alert data
  risk_score       Int        // Computed by scoring engine
  risk_level       String     // LOW | MEDIUM | HIGH
  typology         String     // Detected AML typology
  triggered_rules  Json       // Array of triggered rule objects
  confidence_score Float
  status           String     // NEW | IN_REVIEW | APPROVED | REJECTED
  created_at       DateTime
  sarReports       SARReport[]
  auditLogs        AuditLog[]
}

model SARReport {
  id             BigInt    @id @default(autoincrement())
  case_id        BigInt
  generated_text String    // LLM-generated narrative
  edited_text    String?   // Analyst's edits
  approved_by    String?
  approved_at    DateTime?
  created_at     DateTime
}

model AuditLog {
  id              BigInt   @id @default(autoincrement())
  case_id         BigInt
  action          String   // SAR_GENERATED | SAR_EDITED | SAR_APPROVED | SAR_REJECTED | SAR_LLM_GENERATED | SAR_LLM_FAILED
  actor           String
  timestamp       DateTime
  input_snapshot  Json?    // Full prompt, model config, retrieved docs
  output_snapshot Json?    // Structured SAR, raw JSON, rendered narrative
}
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| Frontend dev | `npm run dev` | Start Vite dev server on port 5173 |
| Frontend build | `npm run build` | Production build |
| Frontend preview | `npm run preview` | Preview production build locally |
| Backend dev | `npm run backend:dev` | Start Express server with hot reload |
| Lint | `npm run lint` | ESLint check (zero warnings policy) |
| Prisma generate | `npm run prisma:generate` | Regenerate Prisma client |
| Prisma migrate | `npm run prisma:migrate` | Apply database migrations |
| Seed (basic) | `npm run seed` | Seed database with mock cases |
| Seed (synthetic) | `npm run seed:synthetic` | Seed from synthetic SAR CSV with scoring |
| Ingest knowledge | `npm run llm:ingest` | Ingest documents into Pinecone |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<p align="center">
  Built with ❤️ by <strong>Team ProtoMind</strong>
</p>
