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
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABVCAYAAACCViA6AAA0r0lEQVR4nO29eZjdVZkn/p7lu92t9iSVjRASwIQ9QbRFE1AREJFRKyKiqPgECROXZnq0/5mqcn6/p9vup8fGBZrMAwqoPZ3SEZHNljYJEQUMDQIJSyAJ2Sq15N6qu323c847z3vuvZWKA4joQBL71SK3bn3X8553+7zveQ+DY4RW4xZn9/ZRfv+JF8f0+7WbN3dU2di7AOB8YPxMbfQCBOjgwAKDaBiwOjB2QDD+vNHmN0bgA/987od+Tef2IYrKfffJz1SratWqVRqOYmJwlFPf+vUC+vpgiDHLiCt/dPsMNiN3rhH87Vw4JzKB84wyM4zWBUD0OYI0AAgMUiZ4nXFZ5JyNotG7QJvHdRg9kj6x7zdD118f0vVWb7nZWbf8mhSOUjqqGdyP/XwABpAxhld95zt+Mq/tNLfT/wAocznPBIuk6wJoBSqMQSUJGK3BoLGvzTgDx3FAuC4IzwPGAaKJMnDON5hUDYWjk/cPffCTOxs36ucwMIDAGMJRRhyOYnrkvk6HmEtSZubm3id89vdMyr9mrrMoqVShPjwC4XjJpLW60XEKWinQ2oA2GowixkeYVmq6PjpuqgfGABG0DPyVIOXf+Z3Zr3z6gTuW2Btt28ZWDAwIOArpqJTgfkSSKKCfx2/5u2z78QsukZ1tXwIhlqk05ag0cKVNohRUVQKp1kxwzjwpQDIBBhBSoyFViowx+kJiVjpMCgdRCsE9D4Tgk7oa3l0/ML5u/WWfepCkuK9vqRw6ZVUCRxEddQzu7+/n25YuZev7+szAwAB74byllzi53FdExn+7jlOTlCYjw5kToZKkh9sdD3r8LPR4GWjzfAiaDK5pBaU4hJGoCmNxHeoqBQeEcQ0k0nW405530WCMUbReRWH/9961ateF2+917//+IykMDpKqPirUtYSjjIZnzxZDq1alNDOvuPu7Z8lM5tMin3l7WJwwmKQJkzyj0YDDJMzJ5OHsrtlwSvtMmJvJQ971wCFjCwiJMTAe1WFHpQSPlYbhqdIoFOOIG8l9NMbUx4phMLPL55ngEkjiPZ+8+7s33v6Bi/et2LBBrgQwgw0mH/F0dEkwY3DhPfd49198cXz9z36W3e9O3uDkslcwzoOkHhqGxkTGSJcxWNm7AFbOPB7mBHkIpAOCvfyrJkZDTaXwzMQY/HTv8/Bc5SA4wEAiI3usme+6abVWBDBrfnDuR/4FEAUCkKcGZP/hCKejSYIZGMPzAKpv/T8E47n621wvs1LmMkE4cjCUnHtlpWTB8eDdvQvg/FnHw7xs29TJBtHqVPppsZozBi4X4LoC3tYzF3wh4e59z8O/Fw8AE1KwKEo4Qwi62jvjicr7r9rww9/exviznAH8t1/8Nxo7BUc4HTVedN/6Pt63daugeNfJzOpVxnyYuW4nKqU1Gh4bxRzO4YyOGfDBeSdb5qZGWwlVSCEyswwlSebNH2I6/T02ipQDnNXVC++fsxiOz7ZBgvZ7R2iNOk4U4+xdqdGX0BRBRHhkzjniaNCARwuD2Y5SB5+1ezcjJwuy3kI05j0mSjqwHoMBJitpwpYUuuE9vQuhzfWnTnR5w3MmqSNuTP8hZtPfHSYs04hOaZ8BF81ZDBkhoa61YAZQ1yPGhZhvgC3/zDN35hGRhU7A+tavP+LH78hW0djP+7YulbN259ivZuwx31zegCE/cd4PZ6DjHM85h7geaoPGIaae3TMHTmzrBo1opVa8RgFjjIEyBiKTQiAknNk5C35zcD88rg6wmlIoOTNBT6cwaHrDkfIs9ha2vR8xKT7zDWftvffKeMYec/Oy1epItMlHJoMp5ly6lA3xj+ohxKm4k9CqqNfvYa44lbtSAiAmRiFwYL2ZPMzOFKwdJZKs8S+pYWLgK7GaLDNxxSFJhgaWUXA9OCHXATsqEzAW1SDPPUBlkEvZw8F95+U/+UF5kLERALATjuhmXM37EdkgMIJBjxhGH5EM7mvGuWzVKlKdbNWeIT93gPey1D3NA/N25Ow9qA1xjxSvaDCQwe7aBMwOKObNAiedDA1b+7vOVYtaXGjpWZoMsdGwo1KEShqDYEAsJ7HkSbnKjNFz0JEfdXuctk89+uNHeMJ2vZi2jW467zxtYcx+ZDDwcnd684gdgSAGTTo9tGqV7lvf73qzTr0YgL0PpDxFeG4vY9Cu0ySnEuU12Ub+MXOZAF8I6HACOC7XDkvbe+D0jlnQ5nr22hT3yqZzReeZJkOljYsB9tTK8ERxGJ4tH4ThegXKSQQxGlAN7BoZImOcI/fcSEpZRKMnVJTu5Rx+BUn9p3esvOJxug7FyTPGNvKhVYNHBOJ1xDB4xYZ+uXKjBRDMiv4Vsvfsq5d5XR0Xcc89X6XJchkEgXQdwDQFHYagktTylwtOmhpSY6CuEoi1hqz0YG42D6e2z4Szu3phSVsPCM6BABCSdFLKosnYYhxakOOx4n54dnIcxqK6tceeEJBxXHseJSjQGODkrAUeOL4HKDikYQyo9T7uyl/F5eovYKL0rz+45OodjffZIDeuXKnfbLt8ZKhoBHbSumE2OLjOrNjwHb9XZFe6jvs5JvkHhe+A1inGk5NpnUa6MV4SgVxfEkNtARCSzoLjA7gAsVawvXwQXqyU4PnyOFw272TrOHlCTtlkIoIqHxjeCQ8Mvwj7woqV5rxDaBcDCqyI0RRC0X3sOSZFqKSaVSqGfheOy6Xvzhae1yec+N2iq3vhVRt+eOuujU+9sOm8lXqgf4DR5Hszs1DsSFDLGwdW8pUDG82LJ5wQpL3OB91C7ituIXdyOllxjFbANVliYHWtMTIKbL4euLWdlsdAqpZZBvqi4SoRI2sqBQ0IM/wsXDJnMVw0exFIwa0UkxoeeukZeHh8L9RUAhnhgCMa4ZTSpA1Sq9abE8pOIgql6FfJOVIY5QiJyJDuwZ1sFqSUNVWu3R2NlL/9L//pE5sBkfVtHXLezATFmyvB/cgBBgA20i8bOT/+zAv8wPsv3HNOVVECJlUJGsMmdcITY0TBDdiibBv0eAEUpGsZoo2BskrhYFyD4bBqpZJiW0oydHgBlNIIdtcn4e59262EXjR3sfWMf7r3Ofjl2EvWmerys+BxCbFOYTJJ7MTp9rMwy89ChxtAIKWdSKQZSkkEI1GNjUY1mFQJ5qQ0LuWuapFkuWxWFHKXBlKqK3/2v0rfGxjY1vGBDyCp603nn08z889Lgpdt2eI8tny5rZb4xL9+fwVva/uy05a/KK5UlarUYxQsSBhysoNzvKy1pRS+zM7kLQOJwaRGKyqxzN1RLsJz5YPwUn0SQpVaDNrlEhKjrK1dnO+Cjx1/CuyuTcJde56FqkqBoE1XCJhMYzDGQKcbwAn5Tji5rQuOy7VBl5uFrHTs84ZawXhcs+fTfV6oluBgHDYgT4XKACSZGd0BoCnHB8vfE0r9ze3vWbWvb/16d6ivL7Vw2RuchWJvpmoe/sBsQeUwa5+/t1A6EN0kssHHdJIgKIPaaJaC4ZxxOKdrNlw4+wQ4qa27CTE2UKjpRGqaXOPd9Qn4xYGd8ODIHigloWUgnRNpbdUvMZDUfCVNGrEv49Y5S9HAwlwHvKd3AZzTPQ/aXX/KVrfu1OIMqWrKM285uA/u2fsi7KxPgEsJCvK2OY9kIRvoelzjBq5d8K+Xfn/btj62ZMkSpDQnRQfHPoMR2erH1sneZfv1nofOzKapuoznM4NuIXd89cBILJmQZZWInHQtNvzOGfNhbrbwmi9PKnjz6B74t+EdsK9ethJI9jnUKcTkDQNYQERyDjWlrOQuaeuGy+afDCe3dUNWuq/pPnQ9cuTu3PMsbDl4AAIhQGgMZSETUBlQVKr8q5qs/f/rL7nyQRrr1Vu2yHVNjfVG0ZuGpZb8DjbIBk0lTWYqNFcwwWaoWi2lCKaqYp6RDrytew68r3ehZS45TbYKwzRiUwp5CJJs/Bj7PXm8dBwl+N/dezysnHkc5KQDIZXnGGNts990xEgz2NBKp7Ag1w6XzjsJlnXNtswl58rex7z8fejvlKQIhGOx64vnLLYTJNYGIjAeS5ROw0gLV75DBN75tgIFAJ+rVChTwY5tBjdfcHSsx9BnyfkJzBXLESGrqqENUUOt2dK2Hnj/3BOto0RMI6Zalcq5dZYojiU13fjh9nuPU+TUyBC1OR68Y8Z8WN4129pqUsm22M6mCRvAR6SVddjouLO751jVm2hlPXJ7H/7y93Gb37cm2pmdvZbJeemAAuSU31JhLNxcJiszculLD945h95508qVuu8NHvM3nMGtFyR47xMP3N4pPfc06QftkpyhVJsUkM30c3B6x0w4Lttm7SAxuFGJ8fuIAWONMEgZbcOjFTMX2H8p/deySCS9lIwgaTyrsxeWdfVO2XE2hXa9Oh1KOTauujjfCad1zLSOXTWJCT/VgsIux1uolXrbhTfc6zXi4a3imGZwx2OPte6JUWzmAZglXHLgxiCpYJKKRflO6/C0cGSilsPzakQTgbAQK21NCTyzqxcWF7qsdNP16Tok5XQchVpv7ZpjJxKRaE4Oksrf5+paTdCcMCT5BIme0TXLOmehUoywcJ0oNAizNMczuhYftJhpZuNv+LEfBzeRHeM7vYgwz44XaqZBM8EkLMi1QY+faeZ52GtiLrakqjno5ABFulFVSX8lySKbykFYe8qRWXBjIomBYlqyzeTU0aRoXe+1pA1oMtHzkX0/PtcBXZ4PO6j4BIHpNGFodIdhbF7kZBux1p8T0CHRLTDDutEggVUU5XDyRIm5BZu0Zw2Y8FWugdOktxU6TSQRPD0xCr8tjcCe2qStmiSi/HErse9ICaFJ4a69z8HD43us1jizoxcWt3XY2PlQIrGRqXolsggmTRjGLHPJ9kvGmNYGCRJjDAJA7M5l0Krmek/W1nMdswwu7dgxNVoOgIcAAfHQkDGj7xhvAhQ0HpRafXWy2HJTkghe3DK+H7YUh+HFStHGweRBU+KA0seyyaqpSWEMjEZVOBBWbO73ydKoBTje2j3Hesd0NKl1m3F6xZxyQ+UTkfNFiJjgrAGfGkTu2MoeX0jPqobK7uFWQQke+1AlN4fec/o/OH3YXpn0NKk9EFbh4bG9sGlkl0WYCE/OOQ7kHNcONsGMdHxDMkmVU1EAt6EOTZJyGsNYXIOd1SLsq1cshEnZKDqfpL5x1qtPt8ZUa9rl5neMQHRKXBTjNwVzeMMZ3LFw4RTfDMNYMAhJEfMmp8hOWqBfa3BFAwNuDO7hNL3ynICNH730DDw4+pKNa/PSBc9tJJuUXcXQiGmJka2zKHHYipnI7pKTxMCziYdHDu63cOSH5p8M7+5dOKVNXp7J5Hk3PtEzk923Np6+5IzReijyJxm3CSrIz+99Q4vm31QJNiydFJAZZ5wbDmSjECmfS3jvZBJZwL+RxTn8PBpAGmiKVylR/9M9z8KDo7stJt3h+OAKyv0CVNPE4tAEdvQGOehwfatCicj5KkZ1GE9CSJSGrHAhJ0jiPTBpbFc83Ln7OYiUgkvnnWzVLnn4dM/pZDNMxD1Ei3eXk5iOQ0dwlFIIleo6chxjvGoZPMvNvaGS/IYzuHdZ5RC7QrmfZdhLVh9zgYIJQ1KyszphHaOeINeQ1EZO1Z7SULMNsIJs7C9Hd8MvDuyCCJV1zkjtkrqlidLtZWBxrgMWFjptLEy1Vi0wpK6Udcb21idhe6UIL1UnYTyp23ww4dXkhe+qluDnwzuA6r3O6JxlkxItm9/y7GkiSUoxooEdlHxIQkpXGrLawnVQIZRYBLudoM2mDMv7Ro5tBm+DsZamQ12Ve1kX22ZSBcZxGQ0gse+FSslivCe39UyBDlMnUZlNszrj0bF98ODISxAZbREvwQVMJKFVgBRHv617DryjZx7Myx0qgP9dItRr68SYnShUSUmTg3S3TylHz4cDUdV62nT9kwpdoK1ynxafN3/ovk8UD0AxCW3IZT1rx2FcqWGO8rf7yy9ZBo+EM/GYBjqGoM+uv6aF20N9fSVVjZ5SUVxSWoEnJXOAIdnUx4sHbPGbZSxj1r61whGikbAGvxzdA7trZWs/SXVWksiqc0orXrXwdPjg/JNg7qswl4jsKyFQV51wOnxo3lug189bB4smTc71LCO3TY7b56HvCQWzz2O0nWT0PKRVKH345MQIRDolNc+0AW60AYySnRDCw/df/IXE1lMHj+hjG4tughyVXE7SZxWrFzHVjzLGak4uS9VtOhASn60chHv2bbeMJP+LskE0kPQ/yt3SgO+qTtiKC19KSLCBLVO++CPz3wJndM60HjLR9GSBmvbZ/msayBelFc+btcAmKTq9AOrkLBm6tmOdNJLOZ8vjzesRjN4o2CMG//vBYbh/3wtQoRWKjNAazkTgm7QeVlQYb/3+I0/uJyU0ABvFppUDxziDm5SvVpFywtkkGBUc/xkM7ueZwAUuTM7xDHnDD4/vh58P77T2sZFsaID8ZDsfO7jfJuCJMSTd1TSF2UHBrkk6vXOWlbLIerQNKWslC+S0z61lLCSNxETSBO+aOR/O7Zln43Fy9EjCyUkj+0qqvBFzc6uGqSToydII3Ltvu/0bVXV6TKTMc7j0HaHi5CGVmg22OwCVCT2WJ9jr2FbRlhhDqnCgEtlbL7us4pbKd6W18NdJuQrCcaiHBuS4o4mp9+x9Hn6w8yn4bfGA9YiJqIqCmE71ViTZCalCRHhrV69lDlGrmF1afPnVHqWROSJm0/3IGTt/1gKYk8nZ3+m6hGyRh96IjxvlVVQatGF4F9yy/XF4amLEagthqNhSIpMS0lq9ysB8b/0FH91MCRaqI+tdtuwNb+jy5oVJNJPXr7cfb73ss5Ur7vneOiNEj9/VTiU72tTqkcuYHxsjHi8dsIgT2db5uTbYXS3bchvyiBtqt8EYcoJoDXDL8+avAcO2j9KMiQnZon97Mzk4udBtQ6WaTiErCFnj1lw8MLzDOvTkCD4zOW5rtGgSScqVMJMGXZ0ZnaoyhvF3IYp/Qe/ZgVs4Y8vo4m8oTPmmx8FDfX2KHI+VGzeKH5x33kOf2nzXTXG53Cs87wwh81ldq6dZxrCsYvbc5EG+P6yyGX7GqlMqhyb1SQwgn3ZBts3GzS38mIj9Ac/S8IYb+BnFtYRNPz0xBi/WSrZSgxIRVAxPVSJUED8e1yFKE2x3POMyodET0sl4DoKpYqJ+wlP9Twsv+sTI6i1bnBLsMADL4c2gN3d1HDs0o4nRteHoAahE/12H0ZPCcxU6QioGIu/40OVnrOLdWyvbGNlmjnjDfpISnhlkIe+4U6HU63ocaDCZViPODHI24dFIQZK659ZEULltMaxDwCXMCLLUy4MphpJnfM6Ax2qifmd8oPStOy742DODiEjY+xCzdVj4Z1n4biv/EfXAxo3UmiG86jvfudcs0GVl8LNc8D6/p4vreiTSepgKBPQYR2AWjqKV9o3QSTALUFApzh/3LGCJ7DE5VrTS0LpE9sdmtlAC18wmvqgKwZWu7wrp+xBPVEaMMbeYau176vY7n28mwoBRNeWbSG86gy0xhhs39NvuOYOMRQDwQN9Pv1vOdnU+o+vRSqXMGTKbaQ9chwwlLRmFNIrJdZnChl9tBeHroUOZZXJ8aQGFBsYFy+QCKT3PQmlpPaRVhzt1PXwM0+TfsFi5945Lr9pNZy3bcjPNNlpZ/h9LV4g2nTeoNuEAVR5aMVy3fPmjDODRKzf98GHNxEUmZctUnMwXjsgbMBnGmWcHn6plESBSqU3t/SkIKftkFKS0grGVlW6uWlNGxyYOy6CwhErtYNpsFnF8J6lkOpZ6dsFj9PzXpAyugTebjgwJbhFjuA4gte0Jm5oxGjEPhAvdzd013QUSluh6+nbB4SLhuWcDrRCyVdRGHoxCGwvPCA45S38oNeqtwYIfB6M6VHRMaxcphtXS9yUaVYY0/hVyfrfD3UehDvu1M1m85YJPN9YJI7J1JLXLj5yF4EcWg5u0ZOtWtFAmedqNQnEqyaj3Y/++F+5btBUKeZdx/lbOGbpSaA0oaTXDRBpNZdJfzwibZkqQGL2rNmFxZcmFTQc7+YzBen04qUU/Qhb95I7z/lMD1mrS+vUohoaGKDJ4w0Oho47BtIR0aqX/0+tdKIOAwhI9CEsVXMz2Xr5h6CnOUHHfk750WF2luK9eZjtrJTilo6eREsTDCwJejVpxc8uLnkwjeGbyIEzEse3V0VinyrlRZkxIvfmOd318vH/DBlmcE1pN07kv0B89j6vXozX+LBk8RYODZmgQklaL376hITkEkIJJR4ziL2htTnZcV0ijdCVNxG+LI4ywaErtEWNTo0Gw31+l2qrYoLia4E/CnUmCU5Vie5ADTfFPuQpJPdzX2S0IV4Zi+KToXFxMqXgfjmA6shk8nYaGAJbY3qCISbxDuO7Phe/O5IwXWL2mc44ntpXHoTC8A+ZlCPTITGV9SCqtJNv/H0o/EmMpn0u/Nao2AJ5qYss1nUBGSmU4SJEJjE6SnaD0lhtPubxqD1y0GAbh4iNPZH+Hjvg2QC1av2qVGVq6VJNt9g/AAenAjzFRY+BIAUKgy6Wtq/7txAjcted52FWdtBCibZPEG2uJrX2eqq9qJA0IgqRjUq1tAuP+fdub5wpwmVRGCsY9RwKazcDM/c2VGezJfQHNnP9g8J+KmriBoTTjbZ/+dFSU7iOqXN4UT5RjN5vxyUHKC0dTBun+/S/AT/c8Z7Fiqu+ySYOmfW3VTreS9iThpTiyC8H/eefT8ERpxKJUEkGB60nuOBAdLBVZktzzv959xVYSiv7+foJXj2jVfPSpaCLGcP6WLXZg715+af2T9373WxgEPW4ucxktOzWxSVwmAsoyPTS6264XPq2z1zpe87IFW7Lj80a1BS0hHY9qtnLkieIIbCuP2TSkIyRQQyyDEHltuSyoZNIY/LauFTfTfVds3GgVwZQjeITTm97C4Q8lwqwH6LkHBqy3/fFf/Oj9Tpv/Fe7752qlIZ0s18EYJ9RaGMY4NUijBAX90GdKL5KapnwzFcmNRDUYjUK7Rthn3DjIE+ZK4bXnHQBWw3p9SIXhV7+3YtWuC++9wT3nkWLa7DR7xKvno0+Cm9g1tRBcAoB9uF5MDoxvaPuLfCA7WcAz3mkiE2QgTaFgwKRamcm4DqNhxaKajR4cjc5XZHNJddP1KB3YKT2gFJUR3KeG4IzzCV2t35UcKK7750uv2mlbPM3vxcGLv3BUSO5RK8HTiWJkanDSv369u3MmWwnC+Uue8d9HjErrddRJaqg0mdJ/RhthM0NNY24L3zlHWiAIRpN/zXkmME4uK9PJSg1SfYth6Y3fP3fV8yTxq4aG+Bu9Ov/PUoIPo22EZdCeHCzp6+/fKN6xsOhK/msu5GXCdc/w29sFM0ZQ1aZOUkoYGGTY7KTEmeMIwek/rkMTAOJKNdZRdB/X+m5drPz8+81NOQYGBvjQwMBRJbnHhAQTUQZq+LF1ttcH/X7F3d/vkAX3/cidlcxzT2SumIXK9KBWec4Fbd3QgCNtAIwxCDHBhRjTtWgYjN6io9rP923+n5s3DW5Src57Q6teUxsk6oTLtm3bZvtxDAw0doP5fz8Cv+eh4BghalV0Uj7PWj0wVt91VyZqU6eAI95qEE8xaOYCYgcDFlDOEQHqDNgoZ2wnB/6EMeY3d7zrQ8/TuRRrdyws8dLXHjBDQ0OvVS1bBg8OkiNoG1YeER3hjxkGEwDRPzDApocviMiufugnuXpUz6ATuIJrhzHpMM6oEbRCTNM0TuNKpVq/+9Jr6tPPswPz2toesRUrVoiTTjqJ3XzzzbalsPX0m9vwDAwMvJHtDClGl8VikR0bNng6MYZfJc/aSt9C3lupkIqkMsxK8+fVCZEte+wxecmyCg7YtWmvqUCO9fX18aGhIbVp0yZYt24d//jHP56nGu9p7f5bDfn+WLIa4tUOoMk9OHh4E9RjR4J/h8iRuuaxm+Xu0Xl85kjACjNDPFCtNgaaIO1tALPOyBHkyIIwxPxFF6nW9nivkVqMwyuvvDJbKHQvyGQyZ7uunJnqeKxerT7R3d29bXBwMPoTrQdupKZfgWiLIRLYSqVSqNXQk1Ki46RvbEufI4JwqhIH/0hpEoODg1ZKr1mz5iOuE3whE2TOchzXVSpRUVh/FhEHw7B6z7p162zRXcNGv24E7GUlmJy6Ptq7cWgIZsyYcYIQ7ic5lyfSAgxjVHTsqOg/hNgfJ03EXFsfAMA/e911iwq59g9LIc5NkqSYpunjUogFmUzujHq9+jlu3IMA8MumBLfOez1E8OjLPjcxl2j16jUdjMMFge+dqrWGOFbqz4/B7I+3h8ViUXzzm99UfX19LjfsTNfxljPG6mF94lsvvfTibSee+Jb3GsRvoW1kzu4HAItjDw/b9g2v+Un7+4G8crN69WrH99sWSCnOQs4KURTFHEEgN4wjZxYJQFbUqM4GwDnGGA+RtvdC2vfgP+j1UiaT4ZIx12jtcCEiIeSB5cuX756cjPYrKzyM9nl4XRJL6nh4eFgArDNhGBY8L3ch5/KvueP0xmEUU6ZTcEHt7hs2h1NTG2G5Wq/X6VsyH4mcblPoMHKxOzs7WblcZsVi0c72BQsW2INav1tatAjghRcgjmOzbt06uhhO9yyXLFlir7dr1y5oXWN4eFi3jqVZ6XkeX7RoEbwAANvvuw/y+byiuJPCjHXr1smnn36a07O0rgGwAOhR6DkOHDhgj32ZseFr1649rEA6/r+fsTWI9P68WOykxSiwffv2qWeYflxfX5+g92mNzZ49dafvH77E63sB8ik8l8TRWFtH53Gu531lbLz8oUwmmF8oFGBiovRUvRbahyfQpFqtus1xhunjUix24imn+CSph+3cUir1Wt4JITIAeEKQzfS2tbWD6zjkRDX7iLUWxHPaVZWlScJIPSulPK2111IZv9tQ9fWSjQk3btz4R8V+TfjxVc+3m3UMDXG7ecf/4zizv7+fv5pztGbtF1cVcoVPpmn6LkTM05wKAv/BJE5vGR5+acMJJ5ww/lqcq/Xr14utW7fiV7/6VWMM7UkyxIeGVunVq1d3u27uvdm23F84XDqVaiUhlgkm0Daysd6AvYRr74+Q00ajVkYdZhNWrFghZ8w4y+npiYUgVK/MObTbRVmmVCrpuKfHzJ12/N69e+kfPTQ0ROjRYYO8du1az/d9N0kSMUGzsFLR8+bNi5txGlu9erWMe3tFZ7ncaL6ilDnwzneq6YD+hReu9RYu1I5SSgRBwMLQR6WMqVR2xUNDQzbes53rpoUPduMsALlr1y5er9dZJpPBBQsWqMFBWpd72ESwWovs6YEDkmcyRSwUCq+mGUgzOR0dHVKpNqH1qGhvb4cwDLFEDcQ9cYbnZN/PODsuTdL9SVTfJKV84Nvf/naNQhi7F8WKFfKkk05yPc+T5TLn7c2xlVKmX//61+2O4y/3ThTyDQz0e8Pbhj1doA6JtDIr44RQdwLfB5FK1NooxzmYlEraFHp7HYboBS3JJWdh3rx5M6MITgQBx3E0MxB1h2AsMNQMw7AqMhylLvnWnCNDQV1GQCuT4kvGJI/eeOONjVolAPji6i/2KhdXSumcjIht2q4u4eOI+tfRjucfKgWBmjNnzjkK5QmcMep4RimB8TRNn7r5G9/YTuo7CGYsAl0/xTBciGi6qQUVIldc8qI2+HRYVb++5ZZvjExToTYJf/3118+IlTrXpIb6XzLHk0kKYpsKveduvHGw2te3XpBUXHXVVX5QKLwl4/iLaGmwMSY1jNcFJE/ecMMNz7XGmubt6tVfKbhusgC5XgQoZ4PBHg6QA4kO9Uk1IHYbnRY5Gp8J6SLnSnKcZMZEiO5T3/jG329fs2bNLMac01HIxZKbWaghZ9dMMFNmjO1OU/zVjTf+49ZX0hgNR8vv1Vov5NyZg0zM0GjyDMEVCIoJOamZftEk4eM33XTTnsbEwEbLmc7OmWdrlJ8qtPvHA2KX0SqPyHK0dNbYBfEmRMSwiQwBNWD0gwCM0XFNVX6ptaadRmpr165141hdIPLuZb7jnZUq1W2MFhnfdxzp1qrVcm+9vf2FnkJhzBi4zHXlBb4X2O469Sjco038T2SOpfTfK13zMd9rW6R1OkMrnaPCVUSTcs7rXDhFAdHzaz7/l9+pdRx8qL6tPrX+p15Pj+OCX5/NF/KOdGgCpyaK/qUa7aE65mqlstlu2+N5Xo6jfI/r+he7vtsd1SMTxnEcI/s2ALQYDJ/73LU9jpO50vf9c6XjzFJat4OBAjUdoO18jKFFy6zCuV9CwLrRJnU9V7qO65QnJ1Qch19bs6Z/GPjE9e3tXcu00d1G625E4xjadRFN7EhvwnH1B9de96UHpAu3Dw4OFomhvb29NGnVlVdeOSMIchdncoXzpOBzoyjuZJxRA22fOlChwRQN1rnjlsEL9v7nz3/x0XJUH2KMvdhwsjhf7nvuZ/P5PKg0hdiu+6G2f7QPb6MXIxlu0hqGtkdnBjzPh5Ta4DMcBs8jpwallCdz4X1BOu67qdOqrYRSBnzPBy5EN3JYAo5TEEIc1MBO8IU8xaVGY4QMhmEnaCg0peYCx5FXZrJZiMJaozFas1eVojYJUp7AMsHZGNUKwcF8ctvQbZsP9bM0bQDibEc6RHbNL0N8RGtNGgvyeWmtlVLKdTxcgADLXMfNK0cBT2IQis2eJjiI6BAzPpXLFU7lQkAch41UxTR1yoDNtE9N4qxS8D0PXNeDSplNGqOl44TtBuHatrZCdnJy0kLciFQrSNUlVlDnBm7mFKPMmZqlI2vWrPnp6aefHu/fv9/ucOp5+VmIeHng++8LAlrxONmoDm1sG9XoyEt9OKmDkDRna6Pe184lOW13WAY7jkjpwQ+OJ6R0D2ptilwwklza36STI+shvU8uuNYqZYwmLgpgbB8ibE0AJ8i+IMqVXuCfRRI+MVGKuBAegCmWJkuRFE5Fa/O8x3mtVvPRz+rxKIoqWqk8FbAa1Acd7lQoPBgbK6VhvR7HcZooFY+gNhXOeQ8CzCUkP0nSRAjhCS4u4dzZDsA2t2yWEEGMYPZVqpUF1I+SMRYrpSucZ6zNzmQK9kDXdRWimUzTZLJcLufjOFbGmCL1cjmkngEdxzGIJposT4LWWDMmJU0QWW2G4BvEWUKILI221tSUwKRJEtH8qhnAxwD4sOtqEceseHB8NFuPou3GYGwQfcn5TCFEPknS2PdTT7pypor0Z5WCfddcc82Da9eutZPRPgPwsFye1JOTRRbHyV4GPKF3M8bQdsndQsp2cszIpre3t2d4HF+qlO9ZBgtmnjaa/Y0BvddotVNrM5lQXtwYJkF6IJ0lzJhrEHGJEJILIcgVf9og/sjh8MOe9s6Sc9JpxyHqRUZrW/TEOBfGmDFA+P806Md1qg33eF0IsT8OEhdQUgGrsmvH6BOldkzqElqzdu0Xf66VHgU0u3SqR9I0CX3H72LcXMyE8xEhRHeapkkuZ7dhP3H12utPeO7J37y0adMmhcLYrURb1yVigqEQdrXpYUSLFUiCCBRoltNSO9qW7Wts0CT9Sa3DH2iV/AQEvBDX9TA4kNqFg8rhjoMFNHA5MvggYyzjBYE0Rk2qKPo3hfoOKfHZeh07HIf9XRynSqd6mxEm0VpxBs45iPgZKcViRKPJmTSol7uusxAAHuzs7LSmx3FwAhDvUVr9BrXen+hkh0BhzaVSCqQUGcbYR4DB+4WQvUmSQJIkJzHGc5IMerFYfKIzbt8yuG5wKmU2nfr6+h6a1TvvdM75fNf12ujd4yShxvUv3PSthkNy9bWfzyJjdrs/apbMOXcQUXHGfnvDDf9AUN0UXfeV6wKscodLIaSUZFvBJIbOIYcLtW77leNMPHrDDTeQAz5F//ULX3gpEXCaEKK3KXGKC5ERUTp/wYIF+4jBAlFoRtXSklOsiIhSay0ch8pyDqfGbnf0CJKnacqN0Y5B6mE29d6irc0pxbG57W//9m/JWX5ZWrNmLYWmpwpHnO66Lo8izbU2E5zhI9+88cbqVVd9Qc6a5d/xta99bXL6eav/cvXzns7McRxnLmOsPYoiBMAc56yD/k6OVjN+Lhlj/vfX/8ffF1/pGa699trUD3LHS+nOTZKEEqEBY+xE2fTWyhTWfPnLX26LY5zLWDqDjA8i92mre63TgmF2B5QaY9CmGxtDzpXIF7Q8Poz1OHP9ZwmyA4CAbDbnvA0BPvJXf/lX7cZxtEn03kLBf6pcLmNi06a0JWBjhQEtBGWMesYBkLdLTkYz5LFhz7Zt29JHnnhi+6mnnrGXgnrOuWR2A0p0JAOPAIjWy9qdBpvXxUavwZeNkxvxs32OxnG/s7ioo6OD3i3q6+tLr7/++mySiI4ggLnGJDmlyPywWIEKdarnI2KVrkcShRSHcrFYMugEgPEFC9qrg4OD2u40Mzws4jgW9Xo9Le0pRb1z81sYgw9JKdsp+CfLoLWe2gB56dKlbOvWreHg4GB9dX9/RoyqLt9Pe7VWFG+TXxGjQJUm9hkS63MwTpciv6gBVX7yk9fMSTW/Io5xpUF9nKGVHLYLBmNcoBLCYwahTSuTT1lq+y5zxp3UqNYEASnTMQD3Z3EUvZMLfqHruTmVqgARPiL94P2kTWKm1m/fvn13j9NjeMGWoR+2soIcuBZ53lI+MPB5NdCohbKVFWTngXF12JaxiMTmP90KDXPo47p161K6Z3d39/la44e4MGfVQ13gjCaXjU9RMGmYFD6Fg2ma0u5ntsEPGHTCxGoNbGLQFAsj9PWZ1R0dcNttt5lLLrnEbkdhe+5ObbDWoNYz9PX1mVtvvdW99tq1y5yJ8uXgy7dqNAUD4NJsYIwbCkO4I6Qx2G5MA5IgBtN15LXXfuEtmUxwqeO6n1NKLXDdDOl0kNJpdKppNtEOwzpUKlWr8123se1Mw9QdGoy1a9fuilPY53uucVyHzuWu6/Z2dHaBVorqj8/0fb8QSn/Cg6TRFf/licVx0UJ6NCirV6+29yGQwO5Z+AcT0ha09l6FQqe9VpqmTDgBby4qPHTktF1R1qxZk/P99ndwbr7MGHsbFzyQ0rXvbz3hJkRIjK3VqgSJ6oY3S9w/pA0Ikl2xYgVu2rTJwJIl+FwzjxzMn0+iRujTYeNAEtj6vIoxvnjtF1c4jns9k+Ltkos8ed+eR8/QyJzYbntaQ61Wh3q91th3gtbWNts+Xo0A7/U8b0EYhWToI8ZZiAYrxmh6WxIrbhA6GHXBF8KqD2QGyXmZNtNcIfylvsCTBeeepv6Txph6vT46PLyvzAFCo81WKQsJQAmQZbR1al6BI55XbMGdUy/reR490O/pAf9/E0OuqlXy56YmTlP4ke5x2DMQJnOI2eI0Y9TVfpA5jwYwDGs1IRS90ySiiRsOmh2fLEkw5zwghlOIwTgg5w3HrrOzk5hrc8I4MMBWDgzY63coZcCjQIW6Sk+fZGYqCZT/zOcWCeFcHmSyF1AIFkVRnSCBMAxLAIa8aKtJENBlwNqFEHaDKfsMJMHI+MeSJMlXqxWaCeRm79OJvo8xsUlr1JynFWN4njHxESnFBa7r+EppAjvsBVoP0tbWNgcRLs5kgrdSuqpWqyHnvMYFuz3VyV0Oc1MpaSF3fdxxnAK1leV8qqzlT0+HVB7SSlLqsk9JkDieIMA/GhsjUE7RoDeaYzW7cchprT6EI87RRp0fhmEr3lVGJ48aw36MyHaTEy4E1GKtlwvufFgK+VaSHEX9iYm81/noFCQ3KZNxzwXAc4i55B1TCIqgn1Eab2eC7aDNTABYqrQ53nXFh6VwLqDJ2ABgwJGcwWxjTKS1MY4jWarSe2vlyX+89dZbX2rd5DOf+at8JhOfyZiIKJhuCPXh6kwIvwcATyQHgbQhp1QWmFFm4Mff+uY/Pjz9BfpX94clvzKDwgqtqU8JI2lOkOOfjOHTJIIZg22ZDNe33WYxZuuZ961ZU+1Br436fTTBBhta8cbe0ZY48B6D0KWU0plMlub/rnpU/6fxkUfuGxp6eAo7vvq661jA3XdZ36ThVvzByY/pLWSmqxQjRK9C08WSRJOHnppkf5zG/3t0NLx9aGjdlFd+5Wc+c0q3230OqW9ygqnGn0qEJaMHMsqurmxun+q4rpunDEYURZSWKsseziGyTCDJb9leih2nXkRrkzCGdVtWTpbNNltH1xg447rrvlTjXNkQzBiTKWL1DM7YEqOVABQYBBlhtBnVhtkONUQHDhx4ec+3afqt72s3dwWKuRsbF7aouVxfkaoh48vZctf1P3z11df+Qgg9YavemTyFvjdaZ6l9iyB/U2GotO0n3LqMXYvYNHP0DQfgmaDz9M7LL1+qCgWhS729ZT5apJlux6M5JFMfXgvZPlJISGGjezzF51PjqhgS4NXSlrRDANntzk7WcfnlV/tdjq+6F3bX9oyM0I73+lD0QI/DkPaNKHFOdhUp80N/+bDj+DM4F7/JZPJtJuEbStXqE65w7BKQxuM019hOCz8Q42Emsk9yKWIGjKQChZDzjMC/Bm2eABC7qJkJ53AiMjgLgc0i+8U4eX8aheD/Prq/aMF2otHR0Ze1z3QKjXOLwdbXOcztIiUgrCSlaZoaRNf3vHMQxUlB4F+MaJ6jFkiM8WWcsXNUqqw377ouGma2GxPvmbqSwpLjYFU6Ti6OI9BanSA5+y9tbuYtzmynjqgr2TT9UYhohA3zpsKzhos1NVVenijb5WfzVrIa5zWmMLP7I089xAEm3YNSyllxHNOknceYuMJxgmD2bI8SFcXJycnNFDZSo3t7BQsvN+wwLWz+qet5K9oK7cdNTJToXrM4lxdJKd9ZKLTJaqXGSvvqTxDCy7nwfD+wU6ge6ixDnNrFce7cuWMTExP/Fmv9gSDIXtjR0UEThiq/KD6jzDXF0HTPPGPcIb74foFACPLQH0p0/PM777zjYCsnSnHjyzLY8MANPFqGwgkP1xq9WKVOmtbsoGitaW/LHP3NGHQF7QIvBARBtt0Y/V6t0r9QGpXWKmejC8cFSs6HYZ0M7M8Acr9q3StN1RbP9x/J5XLvTpWiTEUghDhNcNHT0dnBw6g+lurw4cmkroIgY+FvSXsaa+3GRmUR09fg8TMppOMSXk9jQcyJtZ5esPAgA/NO13WXkvqt12vkdS/mzPl0Z1e3SdJ4z0QxHqtWoh0d+U4V+B513wNjlE+RkJQavw7At4Zh+DEEIGbkjM0ksRyFRFor1xieGgTS9yNpkmSVShVDHDcMD6s3vuGGGyjV9zfAxNNa67dqpecYRMp85AXn7TQ7je2SrcuGWt3zeFin6rdxFP5wj971782Ccbvs45UKzBjnVNg2gZTKimOK5cbJh8hms43jpYwB8UCcJLaJltEmqtXizUmcRp7nnGkQFzKGtku41jqRUtTjKHoxiaNNOsUf3XTTP5SaAAtVjmwRHL9er9cjALaUMdaFaLKIjPwWSFMdSS2p4CBCxKLRejQ12jXGJJzBqPTYq3a5o1w1aE0Ry1gSxwVFnpR1622K2dLNN39j+7XXfuk7k+XJjOd6pzPGZhmDGc5hhgEDSqsybf0hDDmwOJmqlMaHVmDFSilH3nDjDU9cffW1sRe48z3X9wyCp9M0VWlMsZ1gIEYYczVjpqK1Go2NKSDoCMCMMMamjPy2bdvIZ4zWrVv34OrVn9+l3fTDUsrzDcKJqG3T/gxZS9qKiHFeJpUdhrUNYRr/+JabbnqSrnENXONQPD1I6z+mEaXNWuFGcaI6niYEqkCcxFGOcTYuBIStciIpZagTsy9JYsEY2gngSOcHOlZjoU4+CmTfGBwHyAjKI40yGYbhRq3hn2666R93tNAzAifWrVtX7uvr+0VPz5xOKeXHuYCzjDFCKa3Gx8YyCHyXI52q4+RIxZa0NsPaSq6uMDAjjuPYBMfs2bNfdrKWSiWcOTOoa6NH0yTtVKmuUSkdY2w6LMp27lQPL1okhFbJaurdSt9ppfXB8fEcd/gextjBXM6JlUpriHo0VSk5llUw2vs/KGHDHlullP4AAAAASUVORK5CYII=" alt="Siam Cotton Wool" width="120" height="85" style="display:block;border:0;">
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
