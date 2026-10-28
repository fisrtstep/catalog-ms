import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { toProductDto } from './dto.js';
import { list, count, getById, createProduct, reserve } from './repository.js';

const productsRouter = express.Router();

// GET /products?category=&limit= -> { items: Product[], total }
productsRouter.get('', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const [rows, total] = await Promise.all([list({ category, limit }), count({ category })]);
        res.json({ items: rows.map(toProductDto), total });
    } catch (err) {
        next(err);
    }
});

// GET /products/:id -> Product
productsRouter.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
        const row = await getById(id);
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(toProductDto(row));
    } catch (err) {
        next(err);
    }
});

// POST /products  (admin) { sku, name, price, currency?, stock?, category? } -> Product
productsRouter.post('', requireAdmin, async (req, res, next) => {
    try {
        const { sku, name, price, currency, stock, category } = req.body ?? {};
        if (typeof sku !== 'string' || typeof name !== 'string' || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ error: 'sku, name and a non-negative price are required' });
        }
        const row = await createProduct({ sku, name, priceCents: Math.round(price * 100), currency, stock, category });
        res.status(201).json(toProductDto(row));
    } catch (err) {
        if (String(err.message).toLowerCase().includes('unique')) {
            return res.status(409).json({ error: 'SKU already exists' });
        }
        next(err);
    }
});

// POST /products/:id/reserve { quantity } -> { id, reserved, remaining } | 409 { error: 'INSUFFICIENT_STOCK' }
// Called by cart-ms at checkout.
productsRouter.post('/:id/reserve', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const quantity = Number(req.body?.quantity);
        if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ error: 'id and a positive integer quantity are required' });
        }
        const product = await getById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        const updated = await reserve(id, quantity);
        if (!updated) return res.status(409).json({ error: 'INSUFFICIENT_STOCK', available: product.stock });
        res.json({ id, reserved: quantity, remaining: updated.stock });
    } catch (err) {
        next(err);
    }
});

export default productsRouter;
