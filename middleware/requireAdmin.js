import { verifyToken } from '../lib/iamClient.js';

export async function requireAdmin(req, res, next) {
    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });
    try {
        const identity = await verifyToken(token);
        if (!identity) return res.status(401).json({ error: 'Invalid token' });
        if (identity.role !== 'admin') return res.status(403).json({ error: 'Admin role required' });
        req.identity = identity;
        next();
    } catch {
        res.status(503).json({ error: 'Identity service unavailable' });
    }
}
