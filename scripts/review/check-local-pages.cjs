/* Authenticated HTTP rendering check against an ephemeral local fixture. Credentials stay in memory. */
const { PrismaClient } = require('@prisma/client');
const { randomUUID, randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const url = process.env.TEST_DATABASE_URL;
if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/sevilla_ready_dataset') throw new Error('Only isolated loopback fixture allowed');
const output = process.argv[2]; if (!output) throw new Error('Pass OUTPUT_JSON');
const db = new PrismaClient({ datasources: { db: { url } } });
const origin = 'http://127.0.0.1:33117';
const userId = 'local-review-' + randomUUID(); const email = userId + '@example.test'; const password = randomBytes(24).toString('base64url');
let server;
async function main() {
  const { hashPassword } = await import('better-auth/crypto');
  await db.user.create({ data: { id: userId, email, emailVerified: true, name: 'Ensayo local', role: 'ADMIN', isActive: true, accounts: { create: { id: randomUUID(), accountId: userId, providerId: 'credential', issuer: 'local:credential', password: await hashPassword(password) } } } });
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '33117'], { env: { ...process.env, DATABASE_URL: url, BETTER_AUTH_URL: origin, NEXT_PUBLIC_APP_URL: origin, BETTER_AUTH_SECRET: randomBytes(48).toString('base64url') }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => { let text = ''; const timer = setTimeout(() => reject(new Error('Local server startup timeout')), 20000); server.stdout.on('data', data => { text += data.toString(); if (text.includes('Ready in')) { clearTimeout(timer); resolve(); } }); server.once('exit', () => { clearTimeout(timer); reject(new Error('Local server exited before ready')); }); });
  const login = await fetch(origin + '/api/auth/sign-in/email', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ email, password }) });
  if (!login.ok) throw new Error('Ephemeral local sign-in failed: ' + login.status);
  const cookies = login.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ');
  if (!cookies) throw new Error('No local session cookie returned');
  const products = await db.product.findMany({ where: { codigoInterno: { in: ['salchicha-desayuno-premium-480','mega-combo-faizan','chorizo-de-cerdo','cervecero','s-per-combo-viand','schon-pollo-brakel-x'] } } });
  const pages = [];
  for (const path of ['/dashboard','/ingredientes','/productos','/formulaciones','/normativa','/costos','/documentos', ...products.map(p => '/productos/' + p.id)]) {
    const response = await fetch(origin + path, { headers: { cookie: cookies }, redirect: 'manual' }); const html = await response.text();
    const item = { path: path.startsWith('/productos/') ? '/productos/' + products.find(p => path.endsWith(p.id)).codigoInterno : path, status: response.status, htmlBytes: Buffer.byteLength(html), authenticated: response.status === 200 && !response.headers.get('location')?.includes('/login'), checks: {} };
    if (path.startsWith('/productos/')) { item.checks = { hasSpeciesPreview: html.includes('grasa animal y carne de la misma especie'), pendingSpeciesClassification: html.includes('Pendiente de clasificación completa'), sourceReviewVisible: html.includes('Revisión de fuente y cobertura'), approvalMessageAccurate: html.includes('Esta versión aún no tiene una aprobación registrada.') && !html.includes('Aún no hay versiones de formulación.') }; }
    if (path.endsWith(products.find(p => p.codigoInterno === 'salchicha-desayuno-premium-480').id)) item.checks = { ...item.checks, fiveServings115g: html.includes('5 porciones/envase'), fourteenServings480g: html.includes('14 porciones/envase'), showsDraft: html.includes('DRAFT') };
    if (path.endsWith(products.find(p => p.codigoInterno === 'mega-combo-faizan').id)) item.checks.sourceRecipeWarning = html.includes('Receta sin reconciliar con la fuente');
    if (path.endsWith(products.find(p => p.codigoInterno === 'cervecero').id)) item.checks.sourceRecipesShown = html.includes('CERVECERO 500') && html.includes('SOURCE_PERCENTAGE_SUM_NOT_EXACT_100');
    if (path.endsWith(products.find(p => p.codigoInterno === 's-per-combo-viand').id)) item.checks.bundleShown = html.includes('Agrupaciones de productos terminados') && html.includes('SÚPER COMBO VIANDÉ 900 G');
    if (path.endsWith(products.find(p => p.codigoInterno === 'schon-pollo-brakel-x').id)) item.checks.uncodedReprocessVisible = html.includes('REPROCESO 1: MORTADELA') && html.includes('Sin código') && html.includes('Identidad pendiente; fila conservada') && html.includes('No acreditada; variante revisable');
    if (Object.values(item.checks).some(value => value === false)) throw new Error('Expected rendered evidence missing: ' + item.path);
    pages.push(item); if (!item.authenticated) throw new Error('Page check failed: ' + item.path + ' status ' + item.status);
  }
  fs.writeFileSync(output, JSON.stringify({ scope: 'Authenticated local HTTP/server rendering; not an interactive browser test', browserLimit: 'cua inventory browsers=[] and getBrowser(iab) unavailable', credentialsPersisted: false, pages }, null, 2));
  console.log(JSON.stringify(pages, null, 2));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => { if (server) server.kill('SIGTERM'); await db.user.deleteMany({ where: { id: userId } }); await db.$disconnect(); });
