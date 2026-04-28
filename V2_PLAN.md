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
