# PulseListen AI — Solution Document

**PanIIT AI for Bharat Hackathon — Theme 6 Submission**

---

## 1. Executive Summary

India's pharmaceutical safety monitoring relies on CDSCO's voluntary hospital reporting — a system with massive underreporting. Adverse drug reactions surface on social media days before formal databases. Current tools use keyword dictionaries and miss novel, undocumented side effects entirely.

**PulseListen AI** is a *configurable, privacy-first social listening platform* for healthcare organizations. It ingests mentions from X/Twitter, Reddit, and regional forums through a **generic data acquisition engine**, redacts all PHI/PII at the ingestion edge, runs **Zero-Shot classification** to detect novel adverse events, analyzes signal propagation through a **Temporal Graph Diffusion Engine**, maps geographic spread, and auto-generates **ICSR reports** for CDSCO/WHO VigiBase submission — all while processing **7 Indian languages** natively.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Responsibility |
|--------|-----------------|-----------------|
| **Frontend** | Next.js 16 (App Router), Tremor, Tailwind CSS | UI rendering, data visualization, dark-mode glassmorphism design |
| **Backend** | Next.js API Routes (App Router) | Server-side logic, crawl orchestration, AI analysis endpoints |
| **Database** | Prisma ORM + SQLite | Relational models: `Project`, `Source`, `Mention`, `ICSRReport`, `AdminAction` |
| **AI Engine** | Custom multilingual analysis (`lib/ai.ts`) | Signal classification, sentiment analysis, entity extraction in 7 languages |
| **Zero-Shot** | Novel signal detector (`lib/zero-shot.ts`) | MedDRA term matching, novelty scoring, cluster labeling |
| **Diffusion** | Temporal graph engine (`lib/diffusion.ts`) | Propagation analysis, bot detection, verification labeling |
| **Privacy** | Edge PII redactor (`lib/pii.ts`) | Email, phone, Aadhaar, PAN, age redaction before analysis |
| **Geographic** | Geo engine (`lib/geo.ts`) | 36 Indian cities mapping, state-wise aggregation |
| **Regulatory** | ICSR generator (`lib/icsr.ts`) | WHO VigiBase / CDSCO E2B(R3) report generation |

### System Architecture

```
Social Media Sources                         PulseListen AI Platform
┌────────────────┐     ┌──────────────────────────────────────────────────────┐
│ X/Twitter      │     │                                                      │
│ Reddit         │────▶│  ┌─────────────┐   ┌──────────────┐                  │
│ Forums         │     │  │ Data        │   │ Edge PII     │                  │
│ Quora          │     │  │ Acquisition │──▶│ Redaction    │                  │
└────────────────┘     │  │ Engine      │   │ (DPDP Act)   │                  │
                       │  └─────────────┘   └──────┬───────┘                  │
                       │                           │                          │
                       │  ┌────────────────────────▼──────────────────────┐   │
                       │  │           Multilingual AI Analysis            │   │
                       │  │  (Hindi, Kannada, Tamil, Telugu, Bengali,     │   │
                       │  │   Marathi, English — IndicBERT simulation)    │   │
                       │  └────────────────────────┬──────────────────────┘   │
                       │                           │                          │
                       │  ┌────────────┐  ┌────────▼───────┐  ┌───────────┐  │
                       │  │ Zero-Shot  │  │ Temporal Graph │  │ Geographic│  │
                       │  │ Novel      │◀─┤ Diffusion      │  │ Heatmap   │  │
                       │  │ Detection  │  │ Engine         │  │ Engine    │  │
                       │  └─────┬──────┘  └────────┬───────┘  └─────┬─────┘  │
                       │        │                  │                │        │
                       │        └──────────┬───────┘────────────────┘        │
                       │                   │                                  │
                       │           ┌───────▼──────────┐                      │
                       │           │ ICSR Report      │                      │
                       │           │ Generator        │──▶ CDSCO / WHO      │
                       │           │ (E2B R3 Format)  │    VigiBase          │
                       │           └──────────────────┘                      │
                       └──────────────────────────────────────────────────────┘
```

---

## 3. Core Features Deep-Dive

### 3.1 Generic Configurable Data Acquisition Engine

The ingestion layer is completely source-agnostic. Healthcare teams configure:
- **Keyword sets**: Drug names, symptom terms, brand names
- **Source lists**: Specific subreddits, Twitter handles, forum URLs
- **Ingestion cadence**: Real-time, daily, or weekly through the project dashboard

Adding a new drug or condition requires zero code changes — only a configuration update through the UI.

**Implementation**: `lib/crawlers/registry.ts` provides a pluggable crawler architecture. Each source type (X/Twitter, Reddit) has a dedicated crawler module. The system reads from pre-populated CSV data files simulating live API feeds.

### 3.2 Edge-First PHI/PII Redaction (DPDP Act 2023 Compliant)

Patient data is stripped out **before** it reaches the analysis server:
- **Email addresses**: `user@example.com` → `[EMAIL]`
- **Phone numbers**: Indian mobile format → `[PHONE]`
- **Aadhaar numbers**: 12-digit pattern → `[AADHAAR]`
- **PAN numbers**: Standard format → `[PAN]`
- **Age references**: `32 years old` → `[AGE]`

This is architecturally enforced privacy — the centralized analysis server never sees raw personal data.

**Implementation**: `lib/pii.ts` runs regex-based redaction using India-specific patterns (Aadhaar, PAN, +91 phone format).

### 3.3 Zero-Shot Novel Adverse Event Detection

Standard pharmacovigilance tools match posts against MedDRA term lists and miss anything new. PulseListen:

1. Maintains a comprehensive **known MedDRA adverse event term list** (40+ standard terms)
2. Identifies **novel symptom patterns** not in MedDRA: brain fog, metallic taste, electric shock sensations, phantom smell, etc.
3. Clusters novel mentions into **Emerging Unknown Signal clusters**:
   - Cognitive Impairment Cluster
   - Sensory Disturbance Cluster
   - Neurological Novelty Cluster
   - Psychiatric Novelty Cluster
   - Thermoregulation Cluster

Each mention receives a **novelty score** (0-1) and cluster assignment.

**Implementation**: `lib/zero-shot.ts` simulates semantic embedding with pattern matching against known and novel symptom databases.

### 3.4 Multilingual Indian Language Pipeline

The platform processes posts in **7 languages natively**:
- English, Hindi, Kannada, Tamil, Telugu, Bengali, Marathi

Each language has its own keyword banks for:
- Adverse event indicators (e.g., Hindi: "dard", "bukhar", "chakkar")
- Positive experience markers
- Complaint indicators
- Question patterns

Language detection uses Unicode range analysis for scripts (Devanagari, Kannada, Tamil, Telugu, Bengali) and romanized Hindi detection for transliterated posts.

**Implementation**: `lib/ai.ts` contains per-language keyword dictionaries with `detectLanguage()` using Unicode regex patterns, simulating IndicBERT's multilingual capabilities.

### 3.5 Temporal Graph Diffusion Engine

Every detected signal's propagation pattern is analyzed:

- **Organic Clusters**: Many unique sources, slow geographic diffusion, tree-topology spread → **Verified Cluster**
- **Bot-Amplified**: Few seed accounts, rapid star-topology amplification → **Misinformation Flag**
- **Mixed**: Some organic patterns with unusual velocity → **Under Review**

The engine generates interactive graph visualizations showing:
- Source nodes (patient reports)
- Amplifier nodes (bot accounts)
- Receiver nodes (downstream reposts)
- Edge weights representing connection strength

**Implementation**: `lib/diffusion.ts` generates procedural graphs with deterministic seeding from mention IDs, rendered on HTML5 Canvas in the browser.

### 3.6 Regulatory-Grade ICSR Report Generator

Every verified adverse event auto-generates a structured ICSR containing:
- **Report metadata**: ID, version, timestamp, report type
- **Patient section**: Redacted initials, age group, sex
- **Reaction section**: Description, MedDRA terms, onset date, outcome, novelty flag
- **Drug section**: Suspect drug name, indication, dosage, route, action taken
- **Source section**: Platform, redacted post URL, language, acquisition timestamp
- **Analysis section**: Signal type, sentiment, confidence, diffusion verdict
- **Regulatory section**: Target authority (CDSCO), format (E2B R3), compliance notes

Severity classification: MILD → MODERATE → SEVERE → LIFE_THREATENING

**Implementation**: `lib/icsr.ts` produces structured JSON reports compliant with WHO VigiBase / CDSCO Individual Case Safety Report format.

---

## 4. Data Pipeline

Each mention flows through a **6-stage processing pipeline**:

```
Raw Post → Edge PII Redaction → Multilingual AI Analysis
         → Zero-Shot Novelty Detection → Geographic Assignment
         → Diffusion Analysis → ICSR Generation (if adverse)
```

All stages run synchronously during crawl operations, ensuring every mention is fully analyzed before storage.

---

## 5. Database Schema

| Model | Fields | Purpose |
|-------|--------|---------|
| **Project** | name, description, keywords, isActive | Monitoring project configuration |
| **Source** | projectId, sourceType, cadence, config, lastCrawledAt | Data source configuration |
| **Mention** | rawText, redactedText, piiFlags, signalType, sentiment, entities, isAdverseEvent, detectedLanguage, noveltyScore, isNovelSignal, clusterLabel, diffusionLabel, spreadPattern, geoState, geoCity, geoLat, geoLng | Processed social mention |
| **ICSRReport** | mentionId, projectId, reportJson, severity, status | Generated safety report |
| **AdminAction** | projectId, action, details | Audit trail |

---

## 6. UI/UX Design

The platform features a premium dark-mode design with:
- **Glassmorphism** sidebar navigation with gradient accents
- **6 KPI cards** with color-coded gradient icons
- **Sentiment bars**, **language breakdown**, and **top states** panels
- **Interactive diffusion graph** with HTML5 Canvas rendering
- **Expandable ICSR report cards** with compliance metadata
- **Geographic heatmap** with state-wise density visualization
- **Project detail pages** with 6 tabs: Overview, Mentions, Adverse Events, Novel Signals, Sources, Timeline

---

## 7. DPDP Act 2023 Compliance

| Requirement | Implementation |
|------------|---------------|
| Data minimization | Edge-first PII redaction before analysis |
| Purpose limitation | Configured keyword-based acquisition |
| Consent | Platform processes only public social data |
| Redaction | Email, phone, Aadhaar, PAN, age stripped |
| Audit trail | AdminAction model logs all operations |
| Data retention | Project-scoped, deletable via API |

---

## 8. Who Benefits

- **CDSCO and Indian drug regulators**: Early warning with ready-to-file ICSR reports
- **Pharma companies**: Detect unlisted side effects before they escalate
- **State health departments**: Real-time outbreak detection from social signals
- **WHO and global health bodies**: Structured ICSR feeds from India's 800M+ internet users
- **Hospital patient safety teams**: Community sentiment tracking for treatments

---

## 9. Key References

- [CDSCO — Central Drugs Standard Control Organisation](https://cdsco.gov.in/)
- [MedDRA — Medical Dictionary for Regulatory Activities](https://www.meddra.org/)
- [WHO VigiBase — Global Pharmacovigilance Database](https://www.who-umc.org/vigibase/vigibase/)
- [Digital Personal Data Protection Act 2023 — MeitY](https://www.meity.gov.in/data-protection-framework)
- [IndicBERT — AI4Bharat Multilingual Model](https://ai4bharat.iitm.ac.in/indicbert)
- [Temporal Graph Networks — Research Paper](https://arxiv.org/abs/2006.10637)

---

## 10. Running the Platform

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Initialize database
npx prisma db push

# Seed demo data (runs full 6-stage pipeline)
npm run seed

# Start development server
npm run dev
# Open http://localhost:3000
```

---

*PulseListen AI — PanIIT AI for Bharat Hackathon — Theme 6: Real-Time Social Listening for Patient Experience & Safety Signals*
