# catalog-ms

Product catalog and stock reservation. Part of the Cross-Repo Review test system (iam-ms, catalog-ms, cart-ms, orders-ms, invoices).

## Provides

| Contract | Kind | Used by |
| --- | --- | --- |
| `GET /products?category=&limit=` → `{ items: Product[], total }` | HTTP | clients |
| `GET /products/:id` → `{ id, sku, name, price, currency, stock, category }` | HTTP | cart-ms |
| `POST /products` (admin) | HTTP | clients |
| `PATCH /products/:id` (admin) `{ name?, price?, currency?, stock?, category? }` | HTTP | clients |
| `POST /products/:id/reserve` `{ quantity }` → `200 { reserved, remaining }` or `409 INSUFFICIENT_STOCK` | HTTP | cart-ms |
| `product.updated` `{ id, sku, name, price, currency }` | Event (published) | cart-ms |

## Consumes

| Contract | From | Where |
| --- | --- | --- |
| `POST /auth/verify` | iam-ms | `lib/iamClient.js`, `middleware/requireAdmin.js` |
| `order.cancelled` `{ orderId, userId, lines[{ productId, quantity }] }` → restock | orders-ms | `events/consumers.js` (queue `catalog-ms.events`) |
| `checkout.failed` `{ userId, reason, reserved[{ productId, quantity }] }` → restock | cart-ms | `events/consumers.js` |
| Env vars `IAM_BASE_URL`, `RABBITMQ_URL` | deployment | `lib/iamClient.js`, `lib/events.js` |

## Events

Async events go over the RabbitMQ topic exchange `shop.events` (routing key = event type, envelope `{ id, type, source, occurredAt, data }`). See `lib/events.js`.
Restocks are applied once per event id (`processed_events` table).


## Run

```bash
docker run -d --name rabbitmq -p 5672:5672 rabbitmq:3-alpine   # shared event broker
cp .env.example .env
npm install
npm run migrate && npm run seed
npm start
```
