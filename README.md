# PulseListen AI

**Zero-Shot Pharmacovigilance & Outbreak Signal Detection Platform**

*PanIIT AI for Bharat Hackathon — Theme 6: Real-Time Social Listening for Patient Experience & Safety Signals*

---

## What It Does

PulseListen AI is a privacy-first social listening platform that detects adverse drug reactions and disease outbreak signals from social media — in 7 Indian languages — before they appear in hospital databases. It uses zero-shot classification to discover novel, previously undocumented side effects and auto-generates regulatory ICSR reports for CDSCO/WHO VigiBase submission.

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Configurable Data Acquisition** | Source-agnostic ingestion from X/Twitter, Reddit, forums with keyword + cadence configuration |
| 2 | **Edge-First PII Redaction** | Email, phone, Aadhaar, PAN, age stripped before analysis — DPDP Act 2023 compliant |
| 3 | **Zero-Shot Novel Detection** | Identifies adverse events NOT in MedDRA dictionaries — clusters emerging unknown signals |
| 4 | **Multilingual Pipeline** | Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, English — native keyword analysis |
| 5 | **Temporal Graph Diffusion** | Distinguishes genuine outbreaks (organic spread) from misinformation (bot-amplified) |
| 6 | **ICSR Report Generator** | Auto-generates WHO VigiBase / CDSCO E2B(R3) structured safety reports |

## Tech Stack

- **Frontend**: Next.js 16, Tremor Charts, Tailwind CSS (dark glassmorphism UI)
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **AI**: Multilingual keyword engine simulating IndicBERT, zero-shot novelty scorer
- **Privacy**: Regex-based edge PII redaction (Aadhaar, PAN, Indian phone format)

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma db push
npm run seed
npm run dev
# Open http://localhost:3000
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Command center with KPI cards, sentiment, languages, top states |
| Projects | `/projects` | Monitoring project management |
| Geo Heatmap | `/heatmap` | State-wise signal density across India |
| ICSR Reports | `/icsr` | Auto-generated regulatory safety reports |
| Diffusion Graph | `/diffusion` | Interactive signal propagation analysis |
| Admin | `/admin` | Source types, audit log, AI source suggester |

## Demo Data

The seed script generates 3 projects with 160+ mentions processed through the full 6-stage pipeline:
- Edge PII Redaction → Multilingual AI → Zero-Shot Novelty → Geo Assignment → Diffusion Analysis → ICSR Generation

---

*Built for the PanIIT AI for Bharat Hackathon by PulseListen AI Team*
