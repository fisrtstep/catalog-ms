// Calls iam-ms. Base URL comes from IAM_BASE_URL.
const base = () => process.env.IAM_BASE_URL;

// POST /auth/verify { token } -> { valid, userId, role }
export async function verifyToken(token) {
    const res = await fetch(`${base()}/auth/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(3000),
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`iam-ms responded ${res.status}`);
    const body = await res.json();
    return body.valid ? { userId: body.userId, role: body.role } : null;
}
