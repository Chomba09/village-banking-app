# Smart Bank — Village Banking Web Application

A full-stack web application that digitises savings and loan management for Village Savings and Loan Associations (VSLAs), commonly known in Zambia as *Chilimba*. Built as a final-year Computer Science project at the University of Zambia.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Variables](#7-environment-variables)
8. [Running the Application](#8-running-the-application)
9. [API Reference](#9-api-reference)
10. [Known Limitations](#10-known-limitations)

---

## 1. Project Overview

Village banking groups pool members' savings to provide short-term loans to one another, sharing the interest earned at the end of each savings cycle. These groups typically manage their records manually — using notebooks or basic spreadsheets — which leads to transcription errors, disputes over balances, and slow end-of-cycle calculations.

Smart Bank replaces the paper ledger with a secure, web-based system. It gives treasurers a full administration interface and gives members transparent, real-time visibility into their savings, loans, and account balances.

---

## 2. Features

### Authentication & Roles
- JWT-based login with 60-minute access tokens and 7-day refresh tokens
- Two roles: **Treasurer** (group administrator) and **Member**
- Every member receives a unique, permanent **Member ID** (e.g. `VB-0001`) that appears in all records and reports

### Group Management
- Treasurer creates a group with configurable financial rules: minimum and maximum contribution amounts, interest rate, four penalty types (late loan, late savings, no savings, default), and a member cap
- Members join via a UUID invite link
- Groups run in **savings cycles** with configurable start/end dates, a savings cut-off, a borrowing cut-off, and a member-admission deadline
- Treasurer can archive a group at end-of-cycle, notifying all members and freezing further activity

### Contributions
- Members log savings contributions; treasurer confirms or rejects each one before it counts toward the pool
- Treasurer can also submit contributions on a member's behalf
- Full contribution history per member and per group

### Loans
- Members apply for loans against the group pool
- Treasurer approves or rejects and sets the interest rate at approval time
- System automatically calculates: interest amount, total due, total repaid, and remaining balance
- Loan eligibility is calculated as: `total confirmed savings × max_loan_percentage% − outstanding loans`

### Transactions & Withdrawals
- Deposit and withdrawal requests logged per member with treasurer approval required for withdrawals
- Per-member running account balance per group
- Full filterable transaction history

### Notices & Notifications
- Treasurer posts group-wide notices
- In-app notification feed fires automatically on: joining a group, new cycle, status changes, member removal, and group archiving

### Reporting & Dashboard
- **Treasurer dashboard**: per-group totals across all managed groups
- **Member dashboard**: personal totals per group
- **Group financial report**: per-member breakdown (treasurer only)
- **Cycle report**: full end-of-cycle payout statement — savings, loans, interest, repayments, and final payout (savings + proportional share of interest earned by the group)

### Search
- Global search across members, loans, and transactions from the top bar
- Search by name, Member ID, phone number, loan status, or transaction type
- Results scoped by role: treasurers search across their managed groups; members see their own records

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | Django + Django REST Framework | 6.0.7 / 3.17.1 |
| Authentication | djangorestframework-simplejwt | 5.5.1 |
| Database | PostgreSQL | — |
| Cross-origin | django-cors-headers | 4.9.0 |
| Frontend framework | React + Vite | 19.2 / 8.x |
| Routing | react-router-dom | 7.18 |
| HTTP client | axios | 1.19 |
| Icons | lucide-react | — |
| Styling | Hand-written CSS with custom properties | — |

---

## 4. Architecture

```
React SPA (Vite)  ──Axios + JWT──►  Django REST API  ──►  PostgreSQL
                                          │
                          ┌───────────────┼───────────────┐
                       accounts        groups          contributions
                       loans        transactions        notices
                       notifications   dashboard
```

The backend is split into **8 focused Django apps**. The `dashboard` app owns no models — it is a pure aggregation layer over the other apps' data.

---

## 5. Project Structure

```
village-banking-app/
├── backend/
│   ├── core/            # Django project settings and root URL config
│   ├── accounts/        # Custom User model, register/login/profile
│   ├── groups/          # Group, Cycle, Membership models and views
│   ├── contributions/   # Contribution model, confirm/reject workflow
│   ├── loans/           # Loan, LoanRepayment models, approval and repayment
│   ├── transactions/    # Transaction, MemberAccount models
│   ├── notices/         # Treasurer announcements per group
│   ├── notifications/   # In-app notification feed
│   ├── dashboard/       # Aggregation views, reports, global search
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/         # Configured axios instance (JWT-bearing requests)
    │   ├── components/  # DashboardLayout, Sidebar, TopBar, ProtectedRoute
    │   ├── context/     # ThemeContext (light/dark toggle)
    │   ├── pages/       # ~26 page components
    │   └── styles/      # main.css — full palette as CSS custom properties
    ├── package.json
    └── vite.config.js
```

---

## 6. Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

### 1. Clone the repository

```bash
git clone https://github.com/Chomba09/village-banking-app.git
cd village-banking-app
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Create the PostgreSQL database

Open a PostgreSQL prompt (`psql`) and run:

```sql
CREATE USER village_user WITH PASSWORD 'your_password_here';
CREATE DATABASE village_banking OWNER village_user;
ALTER USER village_user CREATEDB;
```

### 4. Configure settings

Update the `DATABASES` section in `backend/core/settings.py` with your database credentials (see Section 7).

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create a superuser (optional — for Django admin access)

```bash
python manage.py createsuperuser
```

### 7. Frontend setup

```bash
cd ../frontend
npm install
```

---

## 7. Environment Variables

The following values need to be set in `backend/core/settings.py` before running the application. The defaults shown are for local development only — **never use these in production**.

| Setting | Where in settings.py | Development value |
|---|---|---|
| `SECRET_KEY` | Line 23 | Replace with a long random string |
| `DEBUG` | Line 26 | `True` |
| `DATABASES['default']['NAME']` | Line 95 | `village_banking` |
| `DATABASES['default']['USER']` | Line 96 | `village_user` |
| `DATABASES['default']['PASSWORD']` | Line 97 | Your chosen password |
| `DATABASES['default']['HOST']` | Line 98 | `localhost` |
| `CORS_ALLOWED_ORIGINS` | Line 151 | `http://localhost:5173` |

For a production deployment, move these to a `.env` file and use `python-decouple` to read them.

---

## 8. Running the Application

### Start the backend

```bash
cd backend
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

### Start the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173/`.

### First-time walkthrough

1. Go to `http://localhost:5173/register` and create a **Treasurer** account.
2. Log in — you will land on the Treasurer dashboard.
3. Create a group. Copy the invite link from the group detail page.
4. Register a second account as a **Member** and use the invite link to join.
5. Log in as the member and make a contribution.
6. Log in as the treasurer, confirm the contribution, and explore the loan and reporting flows.

---

## 9. API Reference

All endpoints are mounted under `/api/`. Every authenticated endpoint requires:

```
Authorization: Bearer <access_token>
```

### Accounts — `/api/accounts/`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `register/` | None | Register a new user |
| POST | `login/` | None | Obtain access and refresh tokens |
| POST | `token/refresh/` | None | Refresh an expired access token |
| GET / PUT | `profile/` | Required | View or update profile |
| POST | `password/change/` | Required | Change password |

### Groups — `/api/groups/`

| Method | Path | Description |
|---|---|---|
| GET | `` | List groups the user belongs to |
| POST | `create/` | Create a group (treasurer) |
| GET | `<id>/` | Group detail |
| GET / POST | `join/<uuid:token>/` | Join group via invite link |
| GET | `<id>/members/` | List group members |
| POST | `<id>/new-cycle/` | Start a new savings cycle (treasurer) |
| POST | `<id>/archive/` | Archive a group (treasurer) |
| GET | `archived/` | List archived groups |
| GET | `<id>/loan-availability/` | Available pool for new loans |
| PATCH | `<id>/members/<mid>/status/` | Toggle member active/inactive (treasurer) |
| DELETE | `<id>/members/<mid>/remove/` | Remove an inactive member (treasurer) |

### Contributions — `/api/contributions/`

| Method | Path | Description |
|---|---|---|
| POST | `make/` | Submit a contribution |
| GET | `my/` | Own contribution history |
| PATCH | `<id>/status/` | Confirm or reject (treasurer) |
| GET | `group/<id>/` | All contributions for a group (treasurer) |
| GET | `group/<id>/activity/` | Group activity feed |

### Loans — `/api/loans/`

| Method | Path | Description |
|---|---|---|
| POST | `apply/` | Apply for a loan |
| GET | `my/` | Own loan history |
| GET | `group/<id>/` | All loans for a group (treasurer) |
| PATCH | `<id>/status/` | Approve or reject (treasurer) |
| POST | `repay/` | Record a repayment |

### Transactions — `/api/transactions/`

| Method | Path | Description |
|---|---|---|
| GET | `` | Own transaction history |
| POST | `deposit-withdraw/` | Log a deposit or withdrawal request |
| GET | `group/<id>/` | All transactions for a group |
| GET | `account/<id>/` | Member account balance for a group |
| GET | `withdrawals/pending/` | Pending withdrawal queue (treasurer) |
| POST | `withdrawals/<id>/approve/` | Approve a withdrawal (treasurer) |

### Dashboard & Reports — `/api/dashboard/`

| Method | Path | Description |
|---|---|---|
| GET | `treasurer/` | Treasurer overview across all groups |
| GET | `member/` | Member overview across all groups |
| GET | `group/<id>/report/` | Per-member financial report (treasurer) |
| GET | `group/<id>/cycle-report/` | End-of-cycle payout statement |
| GET | `search/?q=<query>` | Global search |

### Notices — `/api/notices/`

| Method | Path | Description |
|---|---|---|
| POST | `create/` | Post a group notice (treasurer) |
| GET | `group/<id>/` | List notices for a group |

### Notifications — `/api/notifications/`

| Method | Path | Description |
|---|---|---|
| GET | `` | Notification feed |
| GET | `unread-count/` | Count of unread notifications |
| PATCH | `<id>/read/` | Mark a notification as read |

---

## 10. Known Limitations

- **No automated tests** — `tests.py` in each Django app is still an empty stub. The financial logic (loan interest, cycle report payout, loan availability) would be the first priority for a test pass.
- **No password reset flow** — only authenticated in-app password change is implemented. A "forgot password" email flow does not exist.
- **No production configuration** — `DEBUG=True` and the secret key are hardcoded in `settings.py`. A production deployment requires a secrets-based settings split, a WSGI server (e.g. Gunicorn), and a reverse proxy (e.g. Nginx).
- **No report export** — the cycle report and financial report return JSON only. PDF or Excel export is not yet implemented (Pillow is installed but unused).
- **No offline support** — the application requires an active internet connection. Offline data capture was listed as a proposal scope item but was not implemented in this version.
- **CORS allows localhost only** — `CORS_ALLOWED_ORIGINS` is set for local development. This must be updated for any deployed environment.

---

*Developed by Chomba Kampengele — University of Zambia, Department of Computing and Informatics, 2026.*
