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

---

## 📚 REST API & Swagger Documentation

Once the server is running, open:
* **Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Core Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/v1/seed/sample-data` | Populates standard 12 sections, 6 default columns, and sample projects |
| **POST** | `/api/v1/seed/reset` | Resets database tables back to clean sample state |
| **GET** | `/api/v1/projects` | List all projects |
| **POST** | `/api/v1/projects` | Create a project |
| **GET** | `/api/v1/projects/:id` | Get project data matrix and assigned section snapshots |
| **POST** | `/api/v1/projects/:id/sections` | Assign template section snapshot to project |
| **PATCH** | `/api/v1/projects/:id/data` | Batch update data matrix records |
| **GET** | `/api/v1/templates` | Get full template tree (Sections $\rightarrow$ Categories $\rightarrow$ Groups $\rightarrow$ Columns) |
| **GET** | `/api/v1/analytics/overall` | Multi-project comparative analytics & sector averages |
| **GET** | `/api/v1/settings` | Get company profile and score rating bands |
| **PUT** | `/api/v1/settings` | Update company profile and rating bands |
