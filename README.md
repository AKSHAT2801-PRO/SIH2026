# AI-Powered MPLAD Anomaly, Fraud & Inefficiency Detection System

> **Smart India Hackathon (SIH) Problem Statement:**  
> **Development of an AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme implementation**

## 📌 Overview

The **Members of Parliament Local Area Development Scheme (MPLADS)** supports the creation of durable community assets and local development infrastructure through projects recommended by Members of Parliament.

With a large number of projects, contractors, financial transactions, locations, timelines, and implementation records, manually identifying irregularities can be difficult and time-consuming.

Our solution is an **AI-powered web-based monitoring and decision-support platform** that analyzes MPLAD project data to identify:

- Financial anomalies
- Suspicious or abnormal project costs
- Duplicate or potentially overlapping projects
- Project delays and inefficiencies
- Contractor performance risks
- Unusual payment patterns
- Mismatch between reported and observed project progress
- Other patterns that require further investigation

The system does **not automatically declare an individual or organization fraudulent**. Instead, it generates a **risk score, supporting evidence, and investigation priority** so that authorized officials can make informed decisions.

---

## 🎯 Problem We Are Solving

MPLAD implementation can involve a large amount of heterogeneous data, including:

- Project details
- Sanctioned and estimated costs
- Expenditure and payment records
- Contractor information
- Project timelines
- Geographical coordinates
- Project categories
- Progress reports
- Photographs and supporting documents
- Historical project performance

Analyzing all these factors manually makes it difficult to identify subtle patterns such as:

> A project costing significantly more than similar projects in the same region.

> A contractor repeatedly associated with delayed or over-budget projects.

> Multiple projects appearing to represent the same or nearby work.

> Reported project progress being inconsistent with available evidence.

Our platform aims to convert this raw information into **actionable intelligence**.

---

# 🚀 Proposed Solution

Our system combines **data analytics, machine learning, anomaly detection, geospatial analysis, and visual verification** into a single platform.

### High-Level Workflow

```text
                 MPLAD DATA SOURCES
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Projects        Payments        Contractors
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  DATA PROCESSING
                         ↓
               FEATURE ENGINEERING
                         ↓
              ┌─────────────────────┐
              │     AI ENGINE       │
              ├─────────────────────┤
              │ Anomaly Detection   │
              │ Cost Analysis       │
              │ Delay Prediction     │
              │ Contractor Risk      │
              │ Duplicate Detection │
              └──────────┬──────────┘
                         ↓
                 RISK SCORING ENGINE
                         ↓
             ┌───────────┼───────────┐
             ↓           ↓           ↓
           LOW         MEDIUM       HIGH
             │           │           │
             └───────────┼───────────┘
                         ↓
                INVESTIGATION QUEUE
                         ↓
                 WEB DASHBOARD
```

---

# 🔍 Key Features

## 1. Financial Anomaly Detection

The system analyzes project costs and expenditure patterns to identify unusual financial behavior.

### Examples

- Cost significantly higher than similar projects
- Unexpected expenditure increases
- Excessive cost overruns
- Unusual payment patterns
- Potential duplicate payments

### Example

```text
Project Cost       : ₹40 Lakh
Expected Cost      : ₹25 Lakh
Deviation          : 60%

⚠️ HIGH COST ANOMALY
```

The expected cost can be estimated using historical projects with similar characteristics such as project type, location, scale, and other available parameters.

---

## 2. Project Delay & Inefficiency Detection

The platform compares planned project timelines with actual progress.

It can identify:

- Delayed projects
- Projects with slow progress
- Projects likely to miss their completion deadline
- Repeated delays associated with particular contractors
- Projects with unusually long implementation periods

### Example

```text
Expected Progress : 80%
Reported Progress : 42%

⚠️ POSSIBLE DELAY
```

The system can also calculate a **delay-risk score**.

---

## 3. Contractor Risk Analysis

Historical contractor performance can be analyzed to identify recurring patterns.

Possible indicators include:

- Number of completed projects
- Number of delayed projects
- Frequency of cost overruns
- Average project completion time
- Number of anomalies associated with previous projects
- Repeated involvement in high-risk projects

### Example

```text
Contractor: ABC Construction

Projects Completed : 24
Delayed Projects   : 9
Cost Overruns      : 6
High-Risk Projects : 5

Contractor Risk Score: 78/100
Status: HIGH RISK
```

A high risk score means the contractor's projects deserve closer review; it does not itself establish wrongdoing.

---

## 4. Duplicate & Similar Project Detection

The system can identify projects that appear unusually similar based on:

- Location
- Project description
- Project category
- Project dates
- Cost
- Contractor
- Geographic proximity

For example, if two records describe nearly identical infrastructure at almost the same location, the system can flag them for verification.

```text
Project A
Community Hall
Location: X
Cost: ₹15 Lakh

        ↕ Similarity Detection

Project B
Community Hall
Location: X + 100m
Cost: ₹14 Lakh

⚠️ POSSIBLE DUPLICATE / OVERLAPPING PROJECT
```

Natural Language Processing can be used to compare project descriptions.

---

## 5. Geospatial Analysis

Every project with geographical information can be visualized on an interactive map.

The map can show:

- Project locations
- Project categories
- Project status
- High-risk projects
- Project clusters
- Nearby similar projects
- Geographic anomalies

### Example

```text
🟢 Low Risk
🟡 Medium Risk
🔴 High Risk
⚠️ Requires Investigation
```

This enables officials to identify geographic patterns and prioritize field verification.

---

## 6. Project Progress Verification

Where photographs, geotagged images, or other visual evidence are available, the platform can compare reported progress with available evidence.

Potential computer vision capabilities include:

- Before/after image comparison
- Construction progress assessment
- Image similarity detection
- Detection of inconsistent or repeated images
- Verification of whether visible infrastructure corresponds to the reported project

This module is designed as an **additional evidence layer**, not as the sole basis for declaring a project fraudulent.

---

# 🧠 AI & Machine Learning

Our architecture can combine multiple AI/ML techniques instead of depending on a single model.

### Anomaly Detection

Potential techniques:

- Isolation Forest
- Local Outlier Factor
- One-Class SVM
- Autoencoders

Useful for identifying unusual project and financial behavior without requiring every anomaly to be manually labeled.

### Predictive Models

Potential models:

- Random Forest
- XGBoost
- Logistic Regression

Useful for:

- Delay-risk prediction
- Project-risk classification
- Contractor-risk scoring
- Cost estimation

### NLP

Potential techniques:

- TF-IDF + cosine similarity
- Sentence Transformers
- Transformer-based embeddings

Useful for comparing project descriptions and detecting potentially duplicate or overlapping projects.

### Computer Vision

Potential technologies:

- OpenCV
- YOLO
- CNN-based image models

Useful for analyzing project photographs and visual progress evidence.

---

# 📊 Unified Risk Score

One of the main outputs of our system is a **Project Risk Score**.

Example:

```text
              PROJECT #MPLAD1023

              RISK SCORE: 87/100
                   🔴 HIGH

     ┌──────────────────────────────────┐
     │ Cost Anomaly       : 92           │
     │ Delay Risk         : 78           │
     │ Contractor Risk    : 85           │
     │ Duplicate Risk     : 61           │
     │ Progress Anomaly   : 90           │
     └──────────────────────────────────┘

     Recommendation:
     PRIORITIZE FOR HUMAN INVESTIGATION
```

The score combines multiple independent signals.

This allows officials to focus their attention on projects with the highest combination of risk indicators.

---

# 🤖 Explainable AI

A key principle of our solution is **explainability**.

Instead of simply displaying:

> `Risk = 89`

the system explains:

> **Why is this project high risk?**

For example:

```text
🔴 High Risk

Reasons:
✓ Project cost is significantly higher than comparable projects
✓ Project is behind its planned timeline
✓ Contractor has a history of delayed projects
✓ Similar project detected nearby
✓ Reported progress differs from available visual evidence
```

This makes the platform more useful for real-world decision-making.

---

# 🖥️ Web Dashboard

The proposed dashboard will provide an overview of MPLAD implementation.

### Dashboard Components

- Total projects
- Completed projects
- Ongoing projects
- Delayed projects
- High-risk projects
- Financial anomalies
- Contractor risk
- Geographic map
- Recent alerts
- Investigation queue

### Project Details Page

Users can select an individual project and view:

```text
Project Information
        ↓
Financial Information
        ↓
Timeline & Progress
        ↓
Contractor History
        ↓
Geospatial Information
        ↓
AI Risk Analysis
        ↓
Supporting Evidence
        ↓
Investigation Recommendation
```

---

# 🏗️ Proposed Technology Stack

## Frontend

- React.js
- Vite
- JavaScript / TypeScript
- Tailwind CSS
- Charting library
- Interactive maps

## Backend

- Python
- FastAPI
- REST APIs

## AI / ML

- Python
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- OpenCV
- NLP / Transformer models

## Database

- MongoDB or PostgreSQL

## Geospatial

- Leaflet / MapLibre / similar mapping technology
- GeoJSON
- GPS coordinates

## Deployment

The final deployment architecture can use:

```text
Frontend → Web Hosting
Backend  → Cloud/API Server
Database → Managed Database
ML       → Backend inference service
```

---

# 📁 Proposed Project Structure

```text
MPLAD-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── charts/
│   │   ├── maps/
│   │   └── services/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── ml/
│   ├── anomaly_detection/
│   ├── cost_prediction/
│   ├── risk_scoring/
│   ├── contractor_analysis/
│   ├── duplicate_detection/
│   └── notebooks/
│
├── data/
│   ├── sample/
│   └── processed/
│
├── docs/
│
└── README.md
```

---

# 🔄 End-to-End Example

Consider a project:

```text
Project ID       : MPLAD-2026-001
Type             : Road Construction
Location         : Example District
Sanctioned Cost  : ₹25 Lakh
Actual Cost      : ₹34 Lakh
Expected Duration: 6 Months
Actual Duration  : 9 Months
Contractor       : ABC Construction
```

The system analyzes the project.

### AI findings

```text
Cost anomaly       → HIGH
Delay risk         → HIGH
Contractor risk    → MEDIUM
Duplicate risk     → LOW
Progress anomaly   → HIGH
```

### Final result

```text
Overall Risk Score: 82/100
Risk Level: HIGH 🔴

Recommended Action:
Prioritize project for human verification.
```

The authorized official can then inspect the supporting records and decide what action is appropriate.

---

# 🎯 Goals

Our primary goals are:

1. **Identify suspicious patterns early**
2. **Reduce manual effort in project monitoring**
3. **Improve financial transparency**
4. **Detect project inefficiencies**
5. **Prioritize high-risk projects for investigation**
6. **Provide explainable AI-based insights**
7. **Enable geographic and visual project monitoring**
8. **Support data-driven decision making**

---

# 🌍 Expected Impact

The proposed system can help improve:

### Transparency
Make irregular project patterns easier to identify.

### Efficiency
Allow officials to prioritize projects instead of manually reviewing every record with equal intensity.

### Financial Monitoring
Identify unusual cost and payment patterns.

### Project Monitoring
Detect delays and implementation inefficiencies earlier.

### Accountability
Maintain evidence-backed risk indicators and historical performance information.

### Better Decision Making
Provide officials with a consolidated view of financial, operational, geographical, and visual signals.

---

# 🔐 Important Design Principle

**AI will assist investigation, not replace human judgment.**

A detected anomaly does **not** automatically mean fraud.

The platform will distinguish between:

```text
Anomaly
   ↓
Risk Indicator
   ↓
Evidence Collection
   ↓
Human Verification
   ↓
Official Decision
```

This helps reduce false accusations and makes the system suitable as a **decision-support and monitoring platform**.

---

# 🚧 Development Roadmap

## Phase 1 — Data Foundation
- [ ] Define MPLAD data schema
- [ ] Collect/prepare publicly available or synthetic sample data
- [ ] Build database
- [ ] Create data preprocessing pipeline

## Phase 2 — AI Engine
- [ ] Implement anomaly detection
- [ ] Implement cost anomaly analysis
- [ ] Implement delay-risk prediction
- [ ] Implement contractor risk scoring
- [ ] Implement duplicate project detection
- [ ] Develop unified risk score

## Phase 3 — Dashboard
- [ ] Project overview
- [ ] Risk dashboard
- [ ] Interactive map
- [ ] Project details
- [ ] Contractor analytics
- [ ] Alerts and investigation queue

## Phase 4 — Visual Verification
- [ ] Image upload
- [ ] Geotag validation
- [ ] Image similarity
- [ ] Before/after comparison
- [ ] Construction progress analysis

## Phase 5 — Integration & Deployment
- [ ] Connect frontend and backend
- [ ] Optimize ML inference
- [ ] Authentication and authorization
- [ ] Testing
- [ ] Deployment
- [ ] Documentation

---

# 🏆 Vision

We aim to transform MPLAD monitoring from a primarily **manual and reactive process** into a **data-driven, AI-assisted, proactive monitoring system**.

> **Detect anomalies. Understand the risk. Prioritize investigation. Improve public infrastructure delivery.**

---

## 👥 Team

**Team Name:** Sahaya

**Meaning:** *To Help*

Our goal is to use technology to help improve transparency, efficiency, and accountability in public development projects.

---

## ⚠️ Disclaimer

This project is intended as an AI-assisted monitoring and decision-support prototype. AI-generated risk scores and anomaly alerts are indicators for further review and should not be treated as definitive proof of fraud, misconduct, or wrongdoing.
