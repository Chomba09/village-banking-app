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
7. [Environment Variables & Deployment](#7-environment-variables--deployment)
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
- Three roles:
  - **Treasurer** — creates and administers groups
  - **Chairperson** — a group member appointed by the treasurer who co-approves loans and can manage member status
  - **Member** — saves, borrows, and views their own records
- Users register as either Treasurer or Member; the Chairperson role is granted (and revoked) by the treasurer from the group members page
- Every member receives a unique, permanent **Member ID** (e.g. `VB-0001`) that appears in all records and reports

### Group Management
- Treasurer creates a group with configurable financial rules: minimum and maximum contribution amounts, interest rate, four penalty types (late loan, late savings, no savings, default), and a member cap
- Members join via a UUID invite link
- Groups run in **savings cycles** with configurable start/end dates, a savings cut-off, a borrowing cut-off, and a member-admission deadline
- Treasurer appoints one member of each group as its **chairperson**; the treasurer cannot appoint themselves, and appointing a new chairperson returns the previous one to the Member role
- Treasurer or chairperson can mark members inactive and remove inactive members; neither can deactivate or remove the other
- Treasurer can archive a group at end-of-cycle, notifying all members and freezing further activity

### Contributions
- Members log savings contributions; treasurer confirms or rejects each one before it counts toward the pool
- Treasurer can also submit contributions on a member's behalf
- Full contribution history per member and per group

### Loans
- Members apply for loans against the group pool
- **A group must have a chairperson** before any loan can be applied for or approved
- **Dual approval** — no one approves their own loan:

  | Applicant | Approval required |
  |---|---|
  | Member | Treasurer **and** chairperson |
  | Treasurer | Chairperson only |
  | Chairperson | Treasurer only |

- The treasurer sets the interest rate at approval time; the chairperson reviews pending loans on a dedicated approvals page
- System automatically calculates: interest amount (`amount × interest_rate%`), total due, total repaid, and remaining balance
- Loan eligibility is calculated as: `total confirmed savings × max_loan_percentage% − outstanding loans`

### Transactions
- Contributions, loan disbursements, and loan repayments are recorded as transactions
- Per-member running account balance per group
- Full filterable transaction history
- Deposit/withdrawal request serializers exist in `transactions/serializers.py`, but no API endpoints or UI are wired up for them yet

### Notices & Notifications
- Treasurer posts group-wide notices
- In-app notification feed fires automatically on: joining a group, new cycle, contribution and loan status changes, loans awaiting approval, chairperson appointment/removal, member removal, and group archiving

### Reporting & Dashboard
- **Treasurer dashboard**: per-group totals across all managed groups
- **Member dashboard**: personal totals per group
- **Group financial report**: per-member breakdown (treasurer only)
- **Cycle report**: full end-of-cycle payout statement — savings, loans, interest, repayments, and final payout (savings + proportional share of interest earned by the group)

### Search
- Global search across members, loans, and transactions from the top bar
- Search by name, Member ID, phone number, loan status, or transaction type
- Results scoped by role: treasurers search across their managed groups; members see their own records

### Interface
- Separate route sets for treasurers (`/treasurer/...`), chairpersons (`/chairperson/...`), and members (`/member/...`)
- Light/dark theme toggle
- Responsive layout: on mobile the sidebar becomes a slide-in overlay opened from a hamburger button in the top bar

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
| Production server | gunicorn + whitenoise | 21.2.0 / 6.7.0 |
| Hosting | Railway (backend + PostgreSQL), Vercel (frontend) | — |

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
│   ├── requirements.txt
│   ├── Procfile         # gunicorn start command
│   └── railway.toml     # Railway build/deploy config
└── frontend/
    ├── src/
    │   ├── api/         # Configured axios instance (JWT-bearing requests)
    │   ├── components/  # DashboardLayout, Sidebar, TopBar, ProtectedRoute
    │   ├── context/     # ThemeContext (light/dark toggle)
    │   ├── pages/       # 30 page components
    │   └── styles/      # main.css — full palette as CSS custom properties
    ├── env.example      # VITE_API_URL template
    ├── vercel.json      # SPA rewrite rule for Vercel
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

For local development, either set `DATABASE_URL` (e.g. `postgres://village_user:your_password_here@localhost:5432/village_banking`) or edit the local fallback `DATABASES` block in `backend/core/settings.py` to match your credentials. Set `DEBUG=True` locally. See Section 7 for every variable.

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create a superuser (optional — for Django admin access)

```bash
python manage.py createsuperuser
```

### 7. Load test data (optional)

```bash
python manage.py seed_uat_data          # safe to run more than once
python manage.py seed_uat_data --reset  # wipe seed data and recreate it
```

This creates a ready-to-use group with a treasurer (`uat_treasurer`) and three members (`uat_member1`–`uat_member3`). The command prints their login details when it finishes. Use it on development or test databases only.

### 8. Frontend setup

```bash
cd ../frontend
npm install
cp env.example .env   # then set VITE_API_URL if your API is not at http://127.0.0.1:8000/api
```

---

## 7. Environment Variables & Deployment

### Backend (read in `backend/core/settings.py`)

| Variable | Default if unset | Notes |
|---|---|---|
| `SECRET_KEY` | An insecure development key | **Always set in production** to a long random string |
| `DEBUG` | `False` | Set to `True` for local development |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated; add your backend domain in production |
| `DATABASE_URL` | Local PostgreSQL (`village_banking` on `localhost:5432`) | Parsed with `dj-database-url`; Railway sets it automatically |
| `FRONTEND_URL` | — | The deployed frontend origin. It is added to `CORS_ALLOWED_ORIGINS` and used to build group invite links |

`http://localhost:3000` and `http://localhost:5173` are always allowed by CORS.

### Frontend

| Variable | Default if unset | Notes |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | Base URL of the API, including the `/api` suffix |

### Deployment

- **Backend → Railway.** `railway.toml` builds with Nixpacks and starts `gunicorn core.wsgi --workers 2`. The `Procfile` contains the same command for other Heroku-style hosts. Static files are served by whitenoise (`python manage.py collectstatic`). Set `SECRET_KEY`, `ALLOWED_HOSTS` and `FRONTEND_URL`, attach a PostgreSQL database to provide `DATABASE_URL`, and run `python manage.py migrate` after each deploy that adds migrations.
- **Frontend → Vercel.** Set `VITE_API_URL` to the Railway API URL. `vercel.json` rewrites every path to `index.html` so client-side routes work on refresh.

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
4. Register two more accounts as **Members** and use the invite link to join with each.
5. Log in as the treasurer and appoint one of them chairperson from the group members page. Loans are blocked until a group has a chairperson.
6. Log in as the other member, make a contribution, and apply for a loan.
7. Log in as the treasurer to confirm the contribution and approve the loan, then log in as the chairperson to give the second approval on the **Loan Approvals** page.

Alternatively, run `python manage.py seed_uat_data` and log in with the seeded accounts.

### Running the tests

```bash
cd backend
python manage.py test loans.tests --verbosity=2
```

The suite covers the financial logic: loan interest and balance arithmetic, overdue detection and penalties, the loan-availability pool, and the cycle-report payout. Django creates a temporary test database, so the configured PostgreSQL user needs the `CREATEDB` privilege (granted in step 3 of the setup).

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
| PATCH | `<id>/members/<mid>/status/` | Toggle member active/inactive (treasurer or chairperson) |
| DELETE | `<id>/members/<mid>/remove/` | Remove an inactive member (treasurer or chairperson) |
| POST | `<id>/assign-chairperson/` | Appoint an active member as chairperson; body `{"user_id": <id>}` (treasurer) |
| POST | `<id>/remove-chairperson/` | Remove the current chairperson (treasurer) |

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
| POST | `apply/` | Apply for a loan (fails if the group has no chairperson) |
| GET | `my/` | Own loan history |
| GET | `<id>/` | Loan detail |
| GET | `group/<id>/` | All loans for a group (treasurer) |
| GET | `group/<id>/activity/` | Group loan activity feed |
| PATCH | `<id>/status/` | Treasurer approval or rejection; sets the interest rate |
| GET | `chairperson/pending/` | Loans awaiting the chairperson's approval (chairperson) |
| PATCH | `<id>/chairperson-approve/` | Chairperson approval; body `{"action": "approve" \| "reject"}` (chairperson) |
| POST | `repay/` | Record a repayment |

### Transactions — `/api/transactions/`

| Method | Path | Description |
|---|---|---|
| GET | `` | Own transaction history |
| GET | `group/<id>/` | All transactions for a group |
| GET | `account/<id>/` | Member account balance for a group |

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
| POST | `<id>/read/` | Mark a notification as read |
| POST | `read-all/` | Mark all notifications as read |

---

## 10. Known Limitations

- **Limited test coverage** — only the loan financial logic is tested (`backend/loans/tests.py`). The other seven apps' `tests.py` files are still empty, and there are no frontend tests.
- **No password reset flow** — only authenticated in-app password change is implemented. A "forgot password" email flow does not exist.
- **No deposit/withdrawal flow** — the transaction model supports deposits and withdrawals, but no endpoints or screens let members request them.
- **Roles are account-wide** — the role is stored on the user, not on the group membership, so someone appointed chairperson of one group uses the chairperson interface in every group they belong to.
- **Insecure local fallbacks** — if `SECRET_KEY` or `DATABASE_URL` is unset, `settings.py` falls back to hard-coded development values. Always set both in production.
- **No report export** — the cycle report and financial report return JSON only. PDF or Excel export is not yet implemented (Pillow is installed but unused).
- **No offline support** — the application requires an active internet connection. Offline data capture was listed as a proposal scope item but was not implemented in this version.
---

*Developed by Chomba Kampengele — University of Zambia, Department of Computing and Informatics, 2026.*
