# SCW Digital Card — GitHub Pages

นามบัตรดิจิทัล Siam Cotton Wool Ltd.
deploy บน GitHub Pages, ใช้งานได้ทุกที่ทั่วโลก

**Live URL:** https://nonwork3.github.io/scw_card/

## โครงสร้างไฟล์

```
scw_card/
├── index.html          ← หน้าหลัก (แสดงเมื่อเปิด root URL)
├── CLAUDE.md           ← คู่มือสำหรับ Claude Code
├── assets/
│   ├── card.css        ← shared styles
│   ├── card.js         ← shared logic (vCard, QR)
│   └── logo.png        ← โลโก้ Siam Cotton Wool
├── _template/
│   └── index.html      ← template สำหรับสร้างนามบัตรคนใหม่
└── card/
    ├── deshin/
    │   └── index.html  ← https://nonwork3.github.io/scw_card/card/deshin/
    └── tirachai/
        └── index.html  ← https://nonwork3.github.io/scw_card/card/tirachai/
```

## พนักงานปัจจุบัน

| ชื่อ | ตำแหน่ง | URL |
|------|---------|-----|
| เดชิน สิทธิชินวุฒิ (Deshin Sidhishinawudh) | General Manager | https://nonwork3.github.io/scw_card/card/deshin/ |
| ทิรชัย ศิริรัตนาตรัย (Tirachai Sirirattanatrai) | Factory Manager | https://nonwork3.github.io/scw_card/card/tirachai/ |

## วิธี Deploy ขึ้น GitHub Pages

### ครั้งแรก (ตั้งค่า repo)
1. ไปที่ Settings → Pages → Source เลือก `main` branch / root
2. รอ ~2 นาที → เว็บ live ที่ `https://nonwork3.github.io/scw_card/`

## เพิ่มพนักงานใหม่
1. copy `_template/index.html` → `card/<ชื่อ>/index.html`
2. แก้ไขข้อมูลใน `window.SCW_PERSON = { ... }` ด้านล่างของไฟล์
3. เปลี่ยน `cardURL` ให้ตรง เช่น `"https://nonwork3.github.io/scw_card/card/john/"`
4. push ขึ้น GitHub → live ภายใน 2 นาที

## แก้ไขข้อมูล

แก้เฉพาะ block `window.SCW_PERSON` ใน `index.html` ของแต่ละคน
ไม่ต้องแตะ `card.css` หรือ `card.js`

## QR Code

QR code ถูก generate ในหน้าเว็บโดยอัตโนมัติ ชี้ไปที่ `cardURL` ของแต่ละคน

หากต้องการ QR image ไฟล์ `.png` สำหรับพิมพ์ ให้ใช้เว็บ:
→ https://qr.io หรือ https://qrcode-monkey.com
ใส่ URL ด้านบน + สี `#0F6E56` (SCW green)

## ข้อมูลที่แก้ใน SCW_PERSON

| Field | คำอธิบาย |
|-------|---------|
| `nameTH` | ชื่อภาษาไทย |
| `nameEN` | ชื่อภาษาอังกฤษ (แสดงหลัก) |
| `nameFirst` | ชื่อ (สำหรับ vCard) |
| `nameLast` | นามสกุล (สำหรับ vCard) |
| `title` | ตำแหน่ง ALL CAPS (แสดงบน header) |
| `titleDisplay` | ตำแหน่ง Title Case (สำหรับ vCard) |
| `email` | อีเมล |
| `phone` | เบอร์โทร format `+66XXXXXXXXX` |
| `phoneDisplay` | เบอร์โทรที่แสดงบนหน้า |
| `web` | เว็บไซต์ (ใส่ `null` ถ้าไม่มี) |
| `slug` | ชื่อโฟลเดอร์ (lowercase, no space) |
| `cardURL` | URL เต็มของหน้านี้ (ใช้สำหรับ QR) |
