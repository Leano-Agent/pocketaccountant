# PocketAccountant v1.0 → PRD Vision — Master Plan

## Current State (v0.5)
Basic expense tracking app with auth, categories, budgets, manual entries, CSV import, and simple reports.

## PRD Target
Full AI-native financial companion for South Africans with bookkeeping, invoicing, tax compliance, mileage tracking, AI intelligence, and AR management.

---

## PHASE 1 — Core Business Tools (This Sprint)
*Target: Transform from "expense tracker" to "business tool"*

### 1.1 Invoicing Module ⭐⭐⭐
- Backend: Invoice model, CRUD routes, email sending, PDF generation
- Frontend: Invoice list, create/edit form, send dialog, status tracking
- Models: Invoice, InvoiceLineItem, Client/Contact

### 1.2 Financial Reports ⭐⭐
- Backend: P&L (Profit & Loss), Balance Sheet, Cash Flow query endpoints
- Frontend: Report viewer with date range filtering, export buttons
- Models: Leverage existing Expense/User/Category

### 1.3 OAuth Login ⭐⭐
- Backend: Google + Apple OAuth strategy (passport.js)
- Frontend: "Sign in with Google" / "Sign in with Apple" buttons
- Backward compatible with existing email/password auth

---

## PHASE 2 — Tax & Mileage (Next Sprint)
*Target: SARS-ready features for South African users*

### 2.1 Mileage Logbook
- Backend: MileageTrip model, CRUD, SARS rate engine, PDF/CSV export
- Frontend: Trip list, manual entry form, export button, SARS rate display
- Future: GPS auto-detection (mobile phase)

### 2.2 Tax Compliance
- Backend: TaxReturn model, SARS deadline calendar engine
- Frontend: Tax dashboard, ITR12 Q&A wizard, deadline calendar with push
- Future: eFiling integration (browser automation)

### 2.3 Chart of Accounts + Double-Entry
- Refactor BookkeepingEngine to enforce double-entry
- Account model with IFRS for SMEs Chart of Accounts template
- Migrate existing single-entry transactions to double-entry

---

## PHASE 3 — AI & Automation (Future)
*Target: Intelligent financial companion*

### 3.1 AI Integration
- Backend: LangChain/OpenAI orchestration, NL query endpoint
- Frontend: Chat interface (sidebar/bottom tab)
- Features: Natural language queries, smart categorization, anomaly detection

### 3.2 Bank Open Banking
- Integrate Stitch Money or TrueLayer SA
- Auto-sync transactions, reconciliation matching
- Historical import up to 12 months

### 3.3 AR Assistant
- Payment prediction model, invoice-dunning automation
- DSO tracking dashboard
- Automated reminder scheduling

---

## Architecture Decisions
- **Backend**: Node.js/Express (already built), add NestJS-style service layer
- **Database**: PostgreSQL for production (already supported), SQLite for dev
- **PDF Generation**: pdfmake or puppeteer on backend
- **Email**: SendGrid or nodemailer (SMTP already available at mail.tyriie.co.za)
- **Auth**: passport.js with JWT + OAuth strategies
- **Reports**: SQL aggregation queries + chart rendering
- **AI**: OpenAI API via LangChain (use existing DeepSeek key or OpenAI)

---

## Sub-Agent Task Breakdown
| Agent | Task | Files |
|-------|------|-------|
| Agent A | Invoicing Backend | models/Invoice.ts, routes/invoice.routes.ts, controllers/invoice.controller.ts, services/invoice.service.ts |
| Agent B | Invoicing Frontend | pages/Invoices.tsx, pages/CreateInvoice.tsx, components/InvoiceForm.tsx |
| Agent C | Financial Reports Backend+Frontend | Reports overhaul + query endpoints + P&L/Balance Sheet/Cash Flow |
| Agent D | OAuth Integration | passport config, Google/Apple strategies, frontend OAuth buttons |
| Agent E | Mileage Logbook Backend+Frontend | MileageTrip model, routes, controller, logbook page, export |
| Agent F | Tax Calendar Engine | TaxReturn model, SARS deadline logic, calendar UI, notifications |

---

## Progress Tracker

### PHASE 1 ✅ (Completed 2026-04-28 23:30)
| Task | Status | Commit |
|------|--------|--------|
| 1.1 Invoicing Backend | ✅ Done | a06fc09 |
| 1.2 Invoices Frontend | ✅ Done | a06fc09 |
| 1.3 Clients CRUD | ✅ Done | a06fc09 |
| 1.4 Report Improvements | ⬜ Next | — |

### PHASE 2 — Tax & Reports
| Task | Status | Notes |
|------|--------|-------|
| 2.1 P&L / Balance Sheet / Cash Flow | ⬜ | Needs backend aggregation |
| 2.2 Tax Calendar Engine | ⬜ | SARS deadline tracking + push |
| 2.3 Mileage Logbook | ⬜ | Manual entry, GPS later |

### PHASE 3 — AI & Automation
| Task | Status | Notes |
|------|--------|-------|
| 3.1 AI Chat (NL queries) | ⬜ | OpenAI/DeepSeek integration |
| 3.2 OAuth Login (Google/Apple) | ⬜ | passport.js strategies |
| 3.3 Auto-categorization | ⬜ | ML model or API-based |
| 3.4 Bank Open Banking | ⬜ | Stitch/TrueLayer integration |

### PHASE 4 — Advanced
| Task | Status | Notes |
|------|--------|-------|
| 4.1 SARS eFiling Integration | ⬜ | Browser automation |
| 4.2 AR Assistant (dunning, DSO) | ⬜ | Payment prediction |
| 4.3 Chart of Accounts + Double-Entry | ⬜ | Ledger refactor |
| 4.4 Multi-entity support | ⬜ | Personal + business toggle |
| 4.5 Subscription tiers | ⬜ | Free/Lite/Smart/Ultra |

### PHASE 1 ✅ (Completed 2026-04-28 23:30)
| Task | Status | Commit |
|------|--------|--------|
| 1.1 Invoicing Backend | ✅ Done | a06fc09 |
| 1.2 Invoices Frontend | ✅ Done | a06fc09 |
| 1.3 Clients CRUD | ✅ Done | a06fc09 |

### PHASE 2 ✅ (Completed 2026-04-28 23:45)
| Task | Status | Commit |
|------|--------|--------|
| 2.1 P&L, Balance Sheet, Cash Flow | ✅ Done | b35b1fe |
| 2.2 Dashboard with API data | ✅ Done | b35b1fe |

### PHASE 3 ✅ (Completed 2026-04-28 23:55)
| Task | Status | Commit |
|------|--------|--------|
| 3.1 Tax Calendar | ✅ Done | 1e1f19b |
| 3.2 Mileage Logbook | ✅ Done | 1e1f19b |
| 3.3 OAuth Login (Google/Apple) | ✅ Done | 42f10a1 |
| 3.4 Tax Returns | ⬜ | ITR12 Q&A assistant |

### PHASE 4 ✅ — AI & Automation (Completed 2026-04-28 23:55+)
| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| 4.1 AI Chat (NL queries) | ✅ Done | 26315cd | DeepSeek-powered, real-time queries |
| 4.2 Auto-categorization | ✅ Done | 8446da8 | 35+ SA merchant patterns |
| 4.3 Bank Open Banking | ⬜ | — | Stitch/TrueLayer/Yoco |
| 4.4 SARS eFiling | ⬜ | — | Browser automation |
| 4.5 AR Assistant | ⬜ | — | Dunning, DSO tracking |
| 4.6 Multi-entity | ⬜ | — | Personal + business |

### PHASE 5 ✅ — Platform & Polish (Completed 2026-04-29 00:00)
| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| 5.1 Type Fixes (was crash) | ✅ Done | 219fc42 | Expense.id: string\|number, userId: number |
| 5.2 Dark Mode | ✅ Done | 219fc42 | Toggle + persistence + system pref |
| 5.3 Mobile bottom nav | ✅ Done | 219fc42 | Fixed bottom, 5 items + More |
| 5.4 Data export (PDF) | ⬜ | — | SARS-compliant reports |
| 5.5 Auto-backup | ⬜ | — | SQLite → export |
| 5.6 PWA install prompt | ✅ Done | 219fc42 | 7-day cooldown, standalone detect |
| 5.7 Dark mode across pages | ⬜ | — | Individual pages need dark: classes |

### PHASE 6 — Production Ready (Future)
| Task | Status | Notes |
|------|--------|-------|
| 6.1 Full dark mode for all pages | ⬜ | Dark classes in Dashboard, Expenses, Invoices, etc. |
| 6.2 PDF export (SARS reports) | ⬜ | P&L, mileage logbook receipts |
| 6.3 PostgreSQL migration | ⬜ | Persistent database |
| 6.4 Email notifications | ⬜ | Invoice reminders, tax deadlines |
| 6.5 Team/collaboration | ⬜ | Shared accounts |
| 6.6 Vercel custom domain | ⬜ | pocketaccountant.co.za |
| 6.7 Mobile app (React Native) | ⬜ | Expo build |

### PHASE 6 — Production Ready (Future)
| Task | Status | Notes |
|------|--------|-------|
| 6.1 PostgreSQL migration | ⬜ | Persistent database |
| 6.2 Email notifications | ⬜ | Invoices, reminders |
| 6.3 Team/collaboration | ⬜ | Shared accounts |
| 6.4 Vercel custom domain | ⬜ | pocketaccountant.co.za |
| 6.5 Mobile app (React Native) | ⬜ | Expo build |

### PHASE 4 — AI & Automation
| Task | Status |
|------|--------|
| AI Chat (NL queries) | ⬜ |
| Auto-categorization | ⬜ |
| Bank Open Banking | ⬜ |
| SARS eFiling | ⬜ |
| AR Assistant | ⬜ |
| Multi-entity | ⬜ |
| Subscription tiers | ⬜ |
