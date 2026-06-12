# SCW Digital Card

นามบัตรดิจิทัลสำหรับพนักงาน Siam Cotton Wool Ltd.
deploy บน GitHub Pages ใช้งานได้ทุกที่

**Live URL:** https://nonwork3.github.io/scw_card/
**Admin:** https://nonwork3.github.io/scw_card/admin/

---

## โครงสร้างไฟล์

```
scw_card/
├── index.html              ← หน้า root (redirect / landing)
├── CLAUDE.md               ← คู่มือสำหรับ Claude Code
├── README.md
├── assets/
│   ├── card.css            ← shared styles (ทุกการ์ดใช้ร่วม)
│   ├── card.js             ← shared logic (vCard, QR, show/hide rows)
│   ├── icons.svg           ← SVG sprite (7 product icons)
│   └── logo.svg            ← โลโก้ Siam Cotton Wool
├── _template/
│   └── index.html          ← template สำหรับสร้างการ์ดใหม่ด้วยมือ
├── admin/
│   ├── admin.css
│   ├── admin.js
│   ├── index.html          ← หน้าหลัก Admin (รายชื่อการ์ดทั้งหมด)
│   ├── edit/index.html     ← แก้ไขข้อมูลพนักงาน
│   ├── new/index.html      ← เพิ่มพนักงานใหม่
│   └── delete/index.html   ← ลบนามบัตร
└── card/
    ├── deshin-sid/
    │   └── index.html
    ├── tirachai-sir/
    │   └── index.html
    ├── worapord-pun/
    │   └── index.html
    ├── mukrawee-man/
    │   └── index.html
    └── thanapatch-san/
        └── index.html
```

---

## URL การ์ดพนักงานปัจจุบัน

| ชื่อ | ตำแหน่ง | URL |
|------|---------|-----|
| เดชิน สิทธิชินวุฒิ (Deshin Sidhishinawudh) | General Manager | https://nonwork3.github.io/scw_card/card/deshin-sid/ |
| ถิรชัย สิริรัตนตรัย (Tirachai Sirirattanatrai) | Factory Manager | https://nonwork3.github.io/scw_card/card/tirachai-sir/ |
| วรพรต ปุญสุรัตน์ (Worapord Punsurat) | IT Support | https://nonwork3.github.io/scw_card/card/worapord-pun/ |
| มุกระวี มณีวุฒิวรสกุล (Mukrawee Maneewuthiworasakul) | QMR. | https://nonwork3.github.io/scw_card/card/mukrawee-man/ |
| ธนพัชญ์ แสงอรุณ (Thanapatch Sangarun) | IT Manager | https://nonwork3.github.io/scw_card/card/thanapatch-san/ |

---

## Features

- **หน้าการ์ดส่วนตัว** — ชื่อ, ตำแหน่ง, อีเมล, โทรศัพท์, เว็บไซต์, LINE ID
- **QR code** — generate อัตโนมัติจาก `cardURL` (พร้อมใช้งาน ไม่ต้องตั้งค่า)
- **บันทึก vCard** — ปุ่ม "บันทึกลงผู้ติดต่อ" ดาวน์โหลด `.vcf` ได้เลย
- **แถว LINE (optional)** — ซ่อนอัตโนมัติเมื่อ `line: null`
- **แถว Website (optional)** — ซ่อนอัตโนมัติเมื่อ `web: null`
- **Logo + Product icons** — SVG sprite 7 ไอคอนผลิตภัณฑ์ SCW
- **Favicon + Open Graph** — `og:title`, `og:description`, `og:image`, `og:url` ต่างกันทุกการ์ด
- **หน้า Admin** — เพิ่ม / แก้ไข / ลบ + preview live ผ่าน GitHub API (ต้องใช้ PAT)

---

## วิธีเพิ่มพนักงานใหม่ (แนะนำ — ผ่าน Admin)

1. เปิด https://nonwork3.github.io/scw_card/admin/new/
2. กรอกข้อมูล: ชื่อไทย, ชื่ออังกฤษ, ตำแหน่ง, อีเมล, เบอร์โทร, LINE ID (ถ้ามี)
3. กด **"บันทึกขึ้น GitHub"** — ระบบสร้างไฟล์และ push ให้อัตโนมัติ
4. GitHub Pages deploy ภายใน ~2 นาที

> ต้องตั้งค่า GitHub Personal Access Token ก่อน (Settings → Developer settings → Fine-grained tokens → Contents: Read and write)

### วิธีเพิ่มด้วยมือ (ถ้าต้องการ)

1. copy `_template/index.html` → `card/<slug>/index.html`
2. แก้ `window.SCW_PERSON` ในไฟล์ใหม่ (ดู field ด้านล่าง)
3. กำหนด `slug` และ `cardURL` ให้ตรงกับชื่อโฟลเดอร์
4. commit และ push

---

## วิธีแก้ไขข้อมูลพนักงาน

**ผ่าน Admin (แนะนำ):**
เปิด https://nonwork3.github.io/scw_card/admin/ → คลิก "แก้ไข" → บันทึก

**แก้โดยตรง:**
เปิดไฟล์ `card/<slug>/index.html` → แก้เฉพาะ block `window.SCW_PERSON` → commit และ push

> ห้ามแตะ `assets/card.css` หรือ `assets/card.js` เว้นแต่แก้ bug ที่ใช้ร่วมกัน

---

## ข้อมูลใน SCW_PERSON

| Field | คำอธิบาย | ตัวอย่าง |
|-------|---------|---------|
| `nameTH` | ชื่อภาษาไทย | `"เดชิน สิทธิชินวุฒิ"` |
| `nameEN` | ชื่อภาษาอังกฤษ (แสดงหลัก) | `"Deshin Sidhishinawudh"` |
| `nameFirst` | ชื่อ (สำหรับ vCard) | `"Deshin"` |
| `nameLast` | นามสกุล (สำหรับ vCard) | `"Sidhishinawudh"` |
| `title` | ตำแหน่ง ALL CAPS (แสดงบน header) | `"GENERAL MANAGER"` |
| `titleDisplay` | ตำแหน่ง Title Case (สำหรับ vCard) | `"General Manager"` |
| `email` | อีเมล | `"deshin@siamcottonwool.co.th"` |
| `phone` | เบอร์โทร ไม่มีเว้นวรรค | `"+66655362898"` |
| `phoneDisplay` | เบอร์โทรที่แสดงบนหน้า | `"+6665 5362898"` |
| `web` | เว็บไซต์ (ใส่ `null` ถ้าไม่มี) | `"www.siamcottonwool.com"` |
| `line` | LINE ID (ใส่ `null` ถ้าไม่มี) | `"lineid123"` |
| `slug` | ชื่อโฟลเดอร์ lowercase | `"deshin-sid"` |
| `cardURL` | URL เต็มของหน้านี้ (ใช้สำหรับ QR) | `"https://nonwork3.github.io/scw_card/card/deshin-sid/"` |

---

## หมายเหตุ

- **รูปแบบชื่อโฟลเดอร์:** `firstname-3ตัวแรกนามสกุล` เช่น `deshin-sid`, `tirachai-sir`
- **ห้ามใช้จุด (.)** ในชื่อโฟลเดอร์ (GitHub Pages จะตีความเป็น file extension)
- QR print-ready: ใช้ https://qr.io หรือ https://qrcode-monkey.com ใส่ URL + สี `#0F6E56`
- Deploy status: https://github.com/nonwork3/scw_card/deployments
