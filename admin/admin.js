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
      <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MjcuMzMgNTg3LjIyIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjNmU2ZjcyOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIGZpbGw6ICM1YmMxYWQ7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogIzZkNmU3MTsKICAgICAgfQoKICAgICAgLmNscy00IHsKICAgICAgICBmaWxsOiAjZmNmZWZlOwogICAgICB9CgogICAgICAuY2xzLTUgewogICAgICAgIGZpbGw6ICM2YzZkNzA7CiAgICAgIH0KCiAgICAgIC5jbHMtNiB7CiAgICAgICAgZmlsbDogI2ZkZmVmZTsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNTI3LjczLDMwOC4zNmMtNC41MSwyMC40OC0xMi42LDQwLjM1LTI3LjA1LDU1LjkxLTE5LjQ5LDIwLjk5LTQ0LjYxLDM0LTczLjQxLDM2LjA2LTU2LjA1LDQuMDEtMTA2LjU4LTM1LjQ2LTExNS42OC05MS44MS0xMi4yNS0yLjc4LTIzLjg2LTYuMDgtMzQuNjItMTEuODYtMjguOC0xNS40NS00OC4zOC00Mi42Mi01NS4wMi03MS44My0xMy45Ni02MS4zNywyNS44OC0xMjEuOTYsODkuMzgtMTMyLjQ3LDMuNjYtMjAuMTIsMTEuMzctMzguMDUsMjQuMjYtNTMuMDgsMi4wNS0yLjM5LDQuMzUtNC40LDUuOTgtNy4wMywyLjc2LTEuNjQsNC41Ny0zLjk1LDYuOTEtNS45Niw0MC45LTM1LjMxLDEwMS41NC0zNC45MSwxNDIuMjkuMjksMjAuNTcsMTcuNzcsMzAuOCwzOC45NCwzNy4xMyw2NS4zMywyNC40Myw1LjQ1LDQ3LjE3LDE2LjAxLDY0LjQ0LDM2LjE0LDE0LjY0LDE3LjA3LDI0LjM1LDM3LjQxLDI2LjU2LDYwLjIzLDMuMDgsMzEuNzYtNiw2MS4yMy0yNy4yNCw4NC45Mi0xNi44NCwxOC43OC0zOC41NSwzMC40LTYzLjkxLDM1LjE1Wk00MTkuNDEsMTQwLjg1YzE2LjkzLTI0LjkzLDQwLjc2LTQwLjg5LDY4Ljg3LTQ2Ljg5LTcuMjMtMzIuOTMtMzYuNS01NS42Mi02OS4zMi01NS40NXMtNjEuNDgsMjIuNzUtNjguNjgsNTUuMzdjMjguNTQsNi4wNCw1Mi40NCwyMi40Miw2OS4xMyw0Ni45N1pNMzk3LjIzLDE4NC45MmMtOC0zNS41Mi00MC4yNC01Ny43My03NC41Mi01NS4xNS0zNC44LDIuNjItNjIuNDQsMzAuNTgtNjQuOTQsNjUuMTVzMjAuNjUsNjYuOTMsNTUuMjksNzQuMjJjOS4xMy00Mi43LDQxLjk3LTc1LjExLDg0LjE3LTg0LjIyWk01MjUuODMsMjY5LjI1YzM2LjExLTguMzksNTcuNzktNDAuOTQsNTQuOS03NS4yMy0yLjg5LTM0LjM4LTMwLjg0LTYxLjczLTY1LjAzLTY0LjE5LTM0LjgtMi41LTY2LjY2LDIwLjMxLTc0LjI5LDU1LjE3LDQyLjczLDguOTcsNzUuMTgsNDEuODIsODQuNDEsODQuMjVaTTQ5MC4wMSwyOTEuM2MwLTM5LjAzLTMxLjY0LTcwLjY4LTcwLjY4LTcwLjY4cy03MC42OCwzMS42NC03MC42OCw3MC42OCwzMS42NCw3MC42OCw3MC42OCw3MC42OCw3MC42OC0zMS42NCw3MC42OC03MC42OFoiLz4KICA8Y2lyY2xlIGNsYXNzPSJjbHMtNiIgY3g9IjQxOS4zMyIgY3k9IjI5MS4zIiByPSI3MC42OCIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNiIgZD0iTTM5Ny4yMywxODQuOTJjLTQyLjIsOS4xMS03NS4wNSw0MS41Mi04NC4xNyw4NC4yMi0zNC42NC03LjI5LTU3LjgtMzkuNDEtNTUuMjktNzQuMjJzMzAuMTQtNjIuNTMsNjQuOTQtNjUuMTVjMzQuMjgtMi41OCw2Ni41MiwxOS42Myw3NC41Miw1NS4xNVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik01MjUuODMsMjY5LjI1Yy05LjIzLTQyLjQzLTQxLjY4LTc1LjI4LTg0LjQxLTg0LjI1LDcuNjMtMzQuODYsMzkuNDktNTcuNjgsNzQuMjktNTUuMTcsMzQuMTgsMi40Niw2Mi4xMywyOS44LDY1LjAzLDY0LjE5LDIuODksMzQuMy0xOC43OSw2Ni44NC01NC45LDc1LjIzWiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTQxOS40MSwxNDAuODVjLTE2LjY5LTI0LjU1LTQwLjU5LTQwLjk0LTY5LjEzLTQ2Ljk3LDcuMi0zMi42MiwzNS45MS01NS4xOSw2OC42OC01NS4zN3M2Mi4wOSwyMi41Miw2OS4zMiw1NS40NWMtMjguMTEsNi4wMS01MS45NCwyMS45Ni02OC44Nyw0Ni44OVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0zOC43OCw1NjEuMTljMTEuMDMsMi44NCwxNC4xOC41MSwyMi41NS45OWwtLjA5LDIxLjc2Yy0xNy42MSw1LjM2LTQyLjg4LDQuOTItNTQuMi04Ljc0LTkuMzctMTEuMy05Ljk0LTM1LjA1LDEuNjgtNDYuOTksNi42Ni02Ljg0LDE1Ljk1LTExLjcsMjUuODktMTEuODRsMzcuNTEtLjUyYy4xOS0zLjM3Ljk5LTcuOTEtLjgtMTAuODgtMy43NS02LjIxLTExLjI5LTYuODQtMTguMDEtNy4wNS0xNC41My0uNDYtMjcuOTkuOTItNDEuOTcsNS41M3YtMjQuNTZjMTYuNTMtNS40NiwzMy40NS03LjU2LDUxLjAxLTYuOWwxMi45NSwxLjg5LDQwLjg0LjE0YzEuMDIsMy40NS0uNjYsNi42NC0uNzgsOS44OS0uMTksNS4yMy40LDkuODgtMS40NCwxNS4wMWwtMTAuODcuMTdjMi41Myw2LjE4LDMuNjcsMTIuMjIsMy4yNCwxOC45NGwuMDMsNjYuOTYtMzMuODYtLjE5LS4xOC00NC44NS0yOC41NC40MWMtMy4xNS4wNC02LjcxLDEuNzMtOC4yMSwzLjQtMy4zMiwzLjY5LTQuNDMsMTUuNDUsMy4yNiwxNy40M1oiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik01MzEuNCw1NjEuMzdsOS4wNCwxLjM2LDEyLjctMS40My4xMiwyMi45NGMtMTIuMDcsMy4zNC0yNC45Myw0LjA2LTM2Ljk3Ljk2LTEzLjM3LTMuNDUtMjEuOTItMTMuMjYtMjMuNTUtMjYuODMtMi43OS0yMy4yOSwxMS42Ny0zOS43OCwzMy44Ny00MS45NmwzOC40NS0uNTRjLjc0LTQuMzkuNDUtOC44OC0yLjU4LTEyLjM3LTIuMjctMi42MS02LjAxLTUuMTQtMTAuNjktNS4xMmwtMjUsLjA4Yy03Ljg3LjAzLTE0Ljg5LDIuMzYtMjIuNDcsNC44OGwuMjEtMjQuNzQsMjUuNzItNS42NmMxMy4xOS0yLjksMjUuODEtLjU1LDM4Ljk1LjcxbDM5LjAyLjUtLjA0LDEwLjgzYy0uMDIsNC43OS0xLjM1LDktLjc1LDEzLjk2bC0xMi4xLjEyYzIuMjMsNS4xNiwzLjcsMTAuMzUsMy43MiwxNi4xOWwuMyw2OS43M2gtMzQuMDdzMC00NS4wMSwwLTQ1LjAxbC0yNi45Ny4xOWMtMi43NC4wMi02LjIyLDEuMDMtOC42LDIuMzUtMy4zOCwxLjg4LTQuNjksNi40My00LjQ2LDkuODhzMS41LDguMjgsNi4xMiw4Ljk4WiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTIwOS4zMiw1NDQuNTVsLS4wMy03MC41N2gzNC4wOHMtLjMxLDc1LjQxLS4zMSw3NS40MWMtMi4xMSwxNS40OC0xMC44MywyNy42Mi0yNS42NiwzMi45LTE5LjUzLDYuOTUtNDEuMjgsNi4yNi02MS4xOC0uMTctOC4xOS0yLjY0LTE1LjIyLTguMjgtMTkuNDctMTUuMzktNi4wOS0xMC4xNy01Ljk1LTIyLjE5LjQtMzEuOTJsNy4wOC03LjMyLTcuMDgtNy4zYy00LjEyLTQuMjUtMy43NS0xMC41MS0zLjk1LTE2LjE0LS40OS0xMy4yOSw2LjU0LTIzLjUxLDE4Ljk0LTI4LjU0LDEyLjYtNS4xMSwyNi44OS00LjQ3LDQwLjE0LS43N3YyNC41NGMtNC42OS0xLjkzLTkuMjUtLjk5LTEzLjk0LTEuNC02LjMyLS41NS0xMS4zNiwxLjA5LTExLjk4LDcuNjQtLjUzLDUuNTQsMywxMC4wNSw5LjM5LDEwLjE2bDE1LjY1LjI4Yy0uNCw0LjM5LjY4LDcuOTguNzIsMTIuMTJsLjEsMTAuODItMTUuNjEuMjVjLTYuNTEuMTEtMTAuMTgsNC41LTEwLjUxLDEwLjM1LS42NiwxMS45MSwxNS43MSwxMi45NSwyOS41NCwxMC45MSw4LjA4LTEuMTksMTMuOTUtNy4yMSwxMy42OS0xNS44NloiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik03ODEuMjksNTYxLjM5bC0uMDMsMjIuODRjLTEyLjgxLDMuNjEtMjYuNSw0LjE4LTM5LjEzLjA5cy0yMC4xMS0xNC45NC0yMS4yNS0yOC4xMmMtLjg4LTEwLjE4LDEuMjItMjEuMTgsOC41MS0yOC4zNiw2Ljc2LTYuNjYsMTYuMjktMTEuMzcsMjYuMi0xMS41bDM3LjQ1LS40OGMuNzgtNC41Ny43LTEwLjQ2LTMuMDctMTMuMjctNS4yMi0zLjg5LTExLjM1LTUuNC0xNy42Ny00LjQzLTEzLjQyLTEuMDgtMjYuMDIuOS0zOS43LDUuMTNsLS4yOC0yNC41OWMyNS45NS03Ljg5LDY1LjM0LTEyLjU3LDg0LjUyLDYuNTksNi41Niw2LjU2LDguODUsMTQuOTgsMTAuMzcsMjQuMDZsLjEyLDc1LjYyLTM0LjAyLjAzdi00NS4wMnMtMjYuMDYuMS0yNi4wNi4xYy0zLjMyLjAxLTcuMzQsMS4xNi0xMC4wNywyLjcyLTMuODQsMi4xOS00LjEzLDEyLjgxLS45NSwxNi43MSwyLjY5LDMuMywxMS4yNiwzLjQxLDE4LjI2LDIuNjNsNi44MS0uNzZaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDcxLjMyLDQ3My45OGwtLjI1LDgwLjM1Yy0yLjMxLDE3LTEzLjc0LDI5LjUtMzAuMzYsMzIuMTEtMTUuODQsMi40OS0zMS4wNy0xLjQ5LTQ0LjMyLTEwLjYyLS4xNywzLjI0LjMyLDUuNzktLjY0LDguOTlsLTMxLjQ2LjE3di0xMTAuOTlzMzQuMDMsMCwzNC4wMywwbC0uMDgsNzguMjFjNi4yNSw2Ljg0LDE0Ljg5LDkuMTksMjQuMDQsOS4xLDcuODUtLjA3LDEzLTMuNTUsMTQuODktMTIuMDRsLjE1LTc1LjI2LDM0LS4wMloiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0zMDUuNDIsNTg0Ljk5bC0uNDYtNzIuNDRjLS4wNC03LjAxLTQuMzYtMTMuMTctMTAuOTUtMTQuMTMtMTIuMi0xLjc4LTIzLjUzLjU4LTM1LjQxLDQuNjVsLS4yMS0yMy45MWMxNy40Mi03LjQ5LDM2LjMxLTkuNDQsNTQuNDYtNC44NCwxOC4yOCw0LjY0LDI0LjIxLDE3LjgyLDI2LjM2LDM2LjA0bC4xNCw3NC42M2gtMzMuOTJaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNjY2LjI1LDUxNS43M2MtMS01LjQxLTEuNTQtMTAuMjEtNC44My0xMy44LTUuOTctNi41Mi0yMi40Ni00LjMzLTMzLjU2LTEuMzVsLTguNTMsMi4yOXYtMjMuODZjMTcuMjUtNy4xNSwzNS42NS05LjI3LDUzLjc0LTQuOTIsMTguMTEsNC4zNSwyNS41MSwxOS4xNCwyNy4wMSwzNy40OGwuMTgsNzMuMjMtMzMuOTUuMi0uMDYtNjkuMjdaIi8+CiAgPHBhdGggY2xhc3M9ImNscy01IiBkPSJNNzMzLjYsNDYyLjAyYy0xLjQtOC4xOSwxLjExLTE1LjQ5LjY2LTIzLjA1bDY0Ljk5LjAyLjA3LTE2LjAxLDI3LjgzLS4wNS4wMiwzOC45OC05My41Ni4xMVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTYwOC44OSw0NDIuNDljMCwxNC40Ni0xMS43MiwyNi4xOS0yNi4xOSwyNi4xOXMtMjYuMTktMTEuNzItMjYuMTktMjYuMTksMTEuNzItMjYuMTksMjYuMTktMjYuMTksMjYuMTksMTEuNzIsMjYuMTksMjYuMTlaTTU5MS4zNiw0NDIuNWMwLTQuNzQtMy44NS04LjU5LTguNTktOC41OXMtOC41OSwzLjg1LTguNTksOC41OSwzLjg1LDguNTksOC41OSw4LjU5LDguNTktMy44NSw4LjU5LTguNTlaIi8+Cjwvc3ZnPg==" alt="Siam Cotton Wool" height="60" style="display:block;border:0;width:auto;">
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
