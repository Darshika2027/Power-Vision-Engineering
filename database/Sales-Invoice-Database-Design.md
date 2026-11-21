# POWER VISION ENGINEERING
# SALES AND INVOICE DATABASE DESIGN

## 1. Project Details
Project: PVE-BMS
Database: PostgreSQL 18
Database Name: pve_bms_db
Scope: Sales and Invoice Database Structure Design

## 2. Existing Database Tables
1. categories
2. products
3. goods_receivings
4. goods_receiving_items
5. rack_inventory

## 3. New Database Tables
1. customers
2. sales
3. sale_items
4. payments
5. credit_transactions
6. inventory_movements

## 4. Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMERS ||--o{ SALES : makes
    CUSTOMERS ||--o{ PAYMENTS : makes
    CUSTOMERS ||--o{ CREDIT_TRANSACTIONS : has
    SALES ||--o{ SALE_ITEMS : contains
    SALES ||--o{ PAYMENTS : receives
    SALES ||--o{ CREDIT_TRANSACTIONS : generates
    PAYMENTS ||--o{ CREDIT_TRANSACTIONS : records
    PRODUCTS ||--o{ SALE_ITEMS : sold_as
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : tracks
    SALES ||--o{ INVENTORY_MOVEMENTS : tracks
    RACK_INVENTORY ||--o{ INVENTORY_MOVEMENTS : records
    SALE_ITEMS ||--o{ INVENTORY_MOVEMENTS : generates## 5. Data Dictionary

### 5.1 Customers
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Customer ID |
| name | VARCHAR(150) | NOT NULL | Customer name |
| phone | VARCHAR(20) | NOT NULL | Phone number |
| address | VARCHAR(255) | NULL | Address |
| credit_enabled | BOOLEAN | NOT NULL | Credit approval |
| credit_approved_at | TIMESTAMP | NULL | Approval date |
| created_at | TIMESTAMP | NOT NULL | Created date |

### 5.2 Sales
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Sale ID |
| invoice_no | VARCHAR(50) | UNIQUE | Invoice number |
| customer_id | BIGINT | Foreign Key | Customer reference |
| customer_name_snapshot | VARCHAR(150) | NULL | Customer name snapshot |
| customer_phone_snapshot | VARCHAR(20) | NULL | Customer phone snapshot |
| sold_at | TIMESTAMP | NOT NULL | Sale date |
| status | VARCHAR(20) | NOT NULL | Invoice status |
| subtotal | NUMERIC(14,2) | NOT NULL | Subtotal |
| discount_total | NUMERIC(14,2) | NOT NULL | Total discount |
| grand_total | NUMERIC(14,2) | NOT NULL | Final total |
| credit_due_date | DATE | NULL | Credit due date |
| created_at | TIMESTAMP | NOT NULL | Created date |

### 5.3 Sale Items
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Sale item ID |
| sale_id | BIGINT | Foreign Key | Sale reference |
| product_id | BIGINT | Foreign Key | Product reference |
| quantity | INTEGER | NOT NULL | Quantity sold |
| unit_price | NUMERIC(12,2) | NOT NULL | Selling price snapshot |
| cost_price | NUMERIC(12,2) | NOT NULL | Cost price snapshot |
| discount_amount | NUMERIC(12,2) | NOT NULL | Item discount |
| line_total | NUMERIC(14,2) | Generated | Calculated total |

### 5.4 Payments
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Payment ID |
| sale_id | BIGINT | Foreign Key | Sale reference |
| customer_id | BIGINT | Foreign Key | Customer reference |
| amount | NUMERIC(14,2) | NOT NULL | Payment amount |
| payment_method | VARCHAR(30) | NOT NULL | Payment method |
| reference_no | VARCHAR(100) | NULL | Reference number |
| paid_at | TIMESTAMP | NOT NULL | Payment date |

### 5.5 Credit Transactions
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Transaction ID |
| customer_id | BIGINT | Foreign Key | Customer reference |
| sale_id | BIGINT | Foreign Key | Sale reference |
| payment_id | BIGINT | Foreign Key | Payment reference |
| transaction_type | VARCHAR(20) | NOT NULL | DEBIT, CREDIT or ADJUSTMENT |
| amount | NUMERIC(14,2) | NOT NULL | Transaction amount |
| description | VARCHAR(255) | NULL | Description |
| created_at | TIMESTAMP | NOT NULL | Transaction date |

### 5.6 Inventory Movements
| Column | Type | Constraint | Description |
|---|---|---|---|
| id | BIGINT | Primary Key | Movement ID |
| product_id | BIGINT | Foreign Key | Product reference |
| rack_inventory_id | BIGINT | Foreign Key | Rack reference |
| sale_id | BIGINT | Foreign Key | Sale reference |
| sale_item_id | BIGINT | Foreign Key | Sale item reference |
| quantity_change | INTEGER | NOT NULL | Stock change |
| movement_type | VARCHAR(30) | NOT NULL | Movement type |
| created_at | TIMESTAMP | NOT NULL | Movement date |

## 6. Relationships
1. One customer can have multiple sales.
2. One sale can contain multiple sale items.
3. Each sale item refers to a product.
4. One sale can have multiple payments.
5. One customer can have multiple credit transactions.
6. Products can have multiple inventory movements.
7. Inventory movements can reference rack inventory and sale items.

## 7. Business Rules
1. Invoice numbers must be unique.
2. An invoice can contain multiple products.
3. Walk-in sales can have NULL customer_id.
4. Credit sales require owner-approved customers.
5. Credit period is 30 days.
6. Partial payments must be supported.
7. Product prices are stored as sale-time snapshots.
8. Stock must not become negative.
9. Sale, payment and stock updates must be atomic.
10. Price and discount permissions are restricted to authorized users.

## 8. Integrity and Implementation Notes
- Validate invoice totals against sale item totals.
- Credit transaction type determines whether customer debt increases or decreases.
- Validate payment and sale customer consistency.
- SALE movements decrease stock; SALE_REVERSAL movements increase stock.
- Keep products.stock_quantity synchronized with rack inventory totals.
- Calculate the 30-day credit due date using the sale date.
- Enforce credit approval and stock validation in backend business logic.
- The sales table acts as the invoice header; no separate invoices table is included.

## 9. Verification Summary
- Existing tables: 5
- New tables: 6
- Total tables: 11
- Indexes created: 9
- Foreign key relationships verified: 12
- SQL transaction: COMMIT successful
- Pre-change database backup: Created

## 10. Deliverables
- sales-invoice-schema.sql
- Sales-Invoice-Database-Design.md
- Entity Relationship Diagram
- Data Dictionary
- Business Rules and Relationships
