# Non-Move Stock Analysis Web Application

A full-stack Next.js application for store and regional staff to analyze **Non-Move inventory**, submit explanation notes, and request SKU exclusions with photo evidence and regional approval workflows.

---

## Features

1. **Identify & Audit Access Gate (`/`)**:
   - Cascaded Region -> Store branch selector (excludes DC distribution centers).
   - Name and Thai 10-digit mobile number capture for audit logging.
   - Persistent store session stored via cookies and localStorage.

2. **Store Scoped Non-Move Dashboard (`/dashboard/[branchCode]`)**:
   - KPIs: Total Non-move SKUs, Total Units, Total Value (THB), and Worst-bucket High Non-move ratio.
   - Recharts Visualizations: Non-move Days Bucket distribution and Category value breakdown.
   - Live Metric Pill: Dynamic `% High Non-move vs % OK` calculation matching active category and search filters.
   - Multi-snapshot Date Selector: Switch between historical daily report dates.

3. **Model Explorer & Action Drawer**:
   - Searchable, sortable, filterable table by Category, Nonmove Bucket, Aging Days, and SKU type (`SELLABLE` vs `MOCK_UP`).
   - Action Drawer:
     - **Explain**: Provide reason why product has not sold.
     - **Request Exclusion**: Request HQ exclusion from non-move penalty with photo evidence.
     - S3/R2 storage integration for evidence photos with client-side preview.

4. **Approver Queue (`/approvals`)**:
   - Passcode-gated queue for Regional Managers and HQ.
   - Filter by region and status (`PENDING`, `APPROVED`, `REJECTED`).
   - Lightbox preview of evidence photos.
   - One-click Approve / Reject with mandatory feedback note on reject.

5. **Daily Ingestion & ETL (`/admin/upload` & `scripts/etl/loadData.ts`)**:
   - Dynamic filename date parsing for `NonMoveReport YYYYMMDD.xlsx` (e.g. `NonMoveReport 20260818.xlsx`).
   - CLI script (`npm run etl`) and Web UI upload (`/admin/upload`).
   - Idempotent reload per date in transactions with batch inserts.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL + Prisma Client
- **Charts**: Recharts
- **Icons**: Lucide React
- **File Parsing**: SheetJS (`xlsx`) + `csv-parse`
- **Object Storage**: S3 / Cloudflare R2 (`@aws-sdk/client-s3`)
- **Deployment**: GitHub + Railway

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your database connection:
```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nonmovedb"
APPROVER_PASSCODE="admin123"
STORAGE_ENDPOINT=""
STORAGE_BUCKET="nonmove-photos"
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""
STORAGE_PUBLIC_BASE_URL=""
```

### 3. Generate Prisma Client & Migrate
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Daily Ingestion ETL
```bash
npm run etl
```
Or for a specific file/date:
```bash
npm run etl -- --file="./data/seed/NonMoveReport 20260818.xlsx"
npm run etl -- --date="2026-08-18"
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Railway

1. Push this repository to GitHub.
2. In [Railway](https://railway.app):
   - **New Project** -> **Deploy from GitHub repo**.
   - Select your repository.
3. Add **PostgreSQL** Plugin in Railway:
   - Click **+ New** -> **Database** -> **Add PostgreSQL**.
   - Railway will automatically inject `DATABASE_URL`.
4. Set Environment Variables in Railway:
   - `APPROVER_PASSCODE`: (e.g. `your-approver-secret`)
   - `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_BASE_URL` (from Cloudflare R2 or AWS S3).
5. Deploy:
   - Railway will execute `npm run build` (`prisma generate && next build`) and launch `npm run start`.
6. Run initial ETL on production:
   - In the Railway web console: `npm run etl`
   - Or upload new daily files via `https://<your-app>.up.railway.app/admin/upload`.
