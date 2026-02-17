<p align="center">
  <img src="public/barclays-eagle.svg" alt="ProtoMind Logo" width="60" />
</p>

<h1 align="center">ProtoMind — SAR Narrative Intelligence Platform</h1>

<p align="center">
  An AI-powered, full-stack compliance dashboard for triaging <strong>Suspicious Activity Reports (SARs)</strong>.<br />
  <strong>Hybrid Risk Scoring (ML + Rules)</strong> · LLM narrative generation · RAG-augmented knowledge retrieval · Audit trail
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Express-4-green?logo=express" />
  <img src="https://img.shields.io/badge/Prisma-5-blueviolet?logo=prisma" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-darkgreen?logo=supabase" />
  <img src="https://img.shields.io/badge/Python-3.11-yellow?logo=python" />
  <img src="https://img.shields.io/badge/XGBoost-Models-orange" />
  <img src="https://img.shields.io/badge/LangChain-OpenRouter-339933" />
  <img src="https://img.shields.io/badge/Pinecone-Vector%20Search-red" />
</p>

---

## 📌 Overview

**ProtoMind** is an internal compliance tool that helps AML (Anti-Money Laundering) analysts investigate alerts, generate regulatory-grade SAR narratives using LLMs, and maintain a full audit trail—all from a single modern dashboard.

The platform combines a **hybrid risk scoring engine** (Rule-based + XGBoost ML Model), a **typology detector**, and a **Retrieval-Augmented Generation (RAG) pipeline** to produce structured, grounded SAR narratives. It supports real-time data ingestion and utilizes advanced ML to predict risk probabilities and confidence scores.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **ML-Powered Risk Scoring** | **XGBoost** model trained on synthetic SAR data to predict risk levels (High/Medium/Low) and confidence scores. |
| **Hybrid Analysis** | Combines deterministic AML rules (cross-border, velocity) with probabilistic ML predictions. |
| **Analytics Dashboard** | Live metrics—risk distribution, case statuses, confidence scores, and recent activity. |
| **Cases Overview** | Filterable / sortable table of all SAR cases with risk badges, statuses, and scores. |
| **Case Detail** | Deep-dive into a single case: customer profile, risk assessment, triggered rules, and generated narrative. |
| **SAR Editor** | Side-by-side view of the LLM-generated narrative and an editable draft with character count & autosave. |
| **LLM Narrative Generation** | Structured SAR generation via **LangChain + OpenRouter** with Zod-validated JSON output. |
| **RAG Knowledge Retrieval** | **Pinecone** vector store queried at generation time across AML typologies, SAR templates, and regulatory guidelines. |
| **PDF Export** | Export generated SAR narratives to PDF for official filing. |
| **Full Audit Logging** | Every SAR lifecycle event is recorded with input/output snapshots for regulatory explainability. |

---

## 🏗️ Architecture

The system uses a **Node.js/Express** backend for API handling and orchestration, communicating with a **Python** subprocess for ML inference.

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
│  │ /cases   │  │ Rules + ML   │  │                    │  │
│  │ /sar     │  │ Integration  │  │ OpenRouter Model   │  │
│  └──────────┘  └──────┬───────┘  │ Structured Output  │  │
│                       │          │ Zod Validation     │  │
│  ┌────────────────────▼─────┐    └──────┬─────────────┘  │
│  │ Python ML Service        │    ┌──────▼─────────────┐  │
│  │ (Child Process)          │    │ RAG Vector Store   │  │
│  │ model_predictor.py       │    │ (Pinecone)         │  │
│  │ XGBoost Model            │    │ Namespaces:        │  │
│  └──────────────────────────┘    │ • aml_typologies   │  │
│                                  │ • sar_templates    │  │
│                                  └────────────────────┘  │
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
| **Radix UI** | Accessible primitives |
| **jspdf / html2canvas** | PDF generation for reports |

### Backend & ML
| Technology | Purpose |
|---|---|
| **Express 4** | REST API framework |
| **Prisma 5** | ORM & database migrations |
| **Python 3.11** | Machine Learning environment |
| **XGBoost** | Gradient boosting framework for risk classification |
| **Pandas / NumPy** | Data manipulation and processing |
| **LangChain** | LLM orchestration & prompt engineering |
| **OpenRouter** | LLM inference (Llama 3.1 8B by default) |
| **Pinecone** | Cloud vector database for RAG |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL (pooled + direct connections) |
| **Pinecone** | Managed serverless vector search |

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
│   ├── sar_compliant_dataset_500.csv # Synthetic dataset
│   ├── src/
│       ├── server.ts           # Express app entrypoint (port 4000)
│       ├── api/                # API Routes (cases, sar, audit)
│       ├── ml/
│       │   ├── model_predictor.py  # Python: XGBoost inference class
│       │   ├── predict_cli.py      # Python: CLI entrypoint for Node.js
│       │   ├── predictor.ts        # Node.js: Wrapper for Python process
│       │   └── saved_models/       # Serialized .pkl models
│       ├── scripts/
│       │   ├── seed_real_data.ts   # Main seeder: CVS + ML scoring + LLM SARs
│       │   ├── apply_ml_model.ts   # Script to re-score existing cases
│       │   └── scale_scores.ts     # Utility to adjust scores
│       ├── services/           # Business logic
│       ├── llm/                # LangChain & RAG pipeline
│       └── ...
│
├── src/                        # Frontend source
│   ├── pages/                  # CasesOverview, CaseDetail, SarEditor, AuditTimeline
│   ├── components/             # Reusable UI & Layouts
│   ├── api/                    # API client
│   └── ...
│
├── public/                     # Static assets
└── ...
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9 (with `xgboost`, `pandas`, `scikit-learn`)
- **Supabase** project
- **Pinecone** account (optional, for RAG)

### 1. Clone & Install

```bash
git clone https://github.com/Vansh-Parate/ProtoMind.git
cd ProtoMind

# Install Node dependencies
npm install

# Install Python dependencies (recommended to use venv)
pip install pandas numpy scikit-learn xgboost
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials.
(See **Environment Variables** table below)

### 3. Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Seed Data (Important)

We provide a **"Real Data" seeder** that uses the ML model to score cases and the LLM to generate initial narratives.

```bash
# Seeds 500+ cases from CSV, applies XGBoost scoring, and generates SARs
# Requires OPENROUTER_API_KEY for narratives
npm run seed:real
```

*Alternatively, for synthetic mock data only:*
```bash
npm run seed:synthetic
```

### 5. Ingest Knowledge Base (RAG)

```bash
npm run llm:ingest
```

### 6. Run the Application

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run backend:dev
```

Access:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

---

## ⚙️ Hybrid Risk Scoring

ProtoMind uses a two-layer approach to assess risk:

1.  **Rule-Based Engine**: Immediate flagging of known AML patterns (e.g., Structuring, Rapid Movement).
    *   *Rules*: `MANY_INBOUND_TRANSFERS`, `CROSS_BORDER`, `INCONSISTENT_WITH_KYC`, etc.
2.  **ML Inference (XGBoost)**: Analyzes 50+ features from the case data to predict a probabilistic risk score (0-100) and confidence level.
    *   *Inputs*: Transaction velocity, amount deviations, geo-risk, error rates, etc.

**Final Determination**:
- **HIGH Risk**: Score ≥ 70 or Critical Rules Triggered. (Auto-generates SAR draft)
- **MEDIUM Risk**: Score 40-69.
- **LOW Risk**: Score < 40.

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| **Start Frontend** | `npm run dev` | Vites dev server |
| **Start Backend** | `npm run backend:dev` | Express dev server + TS |
| **Seed Real Data** | `npm run seed:real` | **Recommended**. Seeds from CSV with ML scoring & LLM narratives |
| **Apply ML** | `npm run ml:apply` | Re-run ML model on existing DB cases |
| **Ingest RAG** | `npm run llm:ingest` | Process documents into Pinecone |
| **Lint** | `npm run lint` | ESLint check |

---

## 🧠 LLM Pipeline

1.  **Alert Data** + **ML Risk Score** + **Typolgy** is passed to the context.
2.  **RAG** retrieves similar past cases (Typologies) and guidelines from Pinecone.
3.  **Llama 3.1 8B** (via OpenRouter) generates the narrative.
4.  **Zod** enforces strict JSON output structure.
5.  **Audit** logs the prompt and completion.

---

## 📄 License

This project is private and proprietary. All rights reserved.

<p align="center">
  Built with ❤️ by <strong>Team ProtoMind</strong>
</p>
