'use strict';

const OWNER = 'nonwork3';
const REPO  = 'scw_card';
const BASE  = `https://${OWNER}.github.io/${REPO}/card/`;

// ── PAT ──────────────────────────────────────────────────────
function getPAT() { return localStorage.getItem('scw_pat'); }

function toggleSettings() {
  const wrap = document.getElementById('patWrapper');
  wrap.classList.toggle('open');
  const stored = getPAT();
  if (stored) {
    document.getElementById('patInput').value = stored;
    showPATStatus(true);
  }
}

function savePAT() {
  const val = (document.getElementById('patInput').value || '').trim();
  if (!val) { showPATStatus(false, 'กรุณากรอก token'); return; }
  localStorage.setItem('scw_pat', val);
  showPATStatus(true);
  toast('บันทึก token แล้วค่ะ');
}

function showPATStatus(ok, msg) {
  const el = document.getElementById('patStatus');
  if (!el) return;
  el.className = 'pat-status ' + (ok ? 'ok' : 'err');
  el.textContent = ok ? '✓ Token พร้อมใช้งาน' : (msg || '');
}

// ── GitHub API ────────────────────────────────────────────────
function apiHeaders() {
  return {
    Authorization: `token ${getPAT()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

async function apiGet(path) {
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { headers: apiHeaders() }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'HTTP ' + r.status), { status: r.status });
  }
  return r.json();
}

async function apiPut(path, html, message, sha) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(html))),
    ...(sha && { sha }),
  };
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'PUT', headers: apiHeaders(), body: JSON.stringify(body) }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'HTTP ' + r.status), { status: r.status });
  }
  return r.json();
}

async function apiDelete(path, sha, message) {
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'DELETE', headers: apiHeaders(), body: JSON.stringify({ message, sha }) }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'HTTP ' + r.status), { status: r.status });
  }
  return r.json();
}

// ── Card utilities ────────────────────────────────────────────
function makeSlug(nameEN) {
  const parts  = nameEN.trim().split(/\s+/);
  const first  = (parts[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last   = parts.slice(1).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffix = last.slice(0, 3);
  return suffix ? `${first}.${suffix}` : first;
}

function toTitleCase(s) {
  return s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

function normalizePhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 10) return '+66' + d.slice(1);
  if (d.startsWith('66') && d.length >= 11)  return '+' + d;
  return raw;
}

function fmtPhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('66') && d.length >= 11) return '+' + d.slice(0, 4) + ' ' + d.slice(4);
  return raw;
}

function b64decode(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function parseCardData(html) {
  const m = html.match(/window\.SCW_PERSON\s*=\s*\{([\s\S]*?)\};/);
  if (!m) return null;
  const obj = m[1];
  const str = (key) => {
    const r = obj.match(new RegExp(key + '\\s*:\\s*"([^"]*)"'));
    return r ? r[1] : '';
  };
  return {
    nameTH:    str('nameTH'),    nameEN:   str('nameEN'),
    nameFirst: str('nameFirst'), nameLast: str('nameLast'),
    title:     str('title'),     email:    str('email'),
    phone:     str('phone'),     web:      str('web'),
    line:      str('line'),
    address:   str('address'),
    slug:      str('slug'),      cardURL:  str('cardURL'),
  };
}

function buildHTML(v) {
  const nameEN       = [v.nameFirst, v.nameLast].filter(Boolean).join(' ');
  const titleDisplay = toTitleCase(v.title || '');
  const phoneDisplay = fmtPhone(v.phone);
  const cardURL      = BASE + v.slug + '/';
  const lineRow      = v.line ? '' : ' style="display:none"';
  const lineHref     = v.line ? 'https://line.me/ti/p/~' + v.line : '#';
  const webRow       = v.web ? '' : ' style="display:none"';
  const webHref      = v.web ? (v.web.startsWith('http') ? v.web : 'https://' + v.web) : '#';
  const addressRow   = v.address ? '' : ' style="display:none"';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${nameEN || 'New Employee'} — Siam Cotton Wool</title>
  <meta name="description" content="${titleDisplay}, Siam Cotton Wool Ltd." />
  <link rel="stylesheet" href="../../assets/card.css" />
  <link rel="icon" href="../../assets/scw-logo.svg" type="image/svg+xml" />
  <meta property="og:title" content="${nameEN} — ${titleDisplay}" />
  <meta property="og:description" content="Siam Cotton Wool Ltd." />
  <meta property="og:image" content="https://nonwork3.github.io/scw_card/assets/logo.png" />
  <meta property="og:url" content="${cardURL}" />
  <meta property="og:type" content="profile" />
</head>
<body>
<main class="card" role="main">

  <div class="card-header">
    <div class="logo-row">
      <img class="logo-img" src="../../assets/logo.png" alt="Siam Cotton Wool logo" />
      <span class="logo-text">Siam Cotton Wool Ltd.</span>
    </div>
    <p class="name-th" id="c-name-th">${v.nameTH}</p>
    <h1 class="name-en" id="c-name-en">${nameEN}</h1>
    <span class="title-pill" id="c-title">${v.title}</span>
    <div class="icon-bar" aria-hidden="true">
      <svg><use href="../../assets/icons.svg#scw-roll"/></svg>
      <svg><use href="../../assets/icons.svg#scw-cotton"/></svg>
      <svg><use href="../../assets/icons.svg#scw-yarn"/></svg>
      <svg><use href="../../assets/icons.svg#scw-fabric"/></svg>
      <svg><use href="../../assets/icons.svg#scw-pad"/></svg>
      <svg><use href="../../assets/icons.svg#scw-swab"/></svg>
      <svg><use href="../../assets/icons.svg#scw-tissue"/></svg>
    </div>
  </div>

  <div class="card-body">
    <div class="info-row" id="row-email">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Email</span>
        <span class="info-value"><a id="c-email" href="mailto:${v.email}">${v.email}</a></span>
      </div>
    </div>
    <div class="info-row" id="row-phone">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Phone</span>
        <span class="info-value"><a id="c-phone-link" href="tel:${v.phone}">${phoneDisplay}</a></span>
      </div>
    </div>
    <div class="info-row"${lineRow} id="row-line">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">LINE</span>
        <span class="info-value"><a id="c-line" href="${lineHref}">${v.line || ''}</a></span>
      </div>
    </div>
    <div class="info-row"${webRow} id="row-web">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Website</span>
        <span class="info-value"><a id="c-web" href="${webHref}">${v.web || ''}</a></span>
      </div>
    </div>
    <div class="info-row"${addressRow} id="row-address">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Address</span>
        <span class="info-value addr" id="c-address">${v.address || ''}</span>
      </div>
    </div>
  </div>

  <div class="card-footer">
    <button class="btn-save" onclick="downloadVCard()" aria-label="บันทึกลงรายชื่อผู้ติดต่อ">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      บันทึกลงผู้ติดต่อ
    </button>
    <div class="qr-panel">
      <div id="qr-box"></div>
      <p class="qr-url-label" id="c-qr-url"></p>
    </div>
  </div>

</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<script>
window.SCW_PERSON = {
  nameTH:       "${v.nameTH}",
  nameEN:       "${nameEN}",
  nameFirst:    "${v.nameFirst}",
  nameLast:     "${v.nameLast}",
  title:        "${v.title}",
  titleDisplay: "${titleDisplay}",
  email:        "${v.email}",
  phone:        "${v.phone}",
  phoneDisplay: "${phoneDisplay}",
  web:          ${v.web ? '"' + v.web + '"' : 'null'},
  line:         ${v.line ? '"' + v.line + '"' : 'null'},
  address:      ${v.address ? '"' + v.address + '"' : 'null'},
  slug:         "${v.slug}",
  cardURL:      "${cardURL}"
};
<\/script>
<script src="../../assets/card.js"><\/script>
</body>
</html>`;
}

// ── Email helper ──────────────────────────────────────────────
function openEmail(to, greeting, cardURL) {
  const subject = encodeURIComponent('นามบัตรดิจิทัล — Siam Cotton Wool Ltd.');
  const body    = encodeURIComponent(
`เรียน ${greeting}

นามบัตรดิจิทัลของท่านพร้อมใช้งานแล้วค่ะ

🔗 ${cardURL}

วิธีใช้งาน:
• เปิดลิงก์บนมือถือ กด "บันทึกลงผู้ติดต่อ" เพื่อบันทึก vCard
• หรือ Scan QR Code จากหน้านี้ได้เลย

ด้วยความนับถือ
Siam Cotton Wool Ltd.`
  );
  window.open(`mailto:${to}?subject=${subject}&body=${body}`);
}

// ── Signature generator ───────────────────────────────────────
function generateSignature(v) {
  const nameEN       = v.nameEN || [v.nameFirst, v.nameLast].filter(Boolean).join(' ');
  const titleDisplay = toTitleCase(v.title || '');
  const phoneDisplay = v.phone ? fmtPhone(v.phone) : '';
  const cardURL      = BASE + v.slug + '/';
  const qrSrc        = 'https://api.qrserver.com/v1/create-qr-code/?size=72x72&color=0F6E56&data=' + encodeURIComponent(cardURL);
  const logoSrc      = 'https://nonwork3.github.io/scw_card/assets/logo-email.png';

  const phoneRow = v.phone ? `
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:5px;font-size:16px;font-family:Arial,sans-serif;">
                <span style="color:#888888;mso-text-raise:0;">&#9990;&nbsp;</span>
                <a href="tel:${v.phone}" style="color:#333333;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;mso-text-raise:0;">${phoneDisplay}</a>
              </td></tr>
            </table>` : '';

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><title>Email Signature</title></head>
<body style="margin:0;padding:24px;background:#f0f0f0;font-family:Arial,sans-serif;">
<p style="font-size:11px;color:#999;margin:0 0 12px;">
  copy table#sig ถึง /table ไปวางใน Gmail / Outlook
</p>
<table id="sig" cellpadding="0" cellspacing="0" border="0" width="460"
  style="font-family:Arial,sans-serif;font-size:13px;color:#333333;">
  <tr>
    <td width="4" bgcolor="#1D9E75" style="font-size:0;line-height:0;">&nbsp;</td>
    <td width="12" style="font-size:0;line-height:0;">&nbsp;</td>
    <td>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td colspan="2" style="padding-bottom:8px;">
          <img src="${logoSrc}" width="120" height="85" alt="Siam Cotton Wool"
            style="display:block;border:0;">
        </td></tr>
        <tr><td colspan="2" style="padding-bottom:2px;">
          <span style="font-size:20px;font-weight:bold;color:#111111;font-family:Arial,sans-serif;mso-text-raise:0;">${v.nameTH}</span>
        </td></tr>
        <tr><td colspan="2" style="padding-bottom:10px;">
          <span style="font-size:16px;color:#666666;font-family:Arial,sans-serif;mso-text-raise:0;">${nameEN}</span>
          <span style="font-size:16px;color:#cccccc;mso-text-raise:0;"> | </span>
          <span style="font-size:16px;font-weight:bold;color:#1D9E75;font-family:Arial,sans-serif;mso-text-raise:0;">${titleDisplay}</span>
          <span style="font-size:16px;color:#cccccc;mso-text-raise:0;"> | </span>
          <span style="font-size:15px;color:#999999;font-family:Arial,sans-serif;mso-text-raise:0;">Siam Cotton Wool Ltd.</span>
        </td></tr>
        <tr><td colspan="2" height="1" bgcolor="#1D9E75"
          style="font-size:0;line-height:1px;">&nbsp;</td></tr>
        <tr><td colspan="2" height="10"
          style="font-size:0;line-height:10px;">&nbsp;</td></tr>
        <tr>
          <td valign="top" style="padding-right:16px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:5px;font-size:16px;font-family:Arial,sans-serif;">
                <span style="color:#888888;mso-text-raise:0;">&#9993;&nbsp;</span>
                <a href="mailto:${v.email}" style="color:#1D9E75;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;mso-text-raise:0;">${v.email}</a>
              </td></tr>
            </table>${phoneRow}
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:5px;font-size:16px;font-family:Arial,sans-serif;">
                <span style="color:#888888;mso-text-raise:0;">&#127760;&nbsp;</span>
                <a href="https://www.siamcottonwool.co.th"
                  style="color:#1D9E75;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;mso-text-raise:0;">www.siamcottonwool.co.th</a>
              </td></tr>
            </table>
          </td>
          <td valign="middle" align="center" width="80">
            <a href="${cardURL}" style="text-decoration:none;">
              <img src="${qrSrc}" width="72" height="72" alt="QR"
                style="display:block;border:0;">
            </a>
            <table cellpadding="0" cellspacing="0" border="0" width="72">
              <tr><td align="center" style="font-size:8px;color:#aaaaaa;padding-top:6px;font-family:Arial,sans-serif;line-height:13px;white-space:nowrap;">
                สแกน QR เพื่อบันทึก
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body></html>`;
}

function downloadSignature() {
  const v    = getValues();
  const html = generateSignature(v);
  console.log('[signature] getValues:', v);
  console.log('[signature] html length:', html.length);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'signature-' + (v.slug || 'scw') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
  if (getPAT()) showPATStatus(true);
});
