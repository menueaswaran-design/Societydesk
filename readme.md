 SocietyDesk MVP — Full Product & Technical Requirements

1. PRODUCT OVERVIEW

Product Name: SocietyDesk

Product Type: Multi-tenant SaaS for apartment/society management

Primary Goal:
Replace Excel sheets, WhatsApp groups, and paper records for small and mid-size apartment societies with one simple web application.

MVP Core Features

1. Maintenance billing and payment records
2. Complaint management
3. Notices and announcements
4. Society, flat, and resident directory

MVP Target

- 30–300 flats per society
- Small and mid-size apartment communities
- Society Secretary
- Treasurer
- Chairman / Committee Members
- Flat Owners
- Tenants

Explicit MVP Exclusions

The following features should NOT be built in the MVP:

- Visitor management
- Security / gate management
- Vendor management
- Domestic staff management
- Amenity booking
- WhatsApp Business API
- SMS gateway
- AI chatbot
- Native Android/iOS application
- Advanced accounting/GST
- Complex recurring payment subscriptions
- Multi-language support
- Advanced accounting automation

2. PRODUCT ARCHITECTURE

SOCIETYDESK
     |
     +-----------------------------+
     |                             |
 Admin Portal                Resident Portal
     |                             |
 +---+---+---+---+             +---+---+---+
 |   |   |   |   |             |   |   |   |
Flats Billing Complaints    Billing Complaints Notices
     |   |      |                |
     +---+------+----------------+
             |
          Notices
             |
          Dashboard
             |
             v
       Next.js Frontend
             |
       Firebase Auth
             |
       Next.js API / Backend
             |
       PostgreSQL Database
             |
       +-----+------+
       |            |
   Cloudinary   Email Provider
   Files/Images   Optional MVP

3. RECOMMENDED TECHNOLOGY STACK

3.1 Frontend

Next.js 16+

Use:

- App Router
- JavaScript or TypeScript
- Server Components where useful
- Client Components only where interaction/state is required

3.2 UI

- Tailwind CSS
- shadcn/ui or lightweight component system
- Lucide React Icons
- React Hook Form
- Zod

3.3 Data Fetching

Recommended:

- TanStack Query for REST/API data fetching

Alternative:

- Apollo Client + GraphQL if GraphQL is preferred

For a new MVP, REST + TanStack Query is recommended because it is simpler.

4. BACKEND STACK

Use Next.js as the main application/backend initially.

Next.js
 ├── App Router
 ├── Server Components
 ├── Route Handlers
 ├── Server Actions where appropriate
 └── API Layer

For larger scale later:

Next.js Frontend
       |
    NestJS
       |
  PostgreSQL

Do not introduce NestJS on day one unless the product requires a separate backend.

5. AUTHENTICATION

Use Firebase Authentication.

Supported MVP authentication:

- Email/password login
- Password reset
- Email verification

Future:

- Phone OTP

Authentication Flow

User
 |
 v
Login Page
 |
 v
Firebase Authentication
 |
 v
Firebase UID
 |
 v
Next.js Backend
 |
 v
Find User by auth_uid
 |
 +---- Role = SUPER_ADMIN ----> Super Admin
 |
 +---- Role = SOCIETY_ADMIN --> Admin Portal
 |
 +---- Role = RESIDENT --------> Resident Portal

6. AUTHORIZATION

Authentication answers:

Who is this user?

Authorization answers:

What is this user allowed to access?

Every authenticated user must have:

user.id
user.auth_uid
user.society_id
user.role

Roles

SUPER_ADMIN
SOCIETY_ADMIN
RESIDENT

7. MULTI-TENANT ARCHITECTURE

Every society is a tenant.

Platform
 |
 +--- Society A
 |      |
 |      +--- Flats
 |      +--- Residents
 |      +--- Invoices
 |      +--- Payments
 |      +--- Complaints
 |      +--- Notices
 |
 +--- Society B
        |
        +--- Flats
        +--- Residents
        +--- Invoices
        +--- Payments
        +--- Complaints
        +--- Notices

Critical Multi-Tenant Rule

Every society-owned table must contain:

society_id

Example:

SELECT *
FROM invoices
WHERE society_id = authenticated_user_society_id;

Never trust society_id supplied directly by the frontend.

The backend must derive the allowed society from the authenticated user.

8. USER ROLES

8.1 SUPER_ADMIN

Platform owner.

Permissions

- Create societies
- Edit society details
- Activate/deactivate societies
- Create/invite society admins
- View platform-level statistics
- Manage subscription status
- Handle support

Security Restriction

Super Admin should not automatically have unrestricted access to resident financial information.

8.2 SOCIETY_ADMIN

Permissions

- Manage flats
- Manage residents
- Configure maintenance
- Generate invoices
- Record payments
- View payment records
- Generate/download receipts
- View defaulters
- Manage complaints
- Assign complaints
- Post notices
- View society dashboard

8.3 RESIDENT

Permissions

- View own flat information
- View own invoices
- View own dues
- View own payment history
- Download own receipts
- Raise complaints
- Comment on own complaints
- View complaint status
- View society notices
- Update permitted profile information

Resident Restrictions

Resident must never access:

- Another flat's invoices
- Another resident's payments
- Another resident's complaints
- Admin-only information

9. CORE DATA HIERARCHY

Society
 |
 +--- Blocks
 |      |
 |      +--- Flats
 |             |
 |             +--- Residents
 |
 +--- Fee Configuration
 |
 +--- Invoices
 |
 +--- Payments
 |
 +--- Complaints
 |
 +--- Notices
 |
 +--- Audit Logs

10. DATABASE

Recommended Database

PostgreSQL

Reasons

Society management contains highly relational data:

Society
  -> Flat
      -> Resident
      -> Invoice
          -> Invoice Items
          -> Payments
              -> Receipt

Flat
  -> Complaints
      -> Comments

PostgreSQL is preferred for:

- Relationships
- Financial records
- Aggregations
- Reports
- Transactions
- Data integrity
- Audit history
- Future accounting features

11. ORM

Recommended:

Prisma ORM

Architecture:

Next.js
   |
 Prisma
   |
PostgreSQL

Prisma provides:

- Type-safe queries
- Relations
- Migrations
- Schema management
- Transactions

12. DATABASE SCHEMA

12.1 Society

Table: "societies"

id
name
code
address
city
state
pincode
phone
email
logo_url
status
created_at
updated_at

Status:

ACTIVE
INACTIVE

12.2 User

Table: "users"

id
society_id
auth_uid
name
email
phone
role
status
created_at
updated_at

Role:

SUPER_ADMIN
SOCIETY_ADMIN
RESIDENT

12.3 Flat

Table: "flats"

id
society_id
flat_number
block
floor
flat_type
sq_ft
parking_slot
status
created_at
updated_at

Status:

OCCUPIED
VACANT

12.4 Flat Resident

Do not store only "owner_id" and "tenant_id" directly on the flat.

Use a relationship table.

Table: "flat_residents"

id
flat_id
user_id
resident_type
is_primary
created_at

Resident type:

OWNER
TENANT

This provides flexibility for future ownership and tenant history.

13. BILLING DATABASE

13.1 Fee Configuration

Table: "fee_configurations"

id
society_id
name
calculation_type
amount
rate
frequency
active
created_at
updated_at

Calculation type:

FIXED
PER_SQFT
FLAT_TYPE

13.2 Invoice

Table: "invoices"

id
society_id
flat_id
invoice_number
billing_period
invoice_date
due_date
subtotal
previous_due
penalty
discount
total_amount
paid_amount
status
created_at
updated_at

Status:

PENDING
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED

13.3 Invoice Items

Table: "invoice_items"

id
invoice_id
name
type
amount

Examples:

MAINTENANCE
PARKING
WATER
SINKING_FUND
SPECIAL_FUND
OTHER

13.4 Payment

Table: "payments"

id
society_id
invoice_id
flat_id
amount
payment_method
transaction_reference
payment_date
proof_url
recorded_by
created_at

Payment methods:

CASH
CHEQUE
BANK_TRANSFER
UPI
OTHER

13.5 Receipt

Table: "receipts"

id
society_id
payment_id
receipt_number
pdf_url
created_at

14. COMPLAINT DATABASE

14.1 Complaint

Table: "complaints"

id
society_id
flat_id
created_by
category
title
description
priority
status
assigned_to
resolved_at
closed_at
created_at
updated_at

Categories:

PLUMBING
ELECTRICAL
CLEANLINESS
PARKING
SECURITY
NOISE
WATER
OTHER

Priority:

LOW
MEDIUM
HIGH
URGENT

Status:

OPEN
ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED
REOPENED

14.2 Complaint Attachment

Table: "complaint_attachments"

id
complaint_id
file_url
file_name
created_at

Recommended additional fields:

cloudinary_public_id
resource_type

14.3 Complaint Comment

Table: "complaint_comments"

id
complaint_id
user_id
comment
created_at

15. NOTICE DATABASE

15.1 Notice

Table: "notices"

id
society_id
title
body
category
attachment_url
posted_by
status
published_at
created_at
updated_at

Categories:

GENERAL
URGENT
MAINTENANCE
EVENT
MEETING

Status:

DRAFT
PUBLISHED
ARCHIVED

15.2 Notice Read

Table: "notice_reads"

id
notice_id
user_id
read_at

16. AUDIT LOG

Every important administrative action should be recorded.

Table: "audit_logs"

id
society_id
user_id
action
entity_type
entity_id
old_value
new_value
created_at

Examples:

INVOICE_CREATED
INVOICE_UPDATED
PAYMENT_RECORDED
PAYMENT_UPDATED
PAYMENT_DELETED
COMPLAINT_CREATED
COMPLAINT_STATUS_CHANGED
NOTICE_CREATED
NOTICE_UPDATED
RESIDENT_CREATED
RESIDENT_UPDATED
FLAT_UPDATED

For sensitive financial changes, store the reason where applicable.

17. CORE FEATURE 1 — MAINTENANCE BILLING

17.1 Billing Configuration

Admin navigates:

Admin
  |
  v
Billing
  |
  v
Fee Configuration

Admin selects calculation type.

Fixed

Example:

Every flat = ₹2,500

Per Square Foot

Example:

Rate = ₹3 / sq.ft

Flat = 1,000 sq.ft

Maintenance = ₹3,000

Flat Type

Example:

1 BHK = ₹1,500
2 BHK = ₹2,500
3 BHK = ₹3,500

18. ADDITIONAL CHARGES

Admin can create:

- Maintenance
- Parking
- Water
- Sinking Fund
- Special Fund
- Other

Example:

Maintenance       ₹2,500
Parking              ₹500
Water                ₹200
Sinking Fund         ₹300
--------------------------
Subtotal            ₹3,500

19. INVOICE GENERATION FLOW

Admin
 |
 v
Billing Configuration
 |
 v
Select Billing Period
 |
 v
System fetches active flats
 |
 v
Calculate amount for each flat
 |
 v
Apply additional charges
 |
 v
Apply previous outstanding amount
 |
 v
Apply applicable penalty
 |
 v
Create Invoice
 |
 v
Create Invoice Items
 |
 v
Set Invoice Status = PENDING
 |
 v
Dashboard Updated

20. INVOICE EXAMPLE

GREEN VALLEY APARTMENTS

Invoice:
INV-GVA-2026-10-0001

Flat:
A101

Resident:
Ravi Kumar

Billing Period:
October 2026

Due Date:
10 October 2026

Maintenance:
₹2,500

Parking:
₹500

Water:
₹200

Previous Due:
₹500

Penalty:
₹50

------------------------
Total:
₹3,750

Status:
PENDING

21. PAYMENT FLOW

MVP uses manual payment recording.

Admin
 |
 v
Open Invoice
 |
 v
Record Payment
 |
 +--- Amount
 +--- Method
 +--- Transaction Reference
 +--- Payment Date
 +--- Proof
 |
 v
Validate Amount
 |
 v
Create Payment
 |
 v
Update Invoice Paid Amount
 |
 v
Calculate Remaining Balance
 |
 v
Update Invoice Status
 |
 v
Generate Receipt
 |
 v
Resident Sees Payment

22. INVOICE STATUS LOGIC

paid_amount = 0
        |
        v
     PENDING

0 < paid_amount < total_amount
        |
        v
 PARTIALLY_PAID

paid_amount >= total_amount
        |
        v
      PAID

If:

current_date > due_date
AND
paid_amount < total_amount

Then:

OVERDUE

23. RECEIPT FLOW

Payment Recorded
 |
 v
Generate Receipt Number
 |
 v
Generate PDF
 |
 v
Upload PDF
 |
 v
Save pdf_url
 |
 v
Resident Can Download

Receipt should contain:

- Society name/logo
- Receipt number
- Resident name
- Flat
- Invoice number
- Amount
- Payment method
- Transaction reference
- Payment date
- Billing period

24. DEFAULTER FLOW

Admin Dashboard
 |
 v
Defaulters
 |
 v
Fetch invoices where:

paid_amount < total_amount
AND
due_date < today
 |
 v
Display:

Flat
Resident
Outstanding
Days overdue

25. CORE FEATURE 2 — COMPLAINT MANAGEMENT

25.1 Resident Flow

Resident Dashboard
 |
 v
My Complaints
 |
 v
Raise Complaint
 |
 v
Select Category
 |
 v
Select Priority
 |
 v
Enter Title
 |
 v
Enter Description
 |
 v
Upload Image
 |
 v
Submit
 |
 v
Complaint Created
 |
 v
Status = OPEN

26. ADMIN COMPLAINT FLOW

New Complaint
 |
 v
Admin Opens Complaint
 |
 v
Assign Committee Member
 |
 v
ASSIGNED
 |
 v
IN_PROGRESS
 |
 v
Admin Adds Updates/Comments
 |
 v
RESOLVED
 |
 v
Resident Reviews
 |
 +---- Issue Fixed ---> CLOSED
 |
 +---- Issue Remains -> REOPENED

27. COMPLAINT TIMELINE

Example:

29 Sep 10:00
Complaint created by Ravi

29 Sep 10:15
Assigned to Kumar

29 Sep 11:30
Status changed to In Progress

30 Sep 15:00
Admin:
Plumber visited the flat.

30 Sep 17:00
Status changed to Resolved

01 Oct 09:00
Resident:
Issue fixed.

01 Oct 09:01
Status changed to Closed

28. COMPLAINT ATTACHMENTS

Use Cloudinary for:

- Complaint photos
- Notice attachments
- Payment proof images
- Receipt PDFs

Do not store large binary files directly in PostgreSQL.

Database should store:

cloudinary_public_id
secure_url
file_name
resource_type

29. CLOUDINARY UPLOAD FLOW

Browser
 |
 v
Next.js API
 |
 v
Validate Authenticated User
 |
 v
Validate Society Access
 |
 v
Upload to Cloudinary
 |
 v
Receive secure_url
 |
 v
Save URL + public_id in PostgreSQL

Never expose Cloudinary secret credentials to the browser.

30. CORE FEATURE 3 — NOTICES

Admin Flow

Admin
 |
 v
Notices
 |
 v
Create Notice
 |
 +--- Title
 +--- Body
 +--- Category
 +--- Attachment
 |
 v
Save as Draft
       OR
Publish
 |
 v
Residents Can View

31. NOTICE READ FLOW

Resident Opens Notice
 |
 v
Check notice_reads
 |
 v
If record does not exist
 |
 v
Create notice_reads record
 |
 v
Update Read Count

Example:

Read: 87 / 120
Unread: 33

32. CORE FEATURE 4 — FLAT & RESIDENT DIRECTORY

32.1 Add Flat

Admin enters:

- Flat Number
- Block
- Floor
- Flat Type
- Area
- Parking Slot
- Status

Example:

A101
Block A
1st Floor
2 BHK
1050 sq.ft
P-101
OCCUPIED

33. ADD RESIDENT

Admin enters:

- Name
- Email
- Phone
- Flat
- Resident Type

Resident type:

OWNER
TENANT

34. RESIDENT INVITATION FLOW

Admin
 |
 v
Add Resident
 |
 v
Enter Email/Phone
 |
 v
System Creates Invitation
 |
 v
Resident Receives Invite
 |
 v
Resident Authenticates with Firebase
 |
 v
Firebase UID Linked to User
 |
 v
Resident Accesses Assigned Flat

35. BULK IMPORT

Admin uploads:

- CSV
- XLSX

Example:

Flat,Block,Name,Phone,Email,Type

A101,A,Ravi,9876543210,ravi@email.com,OWNER
A102,A,Kumar,9876543211,kumar@email.com,OWNER
A103,A,Arun,9876543212,arun@email.com,TENANT

Import Flow

Upload
 |
 v
Parse
 |
 v
Validate
 |
 v
Preview
 |
 v
Admin Confirms
 |
 v
Transaction
 |
 v
Create Flats
 |
 v
Create Residents
 |
 v
Create Relationships

Important Rule

If validation fails, do not partially import the file.

The entire import must either succeed or fail.

36. ADMIN DASHBOARD

Dashboard Cards

Total Flats

120

Collected This Month

₹2,45,000

Pending

₹45,000

Overdue

₹18,000

Open Complaints

12

Additional Sections

- Collection Summary
- Complaint Summary
- Recent Payments
- Recent Complaints
- Recent Notices
- Recent Activity

37. RESIDENT DASHBOARD

Example:

Hello Ravi

Current Due
₹3,750

Due Date
10 October

Status
Pending

[View Invoice]

Then:

Active Complaint

Water leakage
IN_PROGRESS

Then:

Latest Notices

Water Supply Maintenance

Then:

Recent Payments

October - ₹3,750
September - ₹3,200

38. NEXT.JS PROJECT STRUCTURE

Recommended App Router structure:

societydesk/
│
├── app/
│   │
│   ├── (public)/
│   │   ├── login/
│   │   │   └── page.jsx
│   │   ├── forgot-password/
│   │   │   └── page.jsx
│   │   └── invite/
│   │       └── page.jsx
│   │
│   ├── (super-admin)/
│   │   └── super-admin/
│   │       ├── dashboard/
│   │       ├── societies/
│   │       └── settings/
│   │
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── flats/
│   │       ├── residents/
│   │       ├── billing/
│   │       │   ├── configuration/
│   │       │   ├── invoices/
│   │       │   ├── payments/
│   │       │   └── defaulters/
│   │       ├── complaints/
│   │       ├── notices/
│   │       └── settings/
│   │
│   ├── (resident)/
│   │   └── resident/
│   │       ├── dashboard/
│   │       ├── billing/
│   │       ├── invoices/
│   │       ├── payments/
│   │       ├── complaints/
│   │       ├── notices/
│   │       └── profile/
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── societies/
│   │   ├── flats/
│   │   ├── residents/
│   │   ├── billing/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── complaints/
│   │   ├── notices/
│   │   └── uploads/
│   │
│   ├── layout.jsx
│   └── page.jsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── billing/
│   ├── complaints/
│   ├── notices/
│   └── residents/
│
├── lib/
│   ├── firebase/
│   │   ├── client.js
│   │   └── admin.js
│   ├── db/
│   │   └── prisma.js
│   ├── cloudinary/
│   │   └── server.js
│   ├── auth/
│   │   ├── session.js
│   │   └── permissions.js
│   ├── billing/
│   │   ├── calculator.js
│   │   ├── invoice.js
│   │   └── penalty.js
│   └── validation/
│       └── schemas.js
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── hooks/
├── utils/
├── types/
├── public/
│
├── middleware.js
├── package.json
└── .env.local

39. FRONTEND ARCHITECTURE

Use Server Components for:

- Initial page data
- Public pages
- SEO/public content
- Secure server-side data where appropriate

Use Client Components for:

- Forms
- Modals
- Filters
- Tables
- Interactive dashboards
- Client-side state
- User interactions

Important Rule

Do not make the entire application ""use client"".

40. UI COMPONENT STRUCTURE

Reusable components:

components/
 |
 +--- ui/
 |     Button
 |     Input
 |     Modal
 |     Select
 |     Table
 |     Badge
 |     Card
 |     Dropdown
 |
 +--- billing/
 |     InvoiceTable
 |     InvoiceStatusBadge
 |     PaymentForm
 |     ReceiptButton
 |     BillingSummary
 |
 +--- complaints/
 |     ComplaintCard
 |     ComplaintStatus
 |     ComplaintTimeline
 |     ComplaintForm
 |
 +--- notices/
 |     NoticeCard
 |     NoticeForm
 |
 +--- residents/
       ResidentTable
       ResidentForm
       FlatCard

41. API STRUCTURE

Use REST initially.

Society APIs

GET    /api/societies
POST   /api/societies
GET    /api/societies/:id
PATCH  /api/societies/:id

Flat APIs

GET    /api/flats
POST   /api/flats
GET    /api/flats/:id
PATCH  /api/flats/:id
DELETE /api/flats/:id

Every request must automatically be scoped to the authenticated user's society.

Resident APIs

GET    /api/residents
POST   /api/residents
GET    /api/residents/:id
PATCH  /api/residents/:id
POST   /api/residents/import

Billing APIs

GET    /api/billing/configuration
POST   /api/billing/configuration
PATCH  /api/billing/configuration

POST   /api/billing/invoices/generate
GET    /api/billing/invoices
GET    /api/billing/invoices/:id

Payment APIs

GET    /api/payments
POST   /api/payments
GET    /api/payments/:id

Complaint APIs

GET    /api/complaints
POST   /api/complaints
GET    /api/complaints/:id
PATCH  /api/complaints/:id

POST   /api/complaints/:id/comments
POST   /api/complaints/:id/assign
POST   /api/complaints/:id/status
POST   /api/complaints/:id/reopen

Notice APIs

GET    /api/notices
POST   /api/notices
GET    /api/notices/:id
PATCH  /api/notices/:id
DELETE /api/notices/:id
POST   /api/notices/:id/read

42. AUTHENTICATION MIDDLEWARE FLOW

Request
 |
 v
Read Firebase ID Token
 |
 v
Verify Firebase Token using Firebase Admin SDK
 |
 v
Get auth_uid
 |
 v
Find User
 |
 v
Get role + society_id
 |
 v
Attach Authenticated User to Request
 |
 v
Authorization Check
 |
 v
Database Query Scoped to society_id

43. ROLE PROTECTION

Example:

/admin/billing

Allowed:

SOCIETY_ADMIN

Not allowed:

RESIDENT

Example:

/resident/invoices

Resident can access only invoices connected to their own flat.

44. FIREBASE SETUP

Use:

Firebase Authentication

Client Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

Server Environment Variables

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_
