# catalog-ms

Product catalog and stock reservation. Part of the Cross-Repo Review test system (iam-ms, catalog-ms, cart-ms, invoices).

## Provides

| Contract | Kind | Used by |
| --- | --- | --- |
| `GET /products?category=&limit=` → `{ items: Product[], total }` | HTTP | clients |
| `GET /products/:id` → `{ id, sku, name, price, currency, stock, category }` | HTTP | cart-ms |
| `POST /products` (admin) | HTTP | clients |
| `POST /products/:id/reserve` `{ quantity }` → `200 { reserved, remaining }` or `409 INSUFFICIENT_STOCK` | HTTP | cart-ms |

## Consumes

| Contract | From | Where |
| --- | --- | --- |
| `POST /auth/verify` | iam-ms | `lib/iamClient.js`, `middleware/requireAdmin.js` |
| Env var `IAM_BASE_URL` | deployment | `lib/iamClient.js` |

## Run

```bash
cp .env.example .env
npm install
npm run migrate && npm run seed
npm start
```
