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
      <img class="logo-img" src="../../assets/scw-logo.svg" alt="Siam Cotton Wool logo" height="60" style="display:block;border:0;" />
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
      <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MjYuNSA1ODYuMjYiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICM2ZTZmNzI7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgfQoKICAgICAgLmNscy0zIHsKICAgICAgICBmaWxsOiAjNWJjMmFkOwogICAgICB9CgogICAgICAuY2xzLTQgewogICAgICAgIGZpbGw6ICM2ZDZlNzE7CiAgICAgIH0KCiAgICAgIC5jbHMtNSB7CiAgICAgICAgZmlsbDogIzkwOTI5NDsKICAgICAgfQoKICAgICAgLmNscy02IHsKICAgICAgICBmaWxsOiAjNmM2ZDcwOwogICAgICB9CgogICAgICAuY2xzLTcgewogICAgICAgIGZpbGw6ICNmZWZmZmY7CiAgICAgIH0KCiAgICAgIC5jbHMtOCB7CiAgICAgICAgZmlsbDogI2ZkZmRmZDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNTI2LjQ3LDMwNy4zNGM1My45Mi04LjI3LDkyLjU2LTU0Ljc2LDkyLjMtMTA3Ljk5LS4yNy01My4yNS0zOS4yNS05OC45Mi05Mi4zNy0xMDYuOTdDNTE4LjM3LDM5LjA3LDQ3Mi4yNS0uMTMsNDE4LjYzLDBzLTk5LjIyLDM5LjM1LTEwNy4yLDkyLjM0Yy01My40OCw4LjA2LTkyLjUzLDU0LjQ3LTkyLjM0LDEwNy44NXMzOS40LDk5LjE1LDkyLjM5LDEwNy4xMWM4LjA1LDUzLjQ4LDU0LjI2LDkyLjQ3LDEwNy42LDkyLjM4LDUzLjU0LS4wOSw5OS4yNy0zOS4xOSwxMDcuMzgtOTIuMzRaTTU4MC41Nyw0NjcuMDJjOS4zLjU3LDE3LjI4LTIuODYsMjIuOTktOS45Nyw2Ljc4LTguNDUsNi43Mi0yMS41Mi0uMDItMzAtNS41Ni03LTEzLjQtMTAuMjgtMjIuMjEtMTAtOS4yNy4zLTE3Ljg5LDQuODctMjIuMzUsMTMuMTItMy45OSw3LjM3LTQuMDEsMTYuNDMsMCwyMy44MSw0LjI4LDcuODksMTIuNDMsMTIuNDgsMjEuNiwxMy4wNFpNNzMyLjkyLDQ2MC45M2g5My4wN3MwLTM4LjI3LDAtMzguMjdoLTI2LjY5cy0uMSwxNi0uMSwxNmgtNjQuNzJzLTEuNTUsMjIuMjYtMS41NSwyMi4yNlpNNjAuMiw1NjEuNGMtNy43MiwxLjQzLTEzLjkxLDEuNzgtMjAuNS4zNC00Ljc3LS44My03LjgxLTQuODQtNy40LTkuNjgtLjM3LTMuNzUuNDctNy4yNywzLjI0LTkuODgsMy42Ni0xLjk4LDcuNzktMi45MSwxMi4wNi0yLjkzbDI1LjE1LS4xdjQ1LjAyczMzLjAxLDAsMzMuMDEsMGwtLjAyLTY5LjM0Yy0uNTYtNS44Ni0xLjIxLTExLjAxLTQtMTYuMzhoMTEuOTFzMS42NS0yNC41MiwxLjY1LTI0LjUyaC00MC44OWMtNy4yNC0xLjQ2LTE0LjExLTIuMDgtMjEuNTctMi4wNi0xNC4xMy40Mi0yNy44MiwyLjQ3LTQxLjM2LDYuOGwuMDUsMjMuNjhjMTMuODYtNC4zLDI3LjIyLTYuMDQsNDEuMTEtNS42Myw0LjExLjM5LDguMDcuNzQsMTEuODUsMi4xOSw0LjU5LDEuNzcsOC4wNSw1Ljc4LDguMTUsMTAuNzRsLjEyLDYuMjYtMzMuMzcuMTVjLTE3LjQxLjA4LTM0LjkzLDguOTktMzguNDYsMjcuMDMtMS41NCw3Ljg2LTEuMjYsMTUuODksMS40NiwyMy40NSw3LjczLDIxLjQ5LDM3Ljc1LDIyLjMyLDU3Ljg5LDE2Ljc5bC0uMDktMjEuOTVaTTIwOS4xNCw1NDQuODljLS4wMSw3Ljg5LTUuMTIsMTMuNDYtMTIuMjEsMTUuMjUtOC41LDIuMTUtMjQuNDIsMi4wMi0yOS4zNC0zLjgzLTMuNDMtNC4wNy0zLjEzLTEwLjY3LjUxLTE0LjUyLDIuNDEtMi41NSw2LjE2LTMuNDYsOS41Ni0zLjVsMTMuOTEtLjE3LTEuMjQtMjIuNDMtMTMuOTktLjA3Yy0yLjgzLS4wMS01LjY1LTEuMTUtOC4xLTIuMzctMS44My0yLjA3LTIuNjEtNC40NC0yLjQ4LTcuMTktLjQtNC4zMSwyLjIzLTcuNzUsNi40OC04LjY3LDYuNDktMS40MSwxMy4wMi0uNTQsMTkuNTMuODJsLS4wMy0yMy4zN2MtMTEuNzYtMy41Ny0yMy44NS0zLjkyLTM1LjUtLjk5LTE1LjQ2LDQuODctMjMuMDMsMTQuNDMtMjMuMjksMzAuNy0uMTUsOS4yOSwzLjk3LDE3LjcsMTIuMiwyMi40OS0xNC40OCw4LjctMTUuODMsMjcuMjEtNy43Miw0MC45Myw1LjU4LDcuMzksMTMuMDksMTIsMjIuMDgsMTQuNTMsMjQuMTMsNi43OSw2NS43Miw2LjI2LDc3Ljk0LTE4LjMyLDIuODEtNS42NSw0LjY2LTExLjg3LDQuNjgtMTguMzlsLjEzLTcxLjg2aC0zM3MtLjEyLDcwLjk3LS4xMiw3MC45N1pNMzA1LjI2LDUxNS40N3Y2OC43MXMzMy4wMS0uMDEsMzMuMDEtLjAxbC0uMDMtNzAuODZjLS4zNS02LjY3LS45Ni0xMi43NS0zLjIxLTE4LjktNi0xNi40LTIwLjQzLTIxLjM5LTM3LjE5LTIyLjM4LTEzLjQ4LS43NC0yNi43MywxLjY0LTM5LjEsNi43N2wuMDIsMjMuMzRjNy4xLTIuNTEsMTMuODMtNC4zMywyMS4wOS01LjIzLDQuODItLjM4LDkuMzktLjM2LDE0LjAyLjU4LDguNjksMi4yNiwxMC42MSw4LjkzLDExLjM5LDE3Ljk3Wk01NTIuNyw1NjEuNGMtNy43MiwxLjQzLTEzLjkxLDEuNzgtMjAuNS4zNC00Ljc3LS44My03LjgxLTQuODQtNy40LTkuNjgtLjM3LTMuNzUuNDctNy4yNywzLjI0LTkuODgsMy42Ni0xLjk4LDcuNzktMi45MSwxMi4wNi0yLjkzbDI1LjE1LS4xdjQ1LjAyczMzLjAxLDAsMzMuMDEsMGwtLjAyLTY5LjM0Yy0uNTYtNS44Ni0xLjIxLTExLjAxLTQtMTYuMzhoMTEuOTFzMS42NS0yNC41MiwxLjY1LTI0LjUyaC00MC44OWMtNy4yNC0xLjQ2LTE0LjExLTIuMDgtMjEuNTctMi4wNi0xNC4xMy40Mi0yNy44MiwyLjQ3LTQxLjM2LDYuOGwuMDUsMjMuNjhjMTMuODYtNC4zLDI3LjIyLTYuMDQsNDEuMTEtNS42Myw0LjExLjM5LDguMDcuNzQsMTEuODUsMi4xOSw0LjU5LDEuNzcsOC4wNSw1Ljc4LDguMTUsMTAuNzRsLjEyLDYuMjYtMzMuMzcuMTVjLTE3LjQxLjA4LTM0LjkzLDguOTktMzguNDYsMjcuMDMtMS41NCw3Ljg2LTEuMjYsMTUuODksMS40NiwyMy40NSw3LjczLDIxLjQ5LDM3Ljc1LDIyLjMyLDU3Ljg5LDE2Ljc5bC0uMDktMjEuOTVaTTYxOS40Nyw1MDEuNTRjMCwuMi0uMDIuNTUuMTQuNWwuOS0uMzVjMTAuNzUtMy40MSwyMi45MS02LjcsMzQuMjQtNC4wOSw4LjUyLDEuOTYsMTAuNjcsOS40NCwxMS4yNCwxOC4wMnY2OC41NXMzMy4wMSwwLDMzLjAxLDBsLS4wMi03MS4wNGMtLjM5LTE4LjUtNy4xOC0zNC4xNS0yNS45Mi0zOC44Ny0xNy43NC00LjQ2LTM2LjM3LTIuNDctNTMuNTQsNC41MWwtLjA1LDIyLjc2Wk03ODAuNzgsNTgzLjQxbC0uMDUtMjIuMDZjLTcuMjMsMS40Ny0xMy44NSwxLjgyLTIwLjUxLjM5LTQuOTMtMS4xMS03LjY2LTUuMTktNy4xNy0xMC4xOS0uNDItMy44OS44Mi03LjUzLDQtOS44NiwzLjQ2LTEuNDcsNy4xNy0yLjQzLDExLjA1LTIuNDRsMjUuMTUtLjA4djQ1LjAyczMzLjI0LDAsMzMuMjQsMHYtNzAuNTVjLTEuMi0yOC45Ni0xOC42Mi00MC4wMi00Ni4xOC00MS42My0xNi40My0uNTQtMzIuNTQsMS44NC00OC4zMyw2LjY0djIzLjcyYzEzLjQ0LTQuMTIsMjcuMS02LjA3LDQxLjE0LTUuNjIsOS4xNS4yMiwxOS43OSwzLjI1LDE5Ljk5LDEyLjU0bC4xNCw2LjY1LTMzLjM2LjE0Yy03LjQ4LjAzLTE0LjU1LDEuNzQtMjEuMTQsNC44My0xNi4yNSw3LjYxLTIwLjY0LDI0LjY1LTE2LjcsNDEuNDUsNS44NywyNS4wNCwzNi41MSwyNy4wNyw1OC43MiwyMS4wNlpNNDcwLjQ4LDQ3NC4xN2gtMzMuMjJzLS4wNSw3My4zNC0uMDUsNzMuMzRjLS44Nyw3LjIxLTQuNzksMTIuNTMtMTEuOTIsMTMuNTctMTAuNzcsMS41Ny0xOS45OC0xLjc4LTI4LjA0LTguOTV2LTc3Ljk4cy0zMywuMDQtMzMsLjA0djEwOS45OHMzMC41NSwwLDMwLjU1LDBsMS4yMi05LjQ0YzEwLjU0LDcuODYsMjIuNzcsMTEuNjYsMzUuODMsMTEuNTEsNy41Ni0uMDksMTQuNjMtMS4zMSwyMS4xMy01LjExLDcuNTItNC40LDEyLjk1LTExLjIsMTUuMzYtMTkuNjUsMS4yOS00LjU0LDIuMTItOS4wOCwyLjEzLTE0LjAybC4wMi03My4zWiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTUyNi40NywzMDcuMzRjLTguMTEsNTMuMTQtNTMuODQsOTIuMjUtMTA3LjM4LDkyLjM0LTUzLjM1LjA5LTk5LjU1LTM4Ljg5LTEwNy42LTkyLjM4LTUyLjk5LTcuOTYtOTIuMi01My42OC05Mi4zOS0xMDcuMTFzMzguODYtOTkuNzksOTIuMzQtMTA3Ljg1QzMxOS40MSwzOS4zNSwzNjUuMjMuMTMsNDE4LjYzLDBzOTkuNzMsMzkuMDcsMTA3Ljc2LDkyLjM3YzUzLjEyLDguMDUsOTIuMTEsNTMuNzIsOTIuMzcsMTA2Ljk3LjI3LDUzLjIzLTM4LjM3LDk5LjczLTkyLjMsMTA3Ljk5Wk00MTguOTYsMTQwLjMxYzE1Ljk2LTI0LjA0LDQwLjA0LTQwLjgxLDY4LjY3LTQ2Ljg3LTcuMDUtMzIuMjctMzUuNzktNTUuMDktNjguNTEtNTUuMTlzLTYxLjY5LDIyLjI4LTY5LjA2LDU1LjA3YzI4LjM1LDUuOTYsNTIuNzQsMjIuNjIsNjguOSw0Ni45OFpNMzk2LjYzLDE4NC4zOGMtOC4xNC0zNS40Mi00MC40NS01Ny43OC03NC45NC01NC44My0zNC42LDIuOTYtNjEuODMsMzAuNzgtNjQuMiw2NS4zNi0yLjM4LDM0LjY4LDIwLjksNjYuMjQsNTUuMDQsNzMuNjIsOS4wMS00Mi42Myw0Mi4xNi03NS4xNSw4NC4xLTg0LjE1Wk01MjUuNDEsMjY4LjU4YzM0LjUzLTcuNzQsNTcuNTgtMzkuNjMsNTQuNzktNzQuNDgtMi43Ni0zNC40NS0zMC4zLTYxLjg2LTY0LjY5LTY0LjU1LTM0Ljg3LTIuNzItNjYuNzUsMjAuNDctNzQuMzEsNTQuODksNDIuMzksOC44NSw3NS4zOCw0Miw4NC4yMSw4NC4xM1pNNDg5LjQsMjkwLjg2YzAtMzguOTQtMzEuNTYtNzAuNS03MC41LTcwLjVzLTcwLjUsMzEuNTYtNzAuNSw3MC41LDMxLjU2LDcwLjUsNzAuNSw3MC41LDcwLjUtMzEuNTYsNzAuNS03MC41WiIvPgogIDxjaXJjbGUgY2xhc3M9ImNscy0yIiBjeD0iNDE4LjkiIGN5PSIyOTAuODYiIHI9IjcwLjUiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zOTYuNjMsMTg0LjM4Yy00MS45NSw5LTc1LjEsNDEuNTItODQuMSw4NC4xNS0zNC4xNS03LjM3LTU3LjQyLTM4Ljk0LTU1LjA0LTczLjYyLDIuMzctMzQuNTgsMjkuNi02Mi4zOSw2NC4yLTY1LjM2LDM0LjQ5LTIuOTUsNjYuOCwxOS40MSw3NC45NCw1NC44M1oiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01MjUuNDEsMjY4LjU4Yy04LjgzLTQyLjE0LTQxLjgyLTc1LjI5LTg0LjIxLTg0LjEzLDcuNTYtMzQuNDIsMzkuNDUtNTcuNjIsNzQuMzEtNTQuODksMzQuMzksMi42OSw2MS45MywzMC4wOSw2NC42OSw2NC41NSwyLjgsMzQuODUtMjAuMjUsNjYuNzQtNTQuNzksNzQuNDhaIi8+CiAgPHBhdGggY2xhc3M9ImNscy03IiBkPSJNNDE4Ljk2LDE0MC4zMWMtMTYuMTYtMjQuMzYtNDAuNTQtNDEuMDItNjguOS00Ni45OCw3LjM3LTMyLjc5LDM2LjI5LTU1LjE3LDY5LjA2LTU1LjA3czYxLjQ2LDIyLjkxLDY4LjUxLDU1LjE5Yy0yOC42Myw2LjA2LTUyLjcxLDIyLjgzLTY4LjY3LDQ2Ljg3WiIvPgogIDxnPgogICAgPHBhdGggY2xhc3M9ImNscy00IiBkPSJNNDcwLjQ4LDQ3NC4xN2wtLjAyLDczLjNjMCw0Ljk1LS44Myw5LjQ4LTIuMTMsMTQuMDItMi40MSw4LjQ1LTcuODQsMTUuMjUtMTUuMzYsMTkuNjUtNi40OSwzLjgtMTMuNTcsNS4wMy0yMS4xMyw1LjExLTEzLjA2LjE1LTI1LjI5LTMuNjUtMzUuODMtMTEuNTFsLTEuMjIsOS40NGgtMzAuNTVzMC0xMDkuOTksMC0xMDkuOTlsMzMtLjA0djc3Ljk4YzguMDUsNy4xNywxNy4yNiwxMC41MSwyOC4wMyw4Ljk1LDcuMTMtMS4wNCwxMS4wNS02LjM2LDExLjkyLTEzLjU3bC4wNS03My4zNGgzMy4yMloiLz4KICAgIDxnPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yMDkuMTQsNTQ0Ljg5bC4xMi03MC45NWgzM3MtLjEzLDcxLjg1LS4xMyw3MS44NWMtLjAxLDYuNTItMS44NywxMi43NC00LjY4LDE4LjM5LTEyLjIyLDI0LjU4LTUzLjgyLDI1LjExLTc3Ljk0LDE4LjMyLTguOTgtMi41My0xNi41LTcuMTMtMjIuMDgtMTQuNTMtOC4xLTEzLjcyLTYuNzUtMzIuMjIsNy43Mi00MC45My04LjI0LTQuNzktMTIuMzUtMTMuMi0xMi4yLTIyLjQ5LjI2LTE2LjI3LDcuODMtMjUuODMsMjMuMjktMzAuNywxMS42NS0yLjkzLDIzLjczLTIuNTcsMzUuNS45OWwuMDMsMjMuMzdjLTYuNTEtMS4zNi0xMy4wNS0yLjIzLTE5LjUzLS44Mi00LjI1LjkyLTYuODgsNC4zNi02LjQ4LDguNjctLjEzLDIuNzUuNjUsNS4xMiwyLjQ4LDcuMTksMi40NSwxLjIyLDUuMjcsMi4zNiw4LjEsMi4zN2wxMy45OS4wNywxLjI0LDIyLjQzLTEzLjkxLjE3Yy0zLjQuMDQtNy4xNS45NS05LjU2LDMuNS0zLjY0LDMuODQtMy45MywxMC40NS0uNTEsMTQuNTIsNC45Miw1Ljg0LDIwLjg1LDUuOTcsMjkuMzQsMy44Myw3LjEtMS43OSwxMi4yLTcuMzYsMTIuMjEtMTUuMjVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTYwLjIsNTYxLjRsLjA5LDIxLjk1Yy0yMC4xNCw1LjUzLTUwLjE2LDQuNy01Ny44OS0xNi43OS0yLjcyLTcuNTYtMy0xNS42LTEuNDYtMjMuNDUsMy41My0xOC4wNCwyMS4wNS0yNi45NSwzOC40Ni0yNy4wM2wzMy4zNy0uMTUtLjEyLTYuMjZjLS4xLTQuOTUtMy41NS04Ljk3LTguMTUtMTAuNzQtMy43OC0xLjQ1LTcuNzQtMS44LTExLjg1LTIuMTktMTMuOS0uNC0yNy4yNSwxLjMzLTQxLjExLDUuNjNsLS4wNS0yMy42OGMxMy41NC00LjMzLDI3LjIzLTYuMzgsNDEuMzYtNi44LDcuNDYtLjAyLDE0LjMzLjYsMjEuNTcsMi4wNWg0MC44OXMtMS42NSwyNC41MS0xLjY1LDI0LjUxaC0xMS45MWMyLjc5LDUuMzgsMy40NSwxMC41Myw0LDE2LjM5bC4wMiw2OS4zNGgtMzMuMDFzMC00NS4wMiwwLTQ1LjAybC0yNS4xNS4xYy00LjI4LjAyLTguNC45NS0xMi4wNiwyLjkzLTIuNzcsMi42MS0zLjYxLDYuMTMtMy4yNCw5Ljg4LS40MSw0Ljg1LDIuNjMsOC44NSw3LjQsOS42OCw2LjU5LDEuNDQsMTIuNzgsMS4wOSwyMC41LS4zNFoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy00IiBkPSJNMzA1LjI2LDUxNS40N2MtLjc3LTkuMDQtMi43LTE1LjcxLTExLjM5LTE3Ljk3LTQuNjMtLjk0LTkuMi0uOTYtMTQuMDItLjU4LTcuMjYuOS0xMy45OSwyLjcyLTIxLjA5LDUuMjNsLS4wMi0yMy4zNGMxMi4zNi01LjEzLDI1LjYxLTcuNTIsMzkuMS02Ljc3LDE2Ljc2Ljk5LDMxLjE5LDUuOTgsMzcuMTksMjIuMzgsMi4yNSw2LjE0LDIuODYsMTIuMjMsMy4yMSwxOC45bC4wMyw3MC44NmgtMzMuMDJzMC02OC43LDAtNjguN1oiLz4KICAgIDwvZz4KICA8L2c+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik03ODAuNzgsNTgzLjQxYy0yMi4yMSw2LjAxLTUyLjg1LDMuOTgtNTguNzItMjEuMDYtMy45NC0xNi44MS40NS0zMy44NCwxNi43LTQxLjQ1LDYuNTktMy4wOSwxMy42Ni00LjgsMjEuMTQtNC44M2wzMy4zNi0uMTQtLjE0LTYuNjVjLS4yLTkuMjktMTAuODMtMTIuMzEtMTkuOTktMTIuNTQtMTQuMDQtLjQ1LTI3LjcsMS41LTQxLjE0LDUuNjJ2LTIzLjcyYzE1Ljc4LTQuOCwzMS44OS03LjE4LDQ4LjMyLTYuNjQsMjcuNTUsMS42MSw0NC45OCwxMi42OCw0Ni4xOCw0MS42M3Y3MC41NXMtMzMuMjQsMC0zMy4yNCwwdi00NS4wMnMtMjUuMTYuMDgtMjUuMTYuMDhjLTMuODcuMDEtNy41OS45Ny0xMS4wNSwyLjQ0LTMuMTksMi4zMy00LjQyLDUuOTctNCw5Ljg2LS40OSw1LDIuMjQsOS4wOCw3LjE3LDEwLjE5LDYuNjYsMS40NCwxMy4yOCwxLjA4LDIwLjUxLS4zOWwuMDUsMjIuMDZaIi8+CiAgICA8cG9seWdvbiBjbGFzcz0iY2xzLTYiIHBvaW50cz0iNzMyLjkyIDQ2MC45MyA3MzQuNDggNDM4LjY3IDc5OS4yIDQzOC42NyA3OTkuMyA0MjIuNjcgODI1Ljk5IDQyMi42NyA4MjYgNDYwLjk0IDczMi45MiA0NjAuOTMiLz4KICA8L2c+CiAgPHBhdGggY2xhc3M9ImNscy01IiBkPSJNNjIwLjUyLDUwMS42OWwtLjkuMzVjLS4xNy4wNS0uMTQtLjMtLjE0LS41bDEuMDQuMTVaIi8+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik01NTIuNyw1NjEuNGwuMDksMjEuOTVjLTIwLjE0LDUuNTMtNTAuMTYsNC43LTU3Ljg5LTE2Ljc5LTIuNzItNy41Ni0zLTE1LjYtMS40Ni0yMy40NSwzLjUzLTE4LjA0LDIxLjA1LTI2Ljk1LDM4LjQ2LTI3LjAzbDMzLjM3LS4xNS0uMTItNi4yNmMtLjEtNC45NS0zLjU1LTguOTctOC4xNS0xMC43NC0zLjc4LTEuNDUtNy43NC0xLjgtMTEuODUtMi4xOS0xMy45LS40LTI3LjI1LDEuMzMtNDEuMTEsNS42M2wtLjA1LTIzLjY4YzEzLjU0LTQuMzMsMjcuMjMtNi4zOCw0MS4zNi02LjgsNy40Ni0uMDIsMTQuMzMuNiwyMS41NywyLjA1aDQwLjg5cy0xLjY1LDI0LjUxLTEuNjUsMjQuNTFoLTExLjkxYzIuNzksNS4zOCwzLjQ1LDEwLjUzLDQsMTYuMzlsLjAyLDY5LjM0aC0zMy4wMXMwLTQ1LjAyLDAtNDUuMDJsLTI1LjE1LjFjLTQuMjguMDItOC40Ljk1LTEyLjA2LDIuOTMtMi43NywyLjYxLTMuNjEsNi4xMy0zLjI0LDkuODgtLjQxLDQuODUsMi42Myw4Ljg1LDcuNCw5LjY4LDYuNTksMS40NCwxMi43OCwxLjA5LDIwLjUtLjM0WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy00IiBkPSJNNjIwLjUyLDUwMS42OWwtMS4wNC0uMTUuMDUtMjIuNzZjMTcuMTctNi45OCwzNS44LTguOTcsNTMuNTQtNC41MSwxOC43NCw0LjcyLDI1LjUyLDIwLjM3LDI1LjkyLDM4Ljg3bC4wMiw3MS4wNGgtMzMuMDFzMC02OC41NSwwLTY4LjU1Yy0uNTgtOC41OC0yLjcyLTE2LjA2LTExLjI0LTE4LjAyLTExLjMzLTIuNjEtMjMuNDkuNjgtMzQuMjQsNC4wOVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTU4MC41Nyw0NjcuMDJjLTkuMTctLjU3LTE3LjMyLTUuMTYtMjEuNi0xMy4wNC00LTcuMzktMy45OC0xNi40NCwwLTIzLjgxLDQuNDYtOC4yNSwxMy4wOC0xMi44MiwyMi4zNS0xMy4xMnMxNi42NSwzLDIyLjIxLDEwYzYuNzMsOC40OCw2Ljc5LDIxLjU1LjAyLDMwLTUuNyw3LjEyLTEzLjY4LDEwLjU1LTIyLjk5LDkuOTdaTTU5MC43MSw0NDIuMDdjMC00LjYzLTMuNzUtOC4zOC04LjM4LTguMzhzLTguMzgsMy43NS04LjM4LDguMzgsMy43NSw4LjM4LDguMzgsOC4zOCw4LjM4LTMuNzUsOC4zOC04LjM4WiIvPgogICAgPGNpcmNsZSBjbGFzcz0iY2xzLTgiIGN4PSI1ODIuMzMiIGN5PSI0NDIuMDciIHI9IjguMzgiLz4KICA8L2c+Cjwvc3ZnPgo=" alt="Siam Cotton Wool" height="60" style="display:block;border:0;">
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
