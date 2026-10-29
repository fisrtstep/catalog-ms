import pool from '../db/pool.js';

const COLUMNS = 'id, sku, name, price_cents, currency, stock, category';

export async function list({ category, limit }) {
    const { rows } = category
        ? await pool.query(`SELECT ${COLUMNS} FROM products WHERE category = $1 ORDER BY id LIMIT $2`, [category, limit])
        : await pool.query(`SELECT ${COLUMNS} FROM products ORDER BY id LIMIT $1`, [limit]);
    return rows;
}

export async function count({ category }) {
    const { rows } = category
        ? await pool.query('SELECT COUNT(*) AS n FROM products WHERE category = $1', [category])
        : await pool.query('SELECT COUNT(*) AS n FROM products');
    return Number(rows[0].n);
}

export async function getById(id) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE id = $1`, [id]);
    return rows[0] ?? null;
}

export async function findBySku(sku) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE sku = $1`, [sku]);
    return rows[0] ?? null;
}

export async function createProduct({ sku, name, priceCents, currency = 'USD', stock = 0, category = null }) {
    const { rows } = await pool.query(
        `INSERT INTO products (sku, name, price_cents, currency, stock, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
        [sku, name, priceCents, currency, stock, category],
    );
    return rows[0];
}

// Atomically takes `quantity` units out of stock. Returns the updated row, or null if there is not enough stock.
export async function reserve(id, quantity) {
    const { rows } = await pool.query(
        'UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2 RETURNING id, stock',
        [id, quantity],
    );
    return rows[0] ?? null;
}

// Partial update; only keys present in `fields` are written. Returns the updated row, or null if not found.
export async function updateProduct(id, fields) {
    const columns = { name: 'name', priceCents: 'price_cents', currency: 'currency', stock: 'stock', category: 'category' };
    const keys = Object.keys(fields).filter((k) => columns[k] && fields[k] !== undefined);
    if (keys.length === 0) return getById(id);
    const sets = keys.map((k, i) => `${columns[k]} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(
        `UPDATE products SET ${sets} WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, ...keys.map((k) => fields[k])],
    );
    return rows[0] ?? null;
}

// Puts reserved units back into stock, once per event id.
// lines: [{ productId, quantity }]
export async function releaseForEvent(eventId, lines) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rowCount } = await client.query(
            'INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
            [eventId],
        );
        if (rowCount > 0) {
            for (const { productId, quantity } of lines) {
                await client.query('UPDATE products SET stock = stock + $2 WHERE id = $1', [productId, quantity]);
            }
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
