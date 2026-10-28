export function toProductDto(row) {
    return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        price: { amount: row.price_cents / 100, currency: row.currency },
        stock: row.stock,
        category: row.category,
    };
}
