# Database Documentation

This directory contains database schema, migrations, and seeding scripts.

## Quick Start

```bash
# Run migrations
pnpm db:migrate

# Seed the database (drops existing data first)
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio
```

---

## Test Credentials

All accounts use password: **`Password123`**

| Role     | Email                   | Description                            |
| -------- | ----------------------- | -------------------------------------- |
| Admin    | `admin@example.com`     | Super Admin Account                    |
| Customer | `customer@example.com`  | Primary testing customer               |
| Merchant | `merchant1@example.com` | Primary mapping merchant               |
| Courier  | `courier1@example.com`  | Primary active courier                 |

*Note: Hundreds of other randomized mock users are generated automatically. Use `customer_1@example.com` etc. if needed.*

---

## Seeded Data (V2 Production Simulation)

A massive mock distribution simulating a production environment running across the application database schemas.

### Users (~350)
- 1 Admin
- 200 Customers
- 50 Merchants
- 100 Couriers

### Courier Profiles (~100)
- Assorted motorcycles, bicycles, and cars scattered dynamically with varied ratings.

### Customer Addresses (~200)
- Pre-filled across massive location points around the city center.

### Merchants (50 Restaurants)
- Assorted labels, varied delivery minimum setups.

### Menu Items (~500 Items)
- Spanning 10 core categories.

### Orders (~1000 Simulated Iterations)
- Scattered payment status mappings and multi-item subtotaling mapped over different time periods.
- Complete with >200 matching randomly generated reviews matching delivered states.

---

## Re-seeding

Running `pnpm db:seed` will **drop all existing data** and reseed with fresh test data.
