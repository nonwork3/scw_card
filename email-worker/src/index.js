/**
 * SCW Email Worker — ส่งอีเมลนามบัตรดิจิทัล
 *
 * Required secrets (set via: npx wrangler secret put <NAME>):
 *   SMTP_HOST     — hostname ของ SMTP server เช่น mail.siamcottonwool.co.th
 *   SMTP_PORT     — 587 (STARTTLS) หรือ 465 (SMTPS)
 *   SMTP_USER     — username / sender email
 *   SMTP_PASSWORD — password
 *   SMTP_FROM     — (optional) sender address ถ้าต่างจาก SMTP_USER
 */

import { connect } from 'cloudflare:sockets';

const ALLOWED_ORIGIN = 'https://nonwork3.github.io';

// ── Entry point ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const { pathname } = new URL(request.url);
    if (pathname !== '/send-card-email' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin);
    }

    const { to, name, cardURL, signatureHTML = '' } = body;
    if (!to || !name || !cardURL) {
      return json({ error: 'Missing required fields: to, name, cardURL' }, 400, origin);
    }

    try {
      await sendSMTP(env, {
        to,
        subject: 'นามบัตรดิจิทัลของคุณ - Siam Cotton Wool',
        html: buildEmailHtml(name, cardURL, signatureHTML),
      });
      return json({ success: true }, 200, origin);
    } catch (err) {
      console.error('SMTP error:', err.message);
      return json({ success: false, error: err.message }, 500, origin);
    }
  },
};

// ── HTML body ──────────────────────────────────────────────────────────────

function buildEmailHtml(name, cardURL, signatureHTML) {
  const safeUrl = esc(cardURL);
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;padding:24px">
<p>สวัสดีค่ะ ${esc(name)}</p>
<p>นี่คือนามบัตรดิจิทัลของคุณ:
  <a href="${safeUrl}" style="color:#0F6E56">${safeUrl}</a></p>
<p>Email Signature ของคุณอยู่ด้านล่าง —
  copy ไปวางใน Outlook/Gmail ได้เลยค่ะ</p>
<hr style="border:none;border-top:1px solid #eee;margin:20px 0">
${signatureHTML}
<hr style="border:none;border-top:1px solid #eee;margin:20px 0">
<p style="font-size:12px;color:#888">
  วิธีติดตั้ง: เปิดอีเมลนี้ใน browser →
  copy ตั้งแต่ตาราง signature →
  วางใน Email Signature settings
</p>
</body>
</html>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── SMTP via cloudflare:sockets TCP ───────────────────────────────────────

async function sendSMTP(env, { to, subject, html }) {
  const host      = env.SMTP_HOST;
  const port      = parseInt(env.SMTP_PORT || '587', 10);
  const user      = env.SMTP_USER;
  const pass      = env.SMTP_PASSWORD;
  const fromAddr  = env.SMTP_FROM || user;
  const useSmtps  = port === 465;

  let socket = connect(
    { hostname: host, port },
    { secureTransport: useSmtps ? 'on' : 'off' }
  );

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let   buf = '';

  let writer = socket.writable.getWriter();
  let reader = socket.readable.getReader();

  // Read one complete SMTP response; skips multi-line continuation lines (code + '-')
  async function readResp() {
    while (true) {
      const crlf = buf.indexOf('\r\n');
      if (crlf !== -1) {
        const line = buf.slice(0, crlf);
        buf = buf.slice(crlf + 2);
        if (line.length >= 4 && line[3] === '-') continue; // continuation
        return { code: parseInt(line.slice(0, 3), 10), line };
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('SMTP: connection closed unexpectedly');
      buf += dec.decode(value, { stream: true });
    }
  }

  async function cmd(line) {
    await writer.write(enc.encode(line + '\r\n'));
  }

  function expect(resp, code) {
    if (resp.code !== code) {
      throw new Error(`SMTP: expected ${code}, got ${resp.code} — ${resp.line}`);
    }
  }

  // Convert UTF-8 string → base64 (works with Thai and other non-Latin1 chars)
  function utf8b64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  try {
    // 1. Server greeting
    expect(await readResp(), 220);

    // 2. EHLO
    await cmd('EHLO scw-email-service.workers.dev');
    expect(await readResp(), 250);

    // 3. STARTTLS (port 587 only — port 465 is already TLS)
    if (!useSmtps) {
      await cmd('STARTTLS');
      expect(await readResp(), 220);

      // Release plain-text stream handles, upgrade socket to TLS
      reader.releaseLock();
      writer.releaseLock();
      socket = socket.startTls();
      writer = socket.writable.getWriter();
      reader = socket.readable.getReader();
      buf    = '';

      // Re-EHLO required after TLS upgrade
      await cmd('EHLO scw-email-service.workers.dev');
      expect(await readResp(), 250);
    }

    // 4. AUTH LOGIN
    await cmd('AUTH LOGIN');
    expect(await readResp(), 334);   // "Username:"
    await cmd(btoa(user));
    expect(await readResp(), 334);   // "Password:"
    await cmd(btoa(pass));
    expect(await readResp(), 235);   // Authentication successful

    // 5. Envelope
    await cmd(`MAIL FROM:<${fromAddr}>`);
    expect(await readResp(), 250);
    await cmd(`RCPT TO:<${to}>`);
    expect(await readResp(), 250);

    // 6. Message body
    await cmd('DATA');
    expect(await readResp(), 354);

    // RFC 2047 encoded subject for UTF-8/Thai support
    const subjectEncoded = `=?UTF-8?B?${utf8b64(subject)}?=`;

    // Base64-encode HTML body in 76-char lines (RFC 2045)
    const htmlB64 = utf8b64(html).match(/.{1,76}/g).join('\r\n');
    const boundary = 'scw_' + Date.now().toString(36);

    const message = [
      `Date: ${new Date().toUTCString()}`,
      `From: SCW Admin <${fromAddr}>`,
      `To: ${to}`,
      `Subject: ${subjectEncoded}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      htmlB64,
      '',
      `--${boundary}--`,
      '.',  // DATA terminator
    ].join('\r\n');

    await writer.write(enc.encode(message + '\r\n'));
    expect(await readResp(), 250);

    // 7. Done
    await cmd('QUIT');

  } finally {
    try { reader.releaseLock(); } catch {}
    try { writer.releaseLock(); } catch {}
    try { await socket.close(); }  catch {}
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
