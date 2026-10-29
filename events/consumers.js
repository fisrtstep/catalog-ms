import { subscribe } from '../lib/events.js';
import { releaseForEvent } from '../products/repository.js';

export async function startConsumers() {
    await subscribe('catalog-ms.events', {
        // { orderId, userId, lines: [{ productId, quantity }] }
        'order.cancelled': (data, event) => releaseForEvent(event.id, data.lines),
        // { userId, reason, reserved: [{ productId, quantity }] }
        'checkout.failed': (data, event) => releaseForEvent(event.id, data.reserved),
    });
}
