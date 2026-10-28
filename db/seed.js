import { fileURLToPath } from 'node:url';
import pool from './pool.js';
import { findBySku, createProduct } from '../products/repository.js';

const SEED_PRODUCTS = [
    { sku: 'KB-100', name: 'Mechanical Keyboard', priceCents: 8999, stock: 25, category: 'accessories' },
    { sku: 'MS-200', name: 'Wireless Mouse', priceCents: 2999, stock: 40, category: 'accessories' },
    { sku: 'MN-300', name: '27" Monitor', priceCents: 24999, stock: 10, category: 'displays' },
    { sku: 'HD-400', name: 'USB-C Hub', priceCents: 4950, stock: 1, category: 'accessories' },
];

export async function seed() {
    for (const p of SEED_PRODUCTS) {
        if (await findBySku(p.sku)) continue;
        await createProduct(p);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await seed();
    await pool.end();
    console.log('seeded');
}
