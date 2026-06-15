# SCW Email Worker

Cloudflare Worker สำหรับส่งอีเมลนามบัตรดิจิทัล SCW ผ่าน SMTP  
รับ POST request จาก admin panel แล้วส่งอีเมลผ่าน SMTP server ของบริษัท

---

## MailChannels vs Raw TCP SMTP

| | MailChannels | Raw TCP SMTP (วิธีที่ใช้) |
|---|---|---|
| วิธีส่ง | `fetch()` HTTP | TCP socket + SMTP handshake |
| ฟรีบน Workers | ❌ หมด free tier ก.พ. 2567 | ✅ ใช้ SMTP server ที่มีอยู่ |
| ต้องแก้ DNS | ✅ SPF + TXT lockdown | ❌ ไม่ต้องแก้ |
| ใช้งานได้ทันที | ❌ ต้อง verify domain ก่อน | ✅ ใส่ credentials แล้วใช้เลย |

**เลือก Raw TCP SMTP** เพราะ SCW มี mail server อยู่แล้ว ไม่ต้องเปลี่ยน DNS  
รองรับ port 587 (STARTTLS) และ 465 (SMTPS) — กำหนดผ่าน `SMTP_PORT`

---

## วิธี Deploy

### 1. ติดตั้ง dependencies

```bash
cd email-worker
npm install
```

### 2. Login Cloudflare (ครั้งแรกครั้งเดียว)

```bash
npx wrangler login
```

### 3. ตั้งค่า Secrets

```bash
npx wrangler secret put SMTP_HOST
# ใส่: mail.siamcottonwool.co.th

npx wrangler secret put SMTP_PORT
# ใส่: 587  (หรือ 465 ถ้า server ใช้ SMTPS)

npx wrangler secret put SMTP_USER
# ใส่: อีเมล sender เช่น admin@siamcottonwool.co.th

npx wrangler secret put SMTP_PASSWORD
# ใส่: password ของ SMTP_USER

# Optional — ถ้าต้องการ sender address ต่างจาก SMTP_USER
npx wrangler secret put SMTP_FROM
# ใส่: noreply@siamcottonwool.co.th
```

### 4. Deploy

```bash
npx wrangler deploy
```

Output จะแสดง URL เช่น:
```
https://scw-email-service.<YOUR-SUBDOMAIN>.workers.dev
```

### 5. แก้ admin/admin.js

เปิด `admin/admin.js` แก้บรรทัด `EMAIL_WORKER_URL`:

```js
const EMAIL_WORKER_URL =
  'https://scw-email-service.<YOUR-SUBDOMAIN>.workers.dev/send-card-email';
```

แทน `<YOUR-SUBDOMAIN>` ด้วย subdomain จริงจาก output ข้อ 4

---

## วิธีทดสอบด้วย curl

```bash
curl -X POST https://scw-email-service.<YOUR-SUBDOMAIN>.workers.dev/send-card-email \
  -H "Content-Type: application/json" \
  -H "Origin: https://nonwork3.github.io" \
  -d '{
    "to": "test@example.com",
    "name": "สยาม สำลี",
    "cardURL": "https://nonwork3.github.io/scw_card/card/deshin/",
    "signatureHTML": "<p>test signature</p>"
  }'
```

ผลที่คาดได้:
```json
{ "success": true }
```

ถ้า SMTP credentials ยังไม่ได้ตั้ง จะได้:
```json
{ "success": false, "error": "SMTP: expected 220, got ..." }
```

---

## Request / Response

**POST** `/send-card-email`

```json
{
  "to":            "employee@siamcottonwool.co.th",
  "name":          "สยาม สำลี",
  "cardURL":       "https://nonwork3.github.io/scw_card/card/siam/",
  "signatureHTML": "<table>...</table>"
}
```

**Response OK:**
```json
{ "success": true }
```

**Response Error:**
```json
{ "success": false, "error": "SMTP: expected 235, got 535 — authentication failed" }
```
