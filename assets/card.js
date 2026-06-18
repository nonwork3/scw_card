// SCW Digital Card — shared renderer
(function () {
  const p = window.SCW_PERSON;
  if (!p) return;

  // Normalize to arrays (backward compat: old cards use email/phone/line/web)
  const emails = p.emails || (p.email ? [p.email] : []);
  const phones = p.phones || (p.phone ? [p.phone] : []);
  const lines  = p.lines  || (p.line  ? [p.line]  : []);
  const webs   = p.webs   || (p.web   ? [p.web]   : []);

  window.downloadVCard = function () {
    const btn = document.querySelector('.btn-save');
    const original = btn ? btn.innerHTML : null;
    function flash(html, ms) {
      if (!btn) return;
      btn.innerHTML = html;
      setTimeout(function () { btn.innerHTML = original; }, ms);
    }
    try {
      const addrVal = p.address || '40/5 M.3 Soi Krunai, Suksawad Rd., Bangkru, Phrapradaeng, Samutprakan 10130';
      const addrVCard = ';;' + addrVal.replace(/,/g, '\\,').replace(/\n/g, ' ');
      const lines_ = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:'    + p.nameEN,
        'N:'     + p.nameLast + ';' + p.nameFirst + ';;;',
        'ORG:Siam Cotton Wool Ltd.',
        'TITLE:' + p.titleDisplay,
        ...emails.map(e  => 'EMAIL;TYPE=WORK:' + e),
        ...phones.map(ph => 'TEL;TYPE=CELL:' + ph),
        ...webs.map(w    => 'URL:' + (w.startsWith('http') ? w : 'https://' + w)),
        ...lines.map(l   => 'X-SOCIALPROFILE;type=LINE:https://line.me/ti/p/~' + l),
        'ADR;TYPE=WORK:' + addrVCard + ';;;Thailand',
        'NOTE:Tax ID 0115551012980',
        'END:VCARD',
      ].filter(Boolean).join('\r\n');
      const blob = new Blob([lines_], { type: 'text/vcard;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = p.slug + '.vcf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      flash('<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> บันทึกแล้ว', 2000);
    } catch (err) {
      flash('บันทึกไม่สำเร็จ — ลองแตะอีกครั้ง', 2500);
    }
  };

  function fmtPh(ph) {
    if (ph.slice(0, 3) === '+66') {
      var d = ph.slice(3).replace(/\D/g, '');
      return '+66' + d.slice(0, 2) + ' ' + d.slice(2);
    }
    return ph;
  }

  function fillList(listId, vals, hrefFn, textFn, extraCls) {
    var el = document.getElementById(listId);
    if (!el) return false;
    el.innerHTML = '';
    vals.forEach(function (val) {
      var a = document.createElement('a');
      a.href = hrefFn(val);
      a.className = 'info-value-link' + (extraCls ? ' ' + extraCls : '');
      a.textContent = textFn ? textFn(val) : val;
      el.appendChild(a);
    });
    return true;
  }

  function init() {
    document.title = p.nameEN + ' — Siam Cotton Wool';
    set('c-name-th', p.nameTH);
    set('c-name-en', p.nameEN);
    set('c-title', p.title);

    showRow('row-email', emails.length > 0);
    if (!fillList('c-email-list', emails, function (e) { return 'mailto:' + e; }, null, '')) {
      if (emails[0]) setLink('c-email', 'mailto:' + emails[0], emails[0]);
    }

    showRow('row-phone', phones.length > 0);
    if (!fillList('c-phone-list', phones, function (ph) { return 'tel:' + ph; }, fmtPh, 'plain')) {
      var phoneLink = document.getElementById('c-phone-link');
      if (phoneLink && phones[0]) phoneLink.href = 'tel:' + phones[0];
    }

    showRow('row-line', lines.length > 0);
    if (!fillList('c-line-list', lines, function (l) { return 'https://line.me/ti/p/~' + l; }, null, '')) {
      if (lines[0]) setLink('c-line', 'https://line.me/ti/p/~' + lines[0], lines[0]);
    }

    showRow('row-web', webs.length > 0);
    if (!fillList('c-web-list', webs, function (w) { return w.startsWith('http') ? w : 'https://' + w; }, null, '')) {
      if (webs[0]) setLink('c-web', webs[0].startsWith('http') ? webs[0] : 'https://' + webs[0], webs[0]);
    }

    set('c-address', p.address);
    showRow('row-address', p.address);
    set('c-qr-url', p.cardURL);

    new QRCode(document.getElementById('qr-box'), {
      text: p.cardURL,
      width: 148, height: 148,
      colorDark: '#0F6E56',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function setLink(id, href, text) {
    const el = document.getElementById(id);
    if (el) { el.href = href; el.textContent = text; }
  }
  function showRow(id, condition) {
    const el = document.getElementById(id);
    if (el) el.style.display = condition ? 'flex' : 'none';
  }
})();
