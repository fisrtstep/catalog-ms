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
