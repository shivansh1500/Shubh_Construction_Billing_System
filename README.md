# Shubh Construction Billing System

A browser-based billing application for construction businesses. The Express server serves the compiled frontend in production.

## Quick Start (Development)

### Prerequisites
- Node.js v20+ (v24 recommended)
- npm

### 1. Install Dependencies

```bash
# Install root, frontend, and backend dependencies
npm install
npm run install:all
```

### 2. Start in Development Mode

**Option A: Use the startup script (Mac/Linux)**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Option B: Manual start**

Terminal 1 - Backend:
```bash
cd backend && npm start
```

Terminal 2 - Frontend:
```bash
cd frontend && npm run dev
```

Then open: **http://localhost:5173**

### Production-like web server

```bash
npm run build
npm start
```

Then open: **http://localhost:3001**. The backend serves the built frontend and API together.

---

## Project Structure

```
shubh_construction_billing_system/
├── frontend/
│   └── src/
│       ├── pages/      # Dashboard, CreateBill, BillHistory, etc.
│       ├── components/ # Sidebar, Header, BillItemsTable, etc.
│       ├── layouts/    # MainLayout
│       ├── services/   # api.js (Axios)
│       └── utils/      # Formatting helpers
├── backend/
│   ├── server.js       # Express app
│   ├── database/       # SQLite setup (billing.db)
│   ├── controllers/    # Bills, Templates, Settings, Backup
│   ├── routes/         # API routes
│   └── services/       # PDF generation (Puppeteer)
└── backend/data/       # Auto-created: database, bill PDFs, uploads, backups
```

## Features

- ✅ Dashboard with stats (total bills, revenue)
- ✅ Create bills with unlimited items
- ✅ Dynamic calculations (qty × rate, discount, GST)
- ✅ Multiple bill templates with HTML/CSS editor
- ✅ Live template preview
- ✅ PDF generation with Puppeteer
- ✅ Bill history with search & filters
- ✅ Edit existing bills
- ✅ Company settings (logo, signature, GST)
- ✅ Backup & Restore to local ZIP
- ✅ Fully offline — no internet needed

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bills | List bills (paginated, searchable) |
| POST | /api/bills | Create bill |
| GET | /api/bills/:id | Get bill |
| PUT | /api/bills/:id | Update bill |
| DELETE | /api/bills/:id | Delete bill |
| POST | /api/bills/:id/pdf | Generate PDF |
| GET | /api/templates | List templates |
| POST | /api/templates | Create template |
| PUT | /api/templates/:id | Update template |
| DELETE | /api/templates/:id | Delete template |
| POST | /api/templates/:id/default | Set default |
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |
| POST | /api/backup | Create backup ZIP |
| POST | /api/restore | Restore from ZIP |

## Template Placeholders

```
{{companyName}}     {{billNumber}}     {{customerName}}
{{companyAddress}}  {{billDate}}       {{customerAddress}}
{{companyPhone}}    {{dueDate}}        {{customerMobile}}
{{companyEmail}}    {{items}}          {{customerGST}}
{{gstNumber}}       {{subtotal}}       {{footerText}}
{{taxRate}}         {{discount}}
{{tax}}             {{grandTotal}}
```
