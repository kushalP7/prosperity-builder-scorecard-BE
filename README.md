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

### Payments: Invoice / mail check (offline only)

Checkout always creates a **pending invoice** order and emails a PDF. Package access unlocks only when a **super_admin** calls `POST /api/v1/orders/:id/mark-paid`.

| Variable | Purpose |
| :--- | :--- |
| `FRONTEND_URL` | Used in invoice / payment emails (login CTA) |

Stripe and stub card checkout have been removed. One-time DB cleanup for legacy card test orders: `scripts/cleanup-legacy-card-orders.sql`.

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
