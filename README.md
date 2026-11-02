# Rose Associates Backend — NestJS Microservice

NestJS + PostgreSQL + Sequelize ORM microservice providing RESTful APIs for the **Prosperity Builder Scorecard** application.

---

## 🚀 Quick Start Guide

### 1. Requirements
* Node.js v18 or v20+
* Docker & Docker Compose (or local PostgreSQL server running on port 5432)

### 2. Setup PostgreSQL Container
```bash
docker-compose up -d
```

### 3. Install Dependencies & Start Server
```bash
npm install
npm run start:dev
```

The NestJS backend server will run on **`http://localhost:3001`**.

### Payments: stub vs Stripe (`PAYMENT_PROVIDER`)

| Variable | Purpose |
| :--- | :--- |
| `PAYMENT_PROVIDER` | `stub` (default local) or `stripe` — works locally when set to `stripe` + test keys |
| `STRIPE_SECRET_KEY` | Required when `PAYMENT_PROVIDER=stripe` (`sk_test_…` for sandbox) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`); optional locally (confirm-payment still unlocks) |
| `ALLOW_STUB_PAY` | Optional admin stub override while using Stripe (non-production only) |
| `FRONTEND_URL` | Optional; return URLs / docs |

**Local without Stripe:** `PAYMENT_PROVIDER=stub` → fake card checkout.  
**Local with Stripe sandbox:** `PAYMENT_PROVIDER=stripe` + test keys + FE `VITE_STRIPE_PUBLISHABLE_KEY`.  
**Production:** `PAYMENT_PROVIDER=stripe` (stub pay is always blocked).

Checkout UI reads `GET /api/v1/orders/payment-config` to pick Stripe Element vs fake card.

Webhook (when using Stripe): `https://<your-api-host>/api/v1/stripe/webhook`  
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`  
Local: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`

Checkout requires JWT. Amounts always come from Settings.

---

## 📚 REST API & Swagger Documentation

Once the server is running, open:
* **Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Core Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/projects` | List all projects |
| **POST** | `/api/v1/projects` | Create a project |
| **GET** | `/api/v1/projects/:id` | Get project data matrix and assigned section snapshots |
| **POST** | `/api/v1/projects/:id/sections` | Assign template section snapshot to project |
| **PATCH** | `/api/v1/projects/:id/data` | Batch update data matrix records |
| **GET** | `/api/v1/templates` | Get full template tree (Sections $\rightarrow$ Categories $\rightarrow$ Groups $\rightarrow$ Columns) |
| **GET** | `/api/v1/analytics/overall` | Multi-project comparative analytics & sector averages |
| **GET** | `/api/v1/settings` | Get company profile and score rating bands |
| **PUT** | `/api/v1/settings` | Update company profile and rating bands |
