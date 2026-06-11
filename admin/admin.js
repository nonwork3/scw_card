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
    slug:      str('slug'),      cardURL:  str('cardURL'),
  };
}

function buildHTML(v) {
  const nameEN       = [v.nameFirst, v.nameLast].filter(Boolean).join(' ');
  const titleDisplay = toTitleCase(v.title || '');
  const phoneDisplay = fmtPhone(v.phone);
  const cardURL      = BASE + v.slug + '/';
  const webRow       = v.web ? '' : ' style="display:none"';
  const webHref      = v.web ? (v.web.startsWith('http') ? v.web : 'https://' + v.web) : '#';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${nameEN || 'New Employee'} — Siam Cotton Wool</title>
  <meta name="description" content="${titleDisplay}, Siam Cotton Wool Ltd." />
  <link rel="stylesheet" href="../../assets/card.css" />
</head>
<body>
<main class="card" role="main">

  <div class="card-header">
    <div class="logo-row">
      <img class="logo-img" src="../../assets/logo.svg" alt="Siam Cotton Wool logo" />
      <span class="logo-text">Siam Cotton Wool Ltd.</span>
    </div>
    <p class="name-th" id="c-name-th">${v.nameTH}</p>
    <h1 class="name-en" id="c-name-en">${nameEN}</h1>
    <span class="title-pill" id="c-title">${v.title}</span>
    <div class="icon-strip" aria-hidden="true">
      <svg viewBox="0 0 24 24"><rect x="2" y="8" width="16" height="8" rx="1"/><ellipse cx="20" cy="12" rx="3" ry="4"/><line x1="2" y1="12" x2="17" y2="12"/></svg>
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><circle cx="7" cy="16.5" r="4"/><circle cx="17" cy="16.5" r="4"/></svg>
      <svg viewBox="0 0 24 24"><path d="M21 12 a9 9 0 1 0 -9 -9"/><path d="M17 12 a5 5 0 1 0 -5 -5"/><circle cx="12" cy="12" r="1.5"/></svg>
      <svg viewBox="0 0 24 24"><path d="M3 19c3-2 6-2 9 0s6 2 9 0"/><path d="M3 15c3-2 6-2 9 0s6 2 9 0"/><path d="M3 11c3-2 6-2 9 0s6 2 9 0"/><path d="M3 7c3-2 6-2 9 0s6 2 9 0"/></svg>
      <svg viewBox="0 0 24 24"><circle cx="9" cy="13" r="5"/><line x1="9" y1="8" x2="9" y2="18"/><line x1="4" y1="13" x2="14" y2="13"/><circle cx="17" cy="9" r="4"/><line x1="17" y1="5" x2="17" y2="13"/><line x1="13" y1="9" x2="21" y2="9"/></svg>
      <svg viewBox="0 0 24 24"><rect x="2" y="3" width="4" height="2.5" rx="0.5"/><rect x="2" y="18.5" width="4" height="2.5" rx="0.5"/><line x1="4" y1="5.5" x2="4" y2="18.5"/><rect x="10" y="3" width="4" height="2.5" rx="0.5"/><rect x="10" y="18.5" width="4" height="2.5" rx="0.5"/><line x1="12" y1="5.5" x2="12" y2="18.5"/><rect x="18" y="3" width="4" height="2.5" rx="0.5"/><rect x="18" y="18.5" width="4" height="2.5" rx="0.5"/><line x1="20" y1="5.5" x2="20" y2="18.5"/></svg>
      <svg viewBox="0 0 24 24"><rect x="2" y="15" width="20" height="6" rx="1"/><rect x="5" y="8" width="14" height="7" rx="1"/><circle cx="9" cy="11.5" r="2"/><circle cx="15" cy="11.5" r="2"/><line x1="9" y1="8" x2="9" y2="6"/><line x1="15" y1="8" x2="15" y2="6"/><path d="M9 6h6"/></svg>
    </div>
  </div>

  <div class="card-body">
    <div class="info-row">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Email</span>
        <span class="info-value"><a id="c-email" href="mailto:${v.email}">${v.email}</a></span>
      </div>
    </div>
    <div class="info-row">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Phone</span>
        <span class="info-value"><a id="c-phone-link" href="tel:${v.phone}">${phoneDisplay}</a></span>
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
    <div class="info-row">
      <div class="info-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="info-content">
        <span class="info-label">Address</span>
        <span class="info-value addr">40/5 M.3 Soi Krunai, Suksawad Rd., Bangkru,<br>Phrapradaeng, Samutprakan 10130</span>
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
