export async function POST() {
    console.info("[diag-post] POST:start");
    return Response.json({ ok: true, ts: Date.now() });
}