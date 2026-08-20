# AI Build Prompt — Non-Move Stock Analysis Web App

Paste everything below into an AI coding agent (Claude Code, Cursor, etc.) as the
first instruction. It contains the full spec needed to scaffold, build, and deploy
the app to GitHub + Railway.

---

## 1. Project Goal

Build a full-stack web application that helps store/regional staff analyze
**"Non-move stock"** — SKUs that have not sold in a long time — for their own store.

Flow:
1. User opens the app and sees a simple **login/identify screen**:
   - Dropdown: **Region**
   - Dropdown: **Store** (filtered by the selected Region)
   - Text input: **Name**
   - Text input: **Phone number**
   - Button: **Enter**
2. On submit, the app records this session (name, phone, store, region, timestamp)
   for audit purposes, then routes the user to a **dashboard** scoped to that store.
3. The dashboard shows the store's non-move stock analysis: KPIs, filters, tables,
   and charts, all built from the daily `NonMoveReport YYYYMMDD.xlsx` feed enriched with the
   two dimension files.
4. The user can **explore per-model status** for their store: for every model
   they see whether it's classified **High Non-move** or **OK**, and the overall
   **% High vs % OK** split for the store (and per category).
5. For any individual model/row, the user can open an **action panel** and either:
   - **Explain** why the stock hasn't moved (free-text reason), or
   - **Request exclusion** of that SKU from the non-move list (reason required,
     photos optional/required depending on config).
6. Every explain/exclude action becomes a **Request** with status `PENDING`. A
   designated **Approver** (regional/HQ role) reviews pending requests in an
   **Approvals queue**, and can **Approve** or **Reject** with a comment. The
   original submitter can then see the **result** (approved/rejected + comment)
   against that model in their dashboard.

No password-based auth is required for the store-user flow — this is a
lightweight "identify yourself" gate, not a secure login system. Treat
name/phone as a lead-capture/audit log, not as a credential. The **Approver**
side does need a minimal access gate (see §6.4) since it's an approval action,
not just data entry.

---

## 2. Source Data & Daily Feed Specification

Three files will be dropped into `/data/seed/` in the repo, or uploaded daily:

### 2.1 `Dimension Store GH.csv` (or `Dimension_Store_GH.csv`) — store master (108 rows)
| Column | DB Field | Notes |
|---|---|---|
| `BranchCode` | `branchCode` | e.g. `GH-114`. **Primary join key** to the report. |
| `STORE_NAME_CUST` | `storeNameCust` | Thai display name, may contain double spaces |
| `STORE_ID` | `storeId` | e.g. `S00096` |
| `STORE_NAME` | `storeName` | e.g. `GH-NONGKHAI` |
| `PROVINCE` | `province` | Thai province name |
| `STORE_TYPE` | `storeType` | `STORE` or `DC` (distribution center — exclude DC from the store dropdown) |
| `REGION` | `region` | One of: `NORTHEAST`, `SOUTH`, `WEST&EAST`, `NORTH`, `BKK CENTRAL` |

### 2.2 `Dimension Model GH.csv` (or `Dimension_Model_GH.csv`) — product master (632 rows)
| Column | DB Field | Notes |
|---|---|---|
| `ProductCode` | `productCode` | Barcode/EAN. **Primary join key** to the report. |
| `ProductName` | `productName` | Full Thai product description |
| `MODEL` | `model` | Model number / name |
| `SKU_TYPE` | `skuType` | `SELLABLE` or `MOCK_UP` (showroom display units) |
| `CATEGORY` | `category` | e.g. `WH` (water heater) |
| `SUB_CATEGORY` | `subCategory` | e.g. `Manual`, `Digital` |
| `SIZE_GROUP` | `sizeGroup` | e.g. `3500W`, `4500W` |

### 2.3 `NonMoveReport YYYYMMDD.xlsx` — Daily Fact Table (~3,150–6,500 rows/day)
This is the **fact table**, refreshed daily.
- **File naming pattern**: `NonMoveReport YYYYMMDD.xlsx` (e.g., `NonMoveReport 20260818.xlsx`, `NonMoveReport 20260814.xlsx`, `NonMoveReport_20260818.xlsx`).
- **Date extraction**: The ETL extracts the 8-digit date (`YYYYMMDD` -> `YYYY-MM-DD`) from the filename automatically.
- **Columns** (single sheet named `Sheet` or `Sheet1`):
  `Nonmove Days`, `Aging Days`, `ProductCode`, `ProductName`, `BranchCode`, `BranchShort`, `BranchName`, `Stock Qty`, `มูลค่าสต๊อก` (stock value THB), `จำนวนสาขา` (# of branches carrying SKU), `Stock Qty รวม` (total company qty), `มูลค่าสต๊อกรวม` (total company stock value), `level`, `FO`, `MAX AS (12M)`, `All MAX AS (12M)`, `MOS level`, `MOS (Max AS)` (months of supply), `All MOS level`, `All MOS (Max AS)`, `PriceNormal`, `PricePro`, `VendorCode`, `VendorName`, `Assortment`, `Type`, `CategoryCode`, `CategoryName`, `GroupCode`, `GroupName`, `PatternCode`, `PatternName`, `DesignCode`, `DesignName`, `TypeCode`, `TypeName`.

> Note: this file **already contains category/vendor/group columns** — richer than the Dimension_Model file. Use `Dimension Model GH.csv` mainly to enrich with `SKU_TYPE`, `MODEL`, and `SIZE_GROUP`, which the report lacks. Use `Dimension Store GH.csv` to enrich with `REGION`, `PROVINCE`, `STORE_TYPE` (needed for the Region → Store dropdown cascade) since the report's `BranchName`/`BranchShort` don't include region.

### 2.4 Non-move classification (High / OK) & Verified Bucket Orders

The report's `Nonmove Days` and `Aging Days` columns are string buckets. The live dataset contains the following exact buckets:

```ts
// lib/nonmoveConfig.ts
export const NONMOVE_BUCKET_ORDER = [
  "30-60",
  "61-90",
  "91-120",
  "121-180",
  "181-210",
  "211-270",
  "271-365",
  "365+",
] as const;

export type NonmoveBucket = typeof NONMOVE_BUCKET_ORDER[number];

// Buckets >= this cutoff are classified as "HIGH" Non-move
export const HIGH_NONMOVE_CUTOFF: NonmoveBucket = "121-180";

export const AGING_BUCKET_ORDER = [
  "0-180",
  "181-365",
  "366-545",
  "546 -730",
  "731-910",
  "911-1095",
  "1096-1460",
  "1461-1825",
  "1826-2190",
] as const;

export function classifyNonmove(bucket: string): "HIGH" | "OK" {
  const cleanBucket = bucket.trim();
  const idx = NONMOVE_BUCKET_ORDER.indexOf(cleanBucket as NonmoveBucket);
  const cutoffIdx = NONMOVE_BUCKET_ORDER.indexOf(HIGH_NONMOVE_CUTOFF);
  if (idx === -1) return "OK";
  return idx >= cutoffIdx ? "HIGH" : "OK";
}
```

A model can appear in **multiple category/pattern rows** if variants exist — group by `ProductCode` within a store when computing the per-model status shown to the user, using the worst (highest index) bucket if a product has more than one row for the same store.

### 2.5 Join logic
```
NonMoveReport.BranchCode  ──▶ Dimension_Store_GH.BranchCode   (many report rows → 1 store)
NonMoveReport.ProductCode ──▶ Dimension_Model_GH.ProductCode  (many report rows → 1 product)
```
Some `ProductCode`/`BranchCode` values in the report may not exist in the dimension files (new SKUs/stores) — the ETL must `LEFT JOIN` and tolerate NULLs / auto-upsert placeholders, never drop report rows because a dimension lookup is missing.

---

## 3. Tech Stack (target: GitHub repo + Railway deployment)

- **Frontend + Backend**: Next.js 14+ (App Router, TypeScript) — single deployable
  service, simplest to run on Railway.
- **Database**: PostgreSQL (Railway managed Postgres plugin).
- **ORM**: Prisma.
- **Charts**: Recharts.
- **Styling**: Tailwind CSS.
- **File parsing (ETL)**: `xlsx` (SheetJS) for the Excel file, `csv-parse` for the
  CSVs, run as a Node script.
- **Package manager**: npm.

Reasoning: one Next.js service means one Railway service to deploy (plus the
Postgres plugin), a single `railway.json`/`Procfile`, and GitHub push → Railway
auto-deploy with no separate frontend/backend split to wire together.

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Store {
  branchCode     String   @id @map("branch_code")
  storeNameCust  String   @map("store_name_cust")
  storeId        String?  @map("store_id")
  storeName      String?  @map("store_name")
  province       String?
  storeType      String?  @map("store_type") // STORE | DC
  region         String
  nonMoveRows    NonMoveRow[]
  sessions       UserSession[]

  @@map("stores")
}

model Product {
  productCode  String   @id @map("product_code")
  productName  String   @map("product_name")
  model        String?
  skuType      String?  @map("sku_type") // SELLABLE | MOCK_UP
  category     String?
  subCategory  String?  @map("sub_category")
  sizeGroup    String?  @map("size_group")
  nonMoveRows  NonMoveRow[]

  @@map("products")
}

model NonMoveRow {
  id                String   @id @default(cuid())
  reportDate        DateTime @map("report_date") // date the daily file was generated/loaded
  nonmoveDaysBucket String   @map("nonmove_days_bucket")
  agingDaysBucket   String   @map("aging_days_bucket")
  branchCode        String   @map("branch_code")
  productCode       String   @map("product_code")
  stockQty          Int      @map("stock_qty")
  stockValue        Float    @map("stock_value")
  branchCountForSku Int?     @map("branch_count_for_sku")
  totalStockQty     Int?     @map("total_stock_qty")
  totalStockValue   Float?   @map("total_stock_value")
  level             Float?
  fo                Float?
  maxAs12m          Float?   @map("max_as_12m")
  allMaxAs12m       Float?   @map("all_max_as_12m")
  mosLevel          Float?   @map("mos_level")
  mosMaxAs          Float?   @map("mos_max_as")
  allMosLevel       Float?   @map("all_mos_level")
  allMosMaxAs       Float?   @map("all_mos_max_as")
  priceNormal       Float?   @map("price_normal")
  pricePro          Float?   @map("price_pro")
  vendorCode        String?  @map("vendor_code")
  vendorName        String?  @map("vendor_name")
  assortment        String?
  type              String?
  categoryCode      String?  @map("category_code")
  categoryName      String?  @map("category_name")
  groupCode         String?  @map("group_code")
  groupName         String?  @map("group_name")
  patternCode       String?  @map("pattern_code")
  patternName       String?  @map("pattern_name")
  designCode        String?  @map("design_code")
  designName        String?  @map("design_name")
  typeCode          String?  @map("type_code")
  typeName          String?  @map("type_name")

  store    Store   @relation(fields: [branchCode], references: [branchCode])
  product  Product @relation(fields: [productCode], references: [productCode])

  @@index([branchCode, reportDate])
  @@index([productCode])
  @@map("nonmove_rows")
}

model UserSession {
  id         String   @id @default(cuid())
  name       String
  phone      String
  branchCode String   @map("branch_code")
  region     String
  createdAt  DateTime @default(now()) @map("created_at")

  store    Store         @relation(fields: [branchCode], references: [branchCode])
  requests SkuRequest[]

  @@map("user_sessions")
}

enum RequestType {
  EXPLAIN
  EXCLUDE
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

model SkuRequest {
  id            String        @id @default(cuid())
  branchCode    String        @map("branch_code")
  productCode   String        @map("product_code")
  requestType   RequestType   @map("request_type")
  reason        String        // free-text explanation
  status        RequestStatus @default(PENDING)

  requestedById String        @map("requested_by_id") // UserSession.id
  requestedAt   DateTime      @default(now()) @map("requested_at")

  reviewedByName String?      @map("reviewed_by_name")
  reviewedAt     DateTime?    @map("reviewed_at")
  reviewComment  String?      @map("review_comment")

  store        Store          @relation(fields: [branchCode], references: [branchCode])
  product      Product        @relation(fields: [productCode], references: [productCode])
  requestedBy  UserSession    @relation(fields: [requestedById], references: [id])
  photos       RequestPhoto[]

  @@index([branchCode, status])
  @@index([productCode])
  @@map("sku_requests")
}

model RequestPhoto {
  id         String     @id @default(cuid())
  requestId  String     @map("request_id")
  url        String     // public URL from object storage (see §6.5)
  uploadedAt DateTime   @default(now()) @map("uploaded_at")

  request SkuRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@map("request_photos")
}
```

Also add the reverse relations on `Store` and `Product`:
```prisma
model Store {
  // ...existing fields
  requests SkuRequest[]
}

model Product {
  // ...existing fields
  requests SkuRequest[]
}
```

Keep `reportDate` on every `NonMoveRow` so the daily file can be re-loaded without
overwriting history — this lets the dashboard later support "as of" trend views if
needed, even though V1 only needs the latest date.

---

## 5. ETL / Data Load Architecture

Build `scripts/etl/loadData.ts`, runnable via `npm run etl`:

1. **Store & Product Masters**:
   - Parse `Dimension Store GH.csv` → upsert into `stores` (dedupe on `branchCode`).
   - Parse `Dimension Model GH.csv` → upsert into `products` (dedupe on `productCode`).
2. **Daily Feed Discovery & Date Parsing**:
   - Matches files named `NonMoveReport YYYYMMDD.xlsx` (or regex `NonMoveReport[ _]?(\d{8})\.xlsx`, e.g. `NonMoveReport 20260818.xlsx`, `NonMoveReport 20260814.xlsx`).
   - Parses the `YYYYMMDD` from the filename into a standard `DateTime` (e.g. `20260818` -> `2026-08-18T00:00:00.000Z`).
   - CLI arguments support:
     - `npm run etl` (scans `/data/seed/` or target directory, processes all files or the latest).
     - `npm run etl -- --file=/path/to/NonMoveReport_20260818.xlsx`
     - `npm run etl -- --date=2026-08-18`
3. **Row Processing & Tolerant Foreign Keys**:
   - Convert Thai-labeled numeric columns to numbers / floats (`มูลค่าสต๊อก`, `Stock Qty รวม`, `มูลค่าสต๊อกรวม`, etc.).
   - If a `branchCode` or `productCode` in the report is missing from dimension masters, auto-create a fallback placeholder store/product record so no fact rows are dropped.
   - Insert rows into `nonmove_rows` with `reportDate` = extracted file date.
4. **Idempotent Upsert**:
   - Uses Prisma transaction to delete and reload rows for that specific `reportDate` if re-run.
   - Batch insert using `createMany` in chunks of 1,000 rows.
5. **Admin Web Upload Endpoint (`/api/admin/etl`)**:
   - Allows uploading daily `NonMoveReport YYYYMMDD.xlsx` directly from the web interface at `/admin/upload` without needing terminal access or redeployment.

---

## 6. Pages / Routes

### `/` — Identify screen
- Region `<select>` populated from `GET /api/regions` (distinct `region` from `stores`, `STORE_TYPE = 'STORE'` only).
- Store `<select>` populated from `GET /api/stores?region=...`, disabled until a region is chosen.
- Name (text, required, min 2 chars).
- Phone (text, required, validate Thai mobile pattern `0[0-9]{9}`).
- On submit → `POST /api/sessions` → on success, store `{branchCode, name, phone, sessionId}` in cookie/localStorage and redirect to `/dashboard/[branchCode]`.

### `/dashboard/[branchCode]` — Non-move analysis
Scoped to the one store.
1. **Header**: Store name, province, region, staff `{name}`, date picker/badge (showing `Report Date: YYYY-MM-DD`, defaulting to latest date), "Switch Store" link back to `/`.
2. **KPI cards**: Total non-move SKU count, Total non-move units, Total non-move stock value (THB), % of SKUs in High non-move bucket (`>= 121-180`).
3. **Filters bar**: Category, Sub-category, Nonmove Days bucket, Aging Days bucket, SKU Type toggle (exclude/include `MOCK_UP`), free-text search (product name / model / barcode).
4. **Nonmove Days distribution chart** (bar chart, count of SKUs per bucket, ordered chronologically `30-60` to `365+`).
5. **Model explorer table** (sortable, paginated):
   - Row: ProductName, MODEL, CategoryName, worst Nonmove Days bucket, Status badge (**High Non-move** / **OK**), Stock Qty, Stock Value, and **Request Status** (`No request` / `Pending ⏳` / `Approved ✅` / `Rejected ❌` with tooltip comment).
   - **Status filter chips**: `All | High Non-move | OK | Excluded`, plus live "**X% High · Y% OK**" metric pill reflecting current filtered subset.
   - Row click opens **Action Panel**.
6. **Action Panel** (drawer/modal per model):
   - Displays model details, MOS, branch stock qty/value.
   - If previous request exists: shows full history & reviewer comment.
   - Two action workflows: **Explain** (reason + optional photos) and **Request Exclusion** (reason + photos for proof).
   - Uploads photos via `POST /api/uploads` and submits request via `POST /api/requests` with status `PENDING`.
7. **My Requests** view (`/dashboard/[branchCode]/requests`): List of requests submitted from this store/session, filterable by status.
8. **Export**: CSV/XLSX download of filtered rows with request status.

### `/approvals` — Approver queue (Passcode-Gated)
- Gated by `APPROVER_PASSCODE`.
- Table/cards of `PENDING` `SkuRequest`s across all stores (filterable by region, store, request type).
- Displays requester info, product, explanation/exclusion reason, photo gallery with lightbox preview.
- **Approve** and **Reject** action buttons with review comment modal. On decision, updates request via `PATCH /api/requests/[id]`.

### `/admin/upload` — Daily File Upload UI (Passcode-Gated)
- Simple drag-and-drop interface for uploading `NonMoveReport YYYYMMDD.xlsx`.
- Automatically extracts date `YYYYMMDD`, parses the spreadsheet, runs ETL, and displays row count summary.

### API routes
- `GET /api/regions`
- `GET /api/stores?region=`
- `POST /api/sessions` — body `{name, phone, branchCode, region}`
- `GET /api/nonmove?branchCode=&reportDate=&category=&nonmoveDays=&agingDays=&skuType=&search=&sort=&page=`
- `GET /api/nonmove/export?...` — streams CSV/XLSX of filtered rows
- `GET /api/nonmove/summary?branchCode=&reportDate=&category=` — returns `{ highCount, okCount, highPct, okPct, totalValue, totalUnits }`
- `POST /api/uploads` — multipart image upload, returns public URL(s)
- `POST /api/requests` — body `{branchCode, productCode, requestType, reason, photoUrls[], requestedById}`
- `GET /api/requests?branchCode=&status=&sessionId=` — list requests
- `GET /api/requests/[id]`
- `PATCH /api/requests/[id]` — approver only, body `{status, reviewComment, reviewedByName}`
- `POST /api/admin/etl` — multipart upload of daily Excel file, triggers ingestion for extracted date

### 6.4 Approver & Admin Security
- Passcode gate via `APPROVER_PASSCODE` stored in an httpOnly cookie or verified on action.

### 6.5 Photo storage
- External S3-compatible bucket (Cloudflare R2 or AWS S3). Store public URL in `RequestPhoto.url`.

---

## 7. Repo Structure

```
nonmove-app/
├─ app/
│  ├─ page.tsx                          # identify screen
│  ├─ dashboard/[branchCode]/
│  │  ├─ page.tsx                       # KPIs + model explorer + charts
│  │  └─ requests/page.tsx              # "My Requests" view
│  ├─ approvals/page.tsx                # approver queue (passcode-gated)
│  ├─ admin/upload/page.tsx             # daily Excel upload page
│  └─ api/
│     ├─ regions/route.ts
│     ├─ stores/route.ts
│     ├─ sessions/route.ts
│     ├─ nonmove/route.ts
│     ├─ nonmove/summary/route.ts
│     ├─ nonmove/export/route.ts
│     ├─ uploads/route.ts
│     ├─ requests/route.ts              # + requests/[id]/route.ts
│     └─ admin/etl/route.ts             # daily xlsx upload & ETL handler
├─ components/
│  ├─ RegionStoreSelect.tsx
│  ├─ KpiCards.tsx
│  ├─ NonmoveChart.tsx
│  ├─ ModelExplorerTable.tsx            # status chips + High/OK % summary
│  ├─ ActionPanel.tsx                   # explain / request-exclusion drawer
│  ├─ RequestStatusBadge.tsx
│  └─ ApprovalQueueTable.tsx
├─ lib/
│  ├─ prisma.ts
│  ├─ validators.ts
│  ├─ nonmoveConfig.ts                  # bucket orders + classifyNonmove()
│  └─ storage.ts                        # S3/R2 client for photo uploads
├─ prisma/
│  └─ schema.prisma
├─ scripts/etl/loadData.ts              # CLI ETL script supporting YYYYMMDD filename parsing
├─ data/seed/
│  ├─ Dimension Store GH.csv
│  ├─ Dimension Model GH.csv
│  └─ NonMoveReport 20260818.xlsx       # Daily feed files with YYYYMMDD in name
├─ .env.example
├─ package.json
├─ railway.json
└─ README.md
```

---

## 8. Railway Deployment Instructions

1. `git init`, commit the scaffold, push to a new GitHub repo.
2. In Railway: **New Project → Deploy from GitHub repo**, select the repo.
3. **Add a plugin**: PostgreSQL. Railway injects `DATABASE_URL` automatically —
   reference it in `.env` / Prisma as `env("DATABASE_URL")`.
4. **Set up photo storage**: create a Cloudflare R2 bucket (or S3 bucket),
   generate an access key, and add `STORAGE_ENDPOINT`, `STORAGE_BUCKET`,
   `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`,
   `STORAGE_PUBLIC_BASE_URL` as Railway environment variables (§6.5). This is a
   one-time manual setup outside Railway itself.
5. Set `APPROVER_PASSCODE` as a Railway environment variable (§6.4).
6. Set the **Build Command**: `npm run build` (which should run
   `prisma generate && next build`).
7. Set the **Start Command**: `npm run start`.
8. Add a **one-off/cron job or manual trigger** for `npm run etl -- --date=$(date +%F)`
   to load a new daily file (or expose a protected `/api/admin/etl` upload
   endpoint if the daily xlsx should be uploaded through the UI instead of
   committed to the repo — recommended for a real daily workflow instead of
   re-deploying).
9. Push to `main` → Railway auto-builds and deploys on every push (GitHub
   integration is on by default once linked).

`.env.example`:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
APPROVER_PASSCODE=change-me
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_BASE_URL=
```

---

## 9. Build Order (do these steps in order)

1. Scaffold Next.js + TypeScript + Tailwind app, init git.
2. Add Prisma, paste schema above (§4), `prisma migrate dev`.
3. Write the ETL script and run it locally against the 3 provided files to
   validate the schema (fix column-mapping bugs here first).
4. Build `/api/regions`, `/api/stores`, `/api/sessions`.
5. Build the identify screen (`/`) with cascading dropdowns + form validation.
6. Build `/api/nonmove` and `/api/nonmove/summary` with filtering/sorting/pagination.
7. Build the dashboard page: KPI cards → chart → **model explorer table with
   High/OK status chips and live % summary** → top-value table.
8. Wire up object storage (`lib/storage.ts`) against a real R2/S3 bucket; build
   `POST /api/uploads`.
9. Build `SkuRequest`/`RequestPhoto` API routes (`/api/requests*`) and the
   **Action Panel** (Explain / Request Exclusion form with photo upload).
10. Build the **"My Requests"** view for store users.
11. Build the passcode-gated **`/approvals`** queue with Approve/Reject +
    review comment.
12. Add basic empty/error/loading states everywhere data is fetched.
13. Write `README.md` documenting local setup, ETL usage, storage setup, and
    Railway deploy steps.
14. Push to GitHub, connect Railway, add Postgres plugin + storage env vars,
    deploy, run ETL against production DB, smoke-test the live URL end to end:
    pick a region → store → submit → see real data → submit a request with a
    photo → approve it as the approver → confirm the store user sees the
    approved status.

---

## 10. Notes / Open Decisions for the Builder to Flag Back to the User

- Should `MOCK_UP` (`SKU_TYPE`) items be excluded from KPIs by default, or just
  visually flagged? (Recommend: excluded by default, toggle to include.)
- Should `DC` (`STORE_TYPE`) locations appear in the Store dropdown at all, or
  only real `STORE` branches? (Recommend: exclude DC from the login dropdown.)
- Is `name`/`phone` capture just a log, or does the user want a report emailed to
  that phone/name later? (Affects whether `UserSession` needs a notification
  integration.)
- Confirm whether "Nonmove Days" bucket order needs a fixed sort order (buckets
  are strings like "30-60", not numbers — the builder must hardcode a bucket
  order list since the app can't sort them alphabetically).
- Confirm the exact **High vs OK cutoff bucket** (§2.4) — this is a business
  call, not a technical one, and should be confirmed with whoever owns the
  non-move policy before hardcoding `HIGH_NONMOVE_CUTOFF`.
- **Are photos required or optional** for an exclusion request? The spec
  defaults to optional-but-recommended; make required if the approver needs
  visual proof (e.g. "shelf is empty, system is wrong") before approving.
- **Who are the approvers**, and do they need to see requests from their whole
  region or literally every store? (Recommend: filterable by region in
  `/approvals`, defaulting to the approver's own region if that mapping
  exists.)
- Should an **approved exclusion** actually remove the SKU from future
  non-move KPIs/reports (a real business-rule exception), or is it purely a
  documented decision that still shows in the report? This determines whether
  `/api/nonmove` and `/api/nonmove/summary` need to filter out
  `APPROVED`+`EXCLUDE` rows or just display their status. (Recommend:
  filter them out of the "High Non-move" bucket and KPIs once approved, but
  keep them visible in the model explorer with an "Excluded" badge — nothing
  should silently disappear.)
- What happens on **re-run of the daily ETL** — should existing `SkuRequest`s
  (tied to `branchCode` + `productCode`) persist across days automatically?
  (Recommend: yes, requests are keyed on the SKU/store pair, not on a specific
  day's report row, so they survive the daily reload as-is.)
