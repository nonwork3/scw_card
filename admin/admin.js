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
  <link rel="icon" href="../../assets/logo.png" type="image/svg+xml" />
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
  const qrData       = encodeURIComponent(cardURL);
  const phoneRow     = v.phone ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">
        <tr><td>
          <span style="font-size:12px;color:#888888;">&#9990;&nbsp;</span>
          <a href="tel:${v.phone}" style="font-size:12px;color:#333333;text-decoration:none;white-space:nowrap;">${phoneDisplay}</a>
        </td></tr>
      </table>` : '';

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><title>Email Signature</title></head>
<body style="margin:0;padding:24px;background:#f0f0f0;font-family:Arial,sans-serif;">
<p style="font-size:11px;color:#999;margin:0 0 12px;">
  copy ตั้งแต่ table#sig ถึง /table ไปวางใน Outlook / Gmail
</p>
<table id="sig" cellpadding="0" cellspacing="0" border="0"
  style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;background:#ffffff;padding:16px 20px;border-radius:8px;width:420px;max-width:420px;">
  <tr>
    <td colspan="2" style="padding-bottom:10px;line-height:1;">
      <img src="data:image/png;base64,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" alt="Siam Cotton Wool" width="140" height="140" style="display:block;border:0;">
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-bottom:1px;line-height:1.3;">
      <span style="font-size:15px;font-weight:bold;color:#111111;">${v.nameTH}</span>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-bottom:12px;line-height:1.4;white-space:nowrap;">
      <span style="font-size:12px;color:#666666;">${nameEN}</span>
      <span style="font-size:12px;color:#cccccc;">&nbsp;|&nbsp;</span>
      <span style="font-size:12px;font-weight:bold;color:#1D9E75;">${titleDisplay}</span>
      <span style="font-size:12px;color:#cccccc;">&nbsp;|&nbsp;</span>
      <span style="font-size:11px;color:#999999;">Siam Cotton Wool Ltd.</span>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-bottom:12px;">
      <div style="height:1.5px;background:#1D9E75;width:100%;font-size:0;line-height:0;">&nbsp;</div>
    </td>
  </tr>
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">
        <tr><td>
          <span style="font-size:12px;color:#888888;">&#9993;&nbsp;</span>
          <a href="mailto:${v.email}" style="font-size:12px;color:#1D9E75;text-decoration:none;white-space:nowrap;">${v.email}</a>
        </td></tr>
      </table>${phoneRow}
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td>
          <span style="font-size:12px;color:#888888;">&#127760;&nbsp;</span>
          <a href="https://www.siamcottonwool.co.th" style="font-size:12px;color:#1D9E75;text-decoration:none;white-space:nowrap;">www.siamcottonwool.co.th</a>
        </td></tr>
      </table>
    </td>
    <td style="vertical-align:middle;text-align:center;width:90px;">
      <a href="${cardURL}" style="display:block;text-decoration:none;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&color=0F6E56&data=${qrData}"
          alt="QR Code" width="72" height="72" style="display:block;border-radius:4px;border:0;margin:0 auto;">
        <span style="font-size:10px;color:#aaaaaa;display:block;margin-top:4px;line-height:1.4;white-space:nowrap;">สแกนบันทึก contact</span>
      </a>
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
