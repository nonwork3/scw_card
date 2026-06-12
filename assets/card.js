// SCW Digital Card — shared renderer
(function () {
  const p = window.SCW_PERSON;
  if (!p) return;

  window.downloadVCard = function () {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:" + p.nameEN,
      "N:" + p.nameLast + ";" + p.nameFirst + ";;;",
      "ORG:Siam Cotton Wool Ltd.",
      "TITLE:" + p.titleDisplay,
      "EMAIL;TYPE=WORK:" + p.email,
      "TEL;TYPE=CELL:" + p.phone,
      p.web ? "URL:https://" + p.web : null,
      p.line ? "X-SOCIALPROFILE;type=LINE:https://line.me/ti/p/~" + p.line : null,
      "ADR;TYPE=WORK:;;40/5 M.3 Soi Krunai\\, Suksawad Rd.;Bangkru\\, Phrapradaeng;Samutprakan;;Thailand",
      "NOTE:Tax ID 0115551012980",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = p.slug + ".vcf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.title = p.nameEN + " — Siam Cotton Wool";
    set("c-name-th", p.nameTH);
    set("c-name-en", p.nameEN);
    set("c-title", p.title);
    setLink("c-email", "mailto:" + p.email, p.email);
    set("c-phone-display", p.phoneDisplay);
    document.getElementById("c-phone-link").href = "tel:" + p.phone;

    const lineRow = document.getElementById("row-line");
    if (p.line && lineRow) {
      lineRow.style.display = "flex";
      setLink("c-line", "https://line.me/ti/p/~" + p.line, p.line);
    }

    const webRow = document.getElementById("row-web");
    if (p.web) {
      webRow.style.display = "flex";
      setLink("c-web", "https://" + p.web, p.web);
    }

    set("c-qr-url", p.cardURL);

    // Render QR immediately
    new QRCode(document.getElementById("qr-box"), {
      text: p.cardURL,
      width: 148, height: 148,
      colorDark: "#0F6E56",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  });

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function setLink(id, href, text) {
    const el = document.getElementById(id);
    if (el) { el.href = href; el.textContent = text; }
  }
})();
