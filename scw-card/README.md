# SCW Digital Card — GitHub Pages

นามบัตรดิจิทัล Siam Cotton Wool Ltd.  
deploy บน GitHub Pages, ใช้งานได้ทุกที่ทั่วโลก

## โครงสร้างไฟล์

```
scw-card/
├── index.html              ← หน้าหลัก (แสดงเมื่อเปิด root URL)
├── assets/
│   ├── card.css            ← shared styles
│   └── card.js             ← shared logic (vCard, QR toggle)
└── card/
    ├── deshin/
    │   └── index.html      ← https://scw-it.github.io/card/deshin/
    └── tirachai/
        └── index.html      ← https://scw-it.github.io/card/tirachai/
```

---

## วิธี Deploy ขึ้น GitHub Pages

### ครั้งแรก (ตั้งค่า repo)

1. ไปที่ github.com → New repository
2. ตั้งชื่อ repo ว่า `card` (จะได้ URL: `scw-it.github.io/card/...`)
3. ตั้งเป็น **Public**
4. อัพโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป
5. ไปที่ Settings → Pages → Source เลือก **main branch / root**
6. รอ ~2 นาที → เว็บ live!

### เพิ่มพนักงานใหม่

1. copy โฟลเดอร์ `card/deshin/` → เปลี่ยนชื่อเป็นชื่อพนักงาน เช่น `card/john/`
2. แก้ไขข้อมูลใน `window.SCW_PERSON = { ... }` ด้านล่างของ `index.html`
3. เปลี่ยน `cardURL` ให้ตรง เช่น `"https://scw-it.github.io/card/john/"`
4. push ขึ้น GitHub → live ภายใน 2 นาที

### แก้ไขข้อมูล

แก้เฉพาะ block `window.SCW_PERSON` ใน `index.html` ของแต่ละคน  
ไม่ต้องแตะ `card.css` หรือ `card.js`

---

## QR Code

QR code ถูก generate ในหน้าเว็บโดยอัตโนมัติ  
ชี้ไปที่ URL ของแต่ละคน เช่น `https://scw-it.github.io/card/deshin/`

หากต้องการ QR image ไฟล์ .png สำหรับพิมพ์ ให้ใช้เว็บ:  
→ https://qr.io หรือ https://qrcode-monkey.com  
ใส่ URL ด้านบน + สี `#0F6E56` (SCW green)

---

## ข้อมูลที่แก้ใน SCW_PERSON

| Field | คำอธิบาย |
|-------|----------|
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
