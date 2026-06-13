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
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:3px;mso-line-height-rule:exactly;line-height:1.2;">
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
  style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;background:#ffffff;padding:12px 12px;width:440px;max-width:440px;border-collapse:collapse;border-spacing:0;">
  <tr>
    <td colspan="2" style="padding-bottom:6px;line-height:1;mso-line-height-rule:exactly;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAACACAYAAACiJkOJAAAYpklEQVR4nO2de5AcxX3Hfz33EEKPWxkZJFlYJ54CDHcHBkF43AoKyolDdILkL2R0pJyqxCBpJSfYsSGsgkMRE3MriThVSQrdEfgrFndyxTaBgHZBFBKydXtgQLIA7WFhFCzQrXhIJ91O+9uzu6fdvZ7unn1Juzefqr7+zd5OTz++09PPWUY+ZefOF59eanPezjkLEuOtRNRKhXAWxZ8EY1a8sZm29F6zLEE+JcPgfMqAEHHK5l3I0S4cBuA8wuOMGnp9cZeGL+gSuSP29AqIMUxErVQuOPU2TbHW+cL2DoPzKYLlL/UHuW1vgtlKlSPSNBPC7lg2AtvHAAbn45Hlsc0PcKIwVQUeb2psuKv32mVxHPho8AXtge7B/sDxJO9HRy9I1WXEYrTmv264vZd8lPiCNqT75f7242OpTciydhyeFCDqu3xRq/EFbUD3K/2tx4/ZgzADcCcVX9RqfEFrcJoZh1NbkVXtOPTEnNOm71/8xfmJs6fPHMNhHv/7/ttz9x7++EKYnvFF7Y4vaA3Lo5v7eXps2YjpjVOS3ee3DbbNOmtuc0OjUrCc8+RvPz/8+pN741P3fPLxFfjImKZGq8PvKE7EF7SCO17cHMKYcA9MI+656KroV8+Y18EYa8GhJz45fiz+YDw25f+PfnoRDg3g8ac6/7wDhk8OvqBdyLSb98HUcv7ML+y59yvXkq5G1iFq7Bc+2Bd/4p2hThxqQeGte7Lz9jD5jIM88ZGBGcBeSGwFaRBi/v5lN8wpplZ2473Pktvu3/XCdTC1NDVbC/0ZxRP4gpZgWjtXQsxZTEXNiK1/svO2EEwf4AtagkntLDp/j139x1QJMWf56fCe5za/9+bNMFWMYHp8oT89nsYXtIQ7YpsPwQvAufLY1V+Pz2hqbodZUX4wFNujHd7DLOJTN9wegTXp8QVdwDde3Nxtc9oE05UrzpgbX3Xx1e0wK44Y/bhn+8801/JHPLL4gi7ApLlRrdo5y4Y3t8d/9dEHyuv5ncM0vqALQHNjH7xWckF0BO9r61Q3AcrMfnQQv6/pIPqzh2kYnE8Gk9GNey5eHL3yjHlBqiJifLp720ALTAV8C5odXTAmNZNe0GKthv0J70xxsSRUONZOCu48ty12w9wFc5pYQ7Vq6eRHo0d2Ywhv0Wdjx3SijmMYb6Cx0doyWafFJ62g0VZewTjv8rJOI5dpjc3J2xdcFK+QuJNoZrz+k8Rb0wc/VredFYygcCONzVbfZGpbI82TCyFk1GRhImqlMtHxhbnxb154Bcamm4oVX5bkzoPvD27aG+/Q18YemER7FBncpKAaewCXzGnd8Y3z27/UQGw+Dj2BGnnbQ69tu7SsQi6AEYUbZ1rr63kSBmmsf6q5B1A0RR68/MbdZ0yZuhiHJiR79w7u3nogYfr9Ukkwy7rryeuXRakOqWtBiw5fsYvzS0V0Hm+ad04nTFeO89Se+375/LQDRz/zXKOXSr0O89WtoE+mmLMsPXvRtttaL7oO5gSEmFdvf2ZOJZsYOupR1HUp6FNBzFlkoj4VxJyl3kRdd4IuRcxijcYlgTOT86bNpLNPnzkutreSvx85fGyUPfv+O+ceOPrpfHzkiVxRlyJm0em8ZNaZR6Y3TWHZ+I2mxkbf/fTQkTcOfTh158EPFn06Nup87gXGrGVP3rBsAGbNU3eCXh57OsKJr4ZphNjI2n1BxzsXzDzj3EamH50Y43x/9IN97zw9vLvdi3j+6fIbt82f1nLpD4aiB/YePmQ8bi1usjvOuWx09mmnL8ahloNHP9/x1LuvTdGt/ShgpKnZ6qiHYb26EnRmaA61sx6xnllsZr1q9peCVARiOvp5D9ulxOjHVbPnGY9miBvt/vbOg8UughKr9CJvvjJVu/R0nPpYsVc3gk43Nex9MANwSsQCI7EHcEqJewAFQjjf+eX/LfRSW+voWrBo27KzF11ajs0DT7/31raB4d3XwdRSD+3puhE0xprDnOgBmEqEmO8r87YptGP3rHn12TnlEPV3L7s+dnHL7E6YZeO3mLTRrdbLUPO7X+pC0Ka1cyXEnEW0rVdt/8WMUkS9soIr+X596MPtP/z1y1fDVAJB1PROcsS/9jHZZSLazOsXf+2zJsuah8OKIJofd2t3l8i5cW7rju7zOhbDrBiGzY+RpzpvnwW/JqkLQesW5QseSo8y6AqzZHZ+9Lvoxjd3BMkD4mb71wpvuBWIjuzd239BuqdILQ/jMbiaxmRRvmhq3F+lXSamosmlkk2NQsQiqO9p29Os76nO27qpBql5QZu8ruuRK2/ZddZp0y6HWRW81NLVqp1zuXfnc/t1E0RodtSkNmoy0rncEfsJHo1sKUwpQjA/vuZPWmBWDdFB/MttA0rBZBFDdLd9OT2LWC2eP/BurG+vevy8Vl8GWQeC3nwIXgBOyskQjMCkFhQ8etXXdsw2X2paFkxuuFodk64HQXN4rnwP47qLyjyuq8Imvv83yY/eefw3u841WRa64ty22OIzz24pw24XT9z5Uj/+ugNh1OTwHeJdu5h0CH98zZ/GqyAWZ+vUf+974zwTEcsQU+M3zz3n9Vvmnze9CvGl9Zp3fUAYMQg6SDUG4l27mKzd6LuuK1nBDpcj5MfLvAdQ7FH8qwvLskfRFXRaX0bn9VqYUiAMX9DVxkTQT1y/DH/Lz8HRIzvMXi1QPDfOwWTL+R2LYJb9Gpv2xvu2Hti3AqYUCMMXdLU5SYJO9ryxfV8JrxfwhGiKYAx917zTpy/BYdnwmxynICaC/vdrb337NKvxPJglc4yn9vzzay+Rl/XM5WLlRVdFryxyqasMvaBr873TNS1ok07hw1fcvLUctZsQc7E7TcpFV87Ol1L51iv/896nY8e/DFMK80c5Tg66YbsV57fFbppzTifMojkVxJylHKIWQ4vdL6nHoSEMX9Ang+WxzVFO1AlTypzTpu3/4ZW3KAtPQ/Lenc9+4nU4Tuw4Eb9ReNUX51Ggeep0fERTG5tmHxk7fhCms0+x2N8qLHWh1duHP37uH4diyl8GYJa1pBbf3VEHgtbvISxlLBodwLiXDqDYA/jXF351quluGLGYCcNng717hzq8LGgqJU0PDkX36PoB/lqOk8TyF/u7OLf7Ybpy6/wLdv3Fwks8L07anTwYe+i1l1xr/1zEir7QxdccKXYPYFbYj731apAMyDx5ZsBsgTMG7eY42s+aONbuq3lrXtCCO6KbR5ASZcF6rdFEO/PuV34+w6TdLNaLlGsPoNi1/Q+DUaPXERTTPzB64tTwb7bUh6BjT/eiVllBCjI12nyYRhju7qjIWmYvexR7r+/abxm+HNL0idNUwz9vUReC7n65v/34mD0IU4npCIGonXWjAAJRM1dqJZ+pqE3jIEZqvrntp2fBDMApqN3F/YK6ELTApJYWmIjaZL2waDNjBk/ZsSoVk93aYibx3675Oiz3JpcQs+mwYy3XzoK6EbTJJEuWjKgvhSkt4L955WdJXeE/fl3XfpM3LZVK79uDO174QP1yGtUS2ZHRoy///a7nv6JLT5rarp0FdSNoAcakw9zg3RyC82fO2vOdy66n5oKfkzAZBTB9zJcDk8X4Yqhw9cTfTXRWAm40HDUhTsmmFqu1lt/JIagrQQsw4hFHqtpgGiFq667WRa3ZjpVJc6PCS1InYNJBfeL6ZUl4Ik5JNFVef8jjrwHU6kRKIXUnaKeDeNyOImXGhSmYO3Xam7fMO+/3mL1T7jRxqQ0rysHRIzvWvvrMYpiuiBvz8PGjTS8cSIgnTgDOGIigJqe5ZSAt9YfJKrxiUbVXK8m3Xvl5UjfiUQwQQAxiDlKdgPTUJyZvUyqG//ijW/eYTmuXE91yz+Ko/U5gIXUraIEzLW7bvUhl2Wo2tFXxt/qYtO29UX9iFtS1oAWZNnUvUtqGw5I5WYLe6eHlNTpQ6OvQzAhTHYK01T/i7aRjh3lYtypPh9fp83JSFkFzGmpqsrpr8QUypkwKQWcRnUWy7TBXrJ/WUZM1NMaYGaNIvdbKuUwqQWcRwuZ2KoTkL8WhJ06WoItqQ3MatiwK1+IbkIplUgo6i2iKpD6xu2zOu4izIHKjBR8r+c/r/mxP4exiNTAd5UCBxuBFGxutgXpuWrjB4HwypGtu9fj1yRqH1q4vEe3jFitY61PXpeILugBMnSeQKwtgSjlVZwoR55pdlF9OfEEXYLIM1cui+nJgspajVl9/W258QRdgMsNYzdV2RpsNMIrxVPD2AKxJjy/oAkzXVVerlu7dO7jjBc2PddbqW44qgS9oCSbNDrGe+v62YEVHO8x+DwXNjRrfZVJOfEFLMBntEIglm7dptnMVi+m2KRRgDBMmQfJxQH74yFgeU7+RKYt4A/9N887Rfs8LpmIWMMuqi4X55cIXtAumtbQgU1NfClMrQB1iiM78vdO1+0KYSuELWoHJa8ayiDb1mkuuPeLlZTYFeNsDCPy280R8QWvARIunPYri5yTuvvjKqabT42JY7lcHf/f24x5/1qJWf6Wq0viC1pBZTx1FThmLTSDelyF+BOjKL86jWVNOn46P6PTGxtmfj40dhElvjXw48sz7e+fqXpoopz4X55cDX9AGFCvqiuCv2VDiC9oQZzuX5i2nFccXsxZf0B5wpsVtiiDXWnBYZVhf00wW8sWsxhe0R5yp8VF7ADnXhsOqgEJah8mTMPloQV75FAMmXsLc8LVjRcNpuKnJ6vJX0ZnjC7oEnNr6GA9DeSuonHBKkkVhf32zd3xBl4FxYXPehRxtwUfFgU6fZVGkYYY14LeVi8MXdJkRU+Zk20HOSYi7DR+5I2pixqPEWBRNiwF/1q90fEFXAUfkBfgLiiqDL2ifusIXtE9d4Qt6EhIKfbeVsdQCmNTT80gMXt3A4HwmCaHQ37Vj+r6HEw/SCUaggohFM9dHIuGaH1nxBT1JCIXWanazs7jFZiypFVHfszK0Fd4EfEFPAkQTw+bHBmEG4NxhrG9D5EfdVANA0BzeBHxBTwJWhb4dIc5Xw3RgjJKc2AAGwtsxFt6Gj8axWPPCSOThBJ3i+IKexKwKrY1CuJ0wHSxmLYlE/iVKAP8bwP+WwnQQO2EikUd7qQqEQqFAKsXaYHoG/YAoSfAFPQlYtXothzfOhvWPjpf7hLY1o3UbIo+GqQrcEwoFKUVbYZaN8YT51C+ohaOo0jphOuTW0KtXr+3nhGn6DNWsoSHoLgi6H2bZ8AU9CYCgwxD0AzDHYcSieGy3ElEr5WCxmbOqNdJxz6rQhHiVCoPzqXNCoXCA0+EE59SCQ3cYW49RjhCsquAL2qdonEkVSkVdRc0ohrZzkKrIypWhbk7UTWXEF/QkwhmPpuOoFfkKHKZhNGwRRdBujuCo5vEkaPHoSrFkWwOfMlzJsUpRm0Qij8RhVhRxHaJpiWq1GatBtoxgOmzs6YnBm4AQd7FlKK5B9BnOP/XKiMHlIQKw7bFOzlg7EToNnOBTAG4CODnOGY3AVNLAGte4JV5kjm0nVyCcLlwrSAU417BY38acGmQlhpryapkCNq7vWQJvnMw1liJNQcY5Hr1OmgoRaxrijNOAZU3ZYlLYq1atiSDebTAngHCGNmzoCcF0RXU+2rMizb2kQKRLiJelWJAzHkT+tePjAJwMJ33wlRSWVVoPKeSde/hMlBFjyDs+gDRvwUeeWLlmTSdLUTvCCBLxAK4D3wVGUcZZ1LKa+2RlhLikcURi8x6YEyJcKg1Ww5LsMFEuq1atfQA97RDMAJyK2MYNPUHKgPPCOO8BmFLw3fF06b7rCmORjesfXQPLlZWr1kTJ/Q2leXGWoTofoxDrNmx4NEwS0iIb28TlN2ZJZMtKXCNlj/Xjo1byAIO4Lavxrtybwg3nhiZaATMA5x2Iu/AGxPXTFF3wBjRYLbMKHxmZG2gTTBPyxKGLK747ni6VaLQw1gtR3wVLiibsvDjLUJ2vFvTfBlN2aivMsnNC0CVdY6TBakQ4J4QmQ5V+D4xgrHFN9mnG4Bx0IikFFOz4dQRFZFaeOHRxxXfHr1dyplnsrmxmFaIJOy/OMlTn17igEX+Ko/nRAdMVVfq90mBZyyKRHw3guml0IikFFOz4dQR41PTy9KPGlDxx6OKK745frwyZlkB4C+FPQBN2XpxlqM6vdUE7KCoDgSr9ReCUE4PhIBFJDE5kbJTy4AGebrt1wqkYhkswONyp3ZQDErIPXivJYJREh2oARoLG4QGEEYLhIIlrHkgYg+eAa0XpRFxjcLhENk1OWrpgLIBzJVvIVEBB2IVUU9BOulxhKC+38ec0w3AJAg3WlG7R2cq7BsoE58cZal0cjOATHPJ2eEvhVGxBHnTBl4L0D8BLh5G5BiyYwmcjMDPwVk5OR3EBnDu4gXBumlDo210pnNhADVFd20fgdBr4WJRcMgoB90GE3SQBCeHw5KTbQxFYrngSNNrqDU7mzEC6wvAnontiuIkL6YiSiyBBBQWNvKdU0LysMBpiJ6NE8hEVZFYcZZXXPBDDeik61tVAzQNC4CTBiYdCAwLkAYKX41VzoixV/S5cqA+ueJwI2XY/TBkjSMws+BNAQXJ4Utxqw1y8CNoUxClB7jWAVJw4J0ouggTSc3JRna8SdDHk1bgSZB13E3RlYVKeXkDlE+FEq2HKSHgu+Fx0mYQClYaPguTwpJgUpC4T3a6rAnGKkou4gFScxZyTCwpnkKebbxMwyQevIL64nJxihafTQLHhuqEre2nBO48bNrpADNiTAkwKtGKCo5tcQHtsoexxhYwdgLcUTgrDIxB/B2A6WBYbEj1YmA66REFICMIbiFOUPIqzmHNywfkcnhQvgs5OTOCsAA5dQZ6FyYVShKdKh2m4QnO2PdqGNLTj0JXMBE+QXMgreBFoih/rgUi7cFgybolJX2c0joi14NCEPHH4ghZ5iHYxP5wtqwBcSbiVlQmqdOjCFTU8ZiJ7EEA7DktmvOB1De5iUCXGpEORQ544JrughQjwmO+HGYArC6qy0qFKhyrclavXbsIN2U1lxCn4SohZoEqMI2h7bCtMk0LJE8dkFnQm3wZhlhVVWelQpcMt3EqIWcCcR5ed3AfbRFiecEuM0+SwR0WhmF4zTxyVEDQ6aBHu3nvOu34WFGSUqixonLMPXiuVGbeyMgFx4vCkyMKtVAUqYAg8hMB7YKuIwckQgmyDkyJLjADi6eWKcV8QQ4FGKQO3MAuUM+NUGUErw5SKEwUZpSoKGmVlIoQhuBE4GZ1wUtzKygRVOmTh4vsD8JbCqYjByWgl9+FVCFpdKEMYnwy6jU9m2nJbYUqRJUaAa3J4UhjRegzyh2C6ohFf3QpaUxEMY1QJZfVwglxQXc+trEzwGq7q+yi4PstqCblpTlNOjqA5fCnZBR8wpRQj6ExzYx9MKbJzCkHBRrhb8wBTqBvX9wRgeUKTUVJxIu+iVEVB4/tRcruepV43IcD5HJ4Uk3x3w0u4uj4AbsqFqptSU046QedHppDiBK1LkO4m0rb5lesH3NBklFScyLsouQmMKIGnW4dbTaPLB6+CluV1ITifw5Nicr4bXsLVa0Y9Y6kpJ7WgZZmaiz5y+YnJor6m+wJxUbtj8L0fJ7fjUI7BWhAZmowqRtCCBNITRhOqD/Y44qa07eRWrkiH7MZWXY8ZNNVwPocnxa2sTPASrihD9RN6Yrpz0ZSTI+gouWSSA2MDzFkFxUdwEMAnmLlLb38pQdAD8JbCqUiglBKUAXEIcKJ2mO6gudHAprSLuJFHNBlVrKCz5G9/ctnKlIvs0atsaglOlBUca8cnKKuGLdnKAfHF6S4UWREIVOHKNIDvJ8i9Y4e8Yr1IxwjscVCxroOHPFCWEwRtNsqRRzaSxQpad16x6J4oKjQZVaqgvSJtNmkWg0nJLQPEl8OTUkreqcLNvX4W3Ji9OGEFTGOQHwwezlWWU2YcmicTZDZj55CNpE6Y2e+RBCRKXdt4Rzkio0OTUdUTtOYpg2vG4bXBGZFbBjiXw5NSTUHrmh0ykP9mgoYzHd8cJxvJUgQtKKOoYxBzV7FiFmgyqhhBD8G1wXlDM1rhdCbNlwzklQHiy+FJqaagBV41h/x3tKopJ6Qjg5NR9tgAzAVwSrKRLFXQAnFd2x4LcY+PoAyolRtCumuYoMkoz4JGvJbAI+RPmFy+U8Awzuk2SUumhuslg3AR5ngZIL4cnpRqC1qQaUJFYC6AU4L8Z/B05YR0FCDuHGaPv7uiEy5LDG4ECccoxMyIqA1Fxtr2sW5yAZ3HXrdHpwxxg9i2HUSEgyTI3zo0DJdgcNxi0QZqjnoJW0f22iShcKYySzqvqJUkZPMIJsIWN22qK5OuVjpRgMNwcdTKA7LwdaTDHevmE8tqCE6UVTS3DIQYyAXLsqJuwtOhDvfE9d1I5yMP8nTedMJlicGNIH+iyJ8IbKTZvZwEfwCVfVqhpkHWQQAAAABJRU5ErkJggg==" alt="Siam Cotton Wool" width="90" style="display:block;border:0;">
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:0;padding-bottom:0;line-height:1.2;mso-line-height-rule:exactly;">
      <span style="font-size:15px;font-weight:bold;color:#111111;">${v.nameTH}</span>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-bottom:6px;line-height:1.4;white-space:nowrap;mso-line-height-rule:exactly;">
      <span style="font-size:12px;color:#666666;">${nameEN}</span>
      <span style="font-size:12px;color:#cccccc;">&nbsp;|&nbsp;</span>
      <span style="font-size:12px;font-weight:bold;color:#1D9E75;">${titleDisplay}</span>
      <span style="font-size:12px;color:#cccccc;">&nbsp;|&nbsp;</span>
      <span style="font-size:11px;color:#999999;">Siam Cotton Wool Ltd.</span>
    </td>
  </tr>
  <tr>
    <td colspan="2"
      style="padding:4px 0;font-size:0;line-height:0;border-bottom:1.5px solid #1D9E75;mso-line-height-rule:exactly;">
    </td>
  </tr>
  <tr>
    <td style="vertical-align:top;mso-line-height-rule:exactly;line-height:1.4;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:3px;mso-line-height-rule:exactly;line-height:1.2;">
          <span style="font-size:12px;color:#888888;">&#9993;&nbsp;</span>
          <a href="mailto:${v.email}" style="font-size:12px;color:#1D9E75;text-decoration:none;white-space:nowrap;">${v.email}</a>
        </td></tr>
      </table>${phoneRow}
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:3px;white-space:nowrap;mso-line-height-rule:exactly;line-height:1.2;">
          <span style="font-size:12px;color:#888888;">&#127760;&nbsp;</span>
          <a href="https://www.siamcottonwool.co.th" style="font-size:12px;color:#1D9E75;text-decoration:none;white-space:nowrap;">www.siamcottonwool.co.th&nbsp;&nbsp;</a>
        </td></tr>
      </table>
    </td>
    <td style="vertical-align:top;text-align:right;padding-left:16px;width:90px;mso-line-height-rule:exactly;">
      <a href="${cardURL}" style="text-decoration:none;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&color=0F6E56&data=${qrData}"
          alt="QR Code" width="72" height="72"
          style="display:block;border:0;border-radius:3px;margin-left:auto;">
      </a>
      <span style="display:block;text-align:right;font-size:10px;color:#aaaaaa;margin-top:4px;white-space:nowrap;font-family:Arial,sans-serif;mso-line-height-rule:exactly;line-height:1.3;">สแกนบันทึก contact</span>
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
