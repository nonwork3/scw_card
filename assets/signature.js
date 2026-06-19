'use strict';

// Shared between admin/admin.js (PAT-authenticated tool) and signature/index.html
// (public download page) -- anything here must not depend on the GitHub API.

const OWNER = 'nonwork3';
const REPO  = 'scw_card';
const BASE  = `https://${OWNER}.github.io/${REPO}/card/`;

const ACRONYMS = new Set([
  'IT','QMR','HR','PR','PO','QA','QC',
  'CEO','CFO','COO','GM','AGM','VP','MD','R&D',
]);

function toTitleCase(s) {
  return s.toLowerCase().replace(/\S+/g, word => {
    const core = word.replace(/[^a-z&]/gi, '').toUpperCase();
    return ACRONYMS.has(core)
      ? word.toUpperCase()
      : word.replace(/^[a-z]/, c => c.toUpperCase());
  });
}

function fmtPhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('66') && d.length >= 11) return '+' + d.slice(0, 4) + ' ' + d.slice(4);
  return raw;
}

function parseCardData(html) {
  const m = html.match(/window\.SCW_PERSON\s*=\s*(\{[\s\S]*?\});/);
  if (!m) return null;
  try {
    const p = new Function('return ' + m[1])(); // eslint-disable-line no-new-func
    const toArr = (arr, single) =>
      Array.isArray(arr) ? arr.filter(Boolean) : (single ? [single] : []);
    return {
      nameTH:    p.nameTH    || '',
      nameEN:    p.nameEN    || '',
      nameFirst: p.nameFirst || '',
      nameLast:  p.nameLast  || '',
      title:     p.title     || '',
      emails:    toArr(p.emails, p.email),
      phones:    toArr(p.phones, p.phone),
      lines:     toArr(p.lines,  p.line),
      webs:      toArr(p.webs,   p.web),
      address:   p.address   || '',
      slug:      p.slug      || '',
      cardURL:   p.cardURL   || '',
    };
  } catch { return null; }
}

function downloadHtmlFile(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function generateSignature(v, opts = {}) {
  const { standalone = true } = opts;
  const nameEN       = v.nameEN || [v.nameFirst, v.nameLast].filter(Boolean).join(' ');
  const titleDisplay = toTitleCase(v.title || '');
  const emails  = v.emails || (v.email ? [v.email] : []);
  const phones  = v.phones || (v.phone ? [v.phone] : []);
  const cardURL = BASE + v.slug + '/';
  const qrSrc   = 'https://api.qrserver.com/v1/create-qr-code/?size=72x72&color=0F6E56&data=' + encodeURIComponent(cardURL);
  const logoSrc = 'https://nonwork3.github.io/scw_card/assets/logo-email.png';

  const ROW        = 'padding-bottom:4px;font-size:13px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;';
  const ICON       = 'color:#888888;font-size:13px;mso-text-raise:0;';
  const ICON_PHONE = 'color:#888888;font-size:17px;mso-text-raise:0;';
  const emailBlock = emails.length ? `
              <table cellpadding="0" cellspacing="0" border="0">${
                emails.map(e => `
                <tr><td style="${ROW}">
                  <span style="${ICON}">&#9993;&nbsp;</span>
                  <a href="mailto:${e}" style="text-decoration:none;">
                    <span style="color:#1D9E75;font-size:13px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">${e}</span>
                  </a>
                </td></tr>`).join('')}
              </table>` : '';

  const phoneBlock = phones.length ? `
              <table cellpadding="0" cellspacing="0" border="0">${
                phones.map(p => `
                <tr><td style="${ROW}">
                  <span style="${ICON_PHONE}">&#9990;&nbsp;</span>
                  <a href="tel:${p}" style="text-decoration:none;">
                    <span style="color:#333333;font-size:13px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">${fmtPhone(p)}</span>
                  </a>
                </td></tr>`).join('')}
              </table>` : '';

  const table = `<table id="sig" cellpadding="0" cellspacing="0" border="0" width="464"
  style="font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;font-size:13px;color:#333333;">
  <tr>
    <!-- Green bar: nested table forces full-height bgcolor without rowspan -->
    <td bgcolor="#1D9E75" width="4" style="font-size:0;line-height:0;">
      <table width="4" height="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td bgcolor="#1D9E75" style="font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td>
    <td width="12" style="font-size:0;line-height:0;">&nbsp;</td>
    <!-- All content in one td / one inner table — no split -->
    <td>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td colspan="2" style="padding-bottom:8px;">
          <a href="https://www.siamcottonwool.co.th" style="display:block;border:0;text-decoration:none;">
            <img src="${logoSrc}" width="160" height="83" alt="Siam Cotton Wool"
              style="display:block;border:0;">
          </a>
        </td></tr>
        <tr><td colspan="2" style="padding-bottom:2px;">
          <span style="font-size:16px;font-weight:bold;color:#111111;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">${v.nameTH}</span>
        </td></tr>
        <tr><td colspan="2" style="padding-bottom:2px;">
          <span style="font-size:13px;color:#666666;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">${nameEN}</span>
          <span style="font-size:13px;color:#cccccc;mso-text-raise:0;"> | </span>
          <span style="font-size:13px;font-weight:bold;color:#1D9E75;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">${titleDisplay}</span>
        </td></tr>
        <tr><td colspan="2" style="padding-bottom:8px;">
          <span style="font-size:13px;color:#999999;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">Siam Cotton Wool Ltd.</span>
        </td></tr>
        <tr><td colspan="2"
          style="border-bottom:2px solid #1D9E75;font-size:1px;line-height:1px;mso-line-height-rule:exactly;padding:0;">&nbsp;</td></tr>
        <tr><td colspan="2" height="10"
          style="font-size:0;line-height:10px;">&nbsp;</td></tr>
        <tr>
          <td valign="top" style="padding-right:16px;">${emailBlock}${phoneBlock}
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:4px;font-size:13px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;">
                <span style="color:#888888;font-size:13px;mso-text-raise:0;">Web&nbsp;</span>
                <a href="https://www.siamcottonwool.co.th" style="text-decoration:none;">
                  <span style="color:#1D9E75;font-size:13px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;mso-text-raise:0;">www.siamcottonwool.co.th</span>
                </a>
              </td></tr>
            </table>
          </td>
          <td valign="middle" align="center" width="90">
            <a href="${cardURL}" style="text-decoration:none;">
              <img src="${qrSrc}" width="72" height="72" alt="QR"
                style="display:block;margin:0 auto;border:0;">
            </a>
            <table cellpadding="0" cellspacing="0" border="0" width="90">
              <tr><td align="center" style="font-size:11px;color:#aaaaaa;padding-top:6px;font-family:Arial,sans-serif;mso-fareast-font-family:Arial;mso-bidi-font-family:Arial;line-height:15px;">
                สแกน QR เพื่อบันทึก
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  if (!standalone) return table;

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><title>Email Signature</title></head>
<body style="margin:0;padding:24px;background:#f0f0f0;font-family:Arial,sans-serif;">
<p style="font-size:11px;color:#999;margin:0 0 12px;">
  copy table#sig ถึง /table ไปวางใน Gmail / Outlook
</p>
${table}
</body></html>`;
}
