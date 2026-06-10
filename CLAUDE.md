# SCW Digital Card — Claude Code Guide

## Project Overview
นามบัตรดิจิทัลสำหรับ Siam Cotton Wool Ltd. deploy บน GitHub Pages

**Live URL:** https://nonwork3.github.io/scw_card/ (หรือ scw-it.github.io/card/ ถ้า deploy ใน org repo)

## Repository Structure
```
scw_card/
├── CLAUDE.md          ← this file (Claude Code instructions)
├── index.html         ← root redirect / landing page
├── README.md          ← project documentation
├── assets/
│   ├── card.css       ← shared styles for all cards
│   └── card.js        ← shared logic (vCard download, QR toggle)
├── _template/
│   └── index.html     ← template for new employee cards
└── card/
    ├── deshin/
        │   └── index.html
            └── tirachai/
                    └── index.html
                    ```

                    ## Key Concepts

                    ### Employee Card Data
                    Each card's `index.html` has a `window.SCW_PERSON` config block at the bottom:

                    ```js
                    window.SCW_PERSON = {
                      nameTH: "ชื่อภาษาไทย",
                        nameEN: "First Last",
                          nameFirst: "First",
                            nameLast: "Last",
                              title: "JOB TITLE (ALL CAPS)",
                                titleDisplay: "Job Title (Title Case)",
                                  email: "email@siamcottonwool.co.th",
                                    phone: "+66XXXXXXXXX",
                                      phoneDisplay: "0X-XXXX-XXXX",
                                        web: null,           // or "https://..." if applicable
                                          slug: "firstname",   // lowercase folder name
                                            cardURL: "https://nonwork3.github.io/scw_card/card/firstname/"
                                            };
                                            ```

                                            ### Do NOT modify
                                            - `assets/card.css` or `assets/card.js` unless fixing a shared bug
                                            - Only touch `window.SCW_PERSON` block when updating an individual card

                                            ## Common Tasks

                                            ### Add a new employee card
                                            1. Copy `_template/index.html` → `card/<slug>/index.html`
                                            2. Edit `window.SCW_PERSON` in the new file with employee's data
                                            3. Set `cardURL` to `https://nonwork3.github.io/scw_card/card/<slug>/`
                                            4. Commit and push → GitHub Pages deploys in ~2 minutes

                                            ### Edit existing employee info
                                            - Open `card/<slug>/index.html`
                                            - Change only the `window.SCW_PERSON` values
                                            - Commit and push

                                            ### QR Code
                                            - Auto-generated from `cardURL` field — no extra steps needed
                                            - For print-ready PNG: use https://qr.io or https://qrcode-monkey.com with color `#0F6E56`

                                            ## Tech Stack
                                            - Pure HTML / CSS / JavaScript (no build step, no npm)
                                            - GitHub Pages for hosting
                                            - QR code generated client-side via JS library in card.js

                                            ## Branch & Deployment
                                            - Main branch: `main`
                                            - Auto-deploy: GitHub Pages watches `main` branch root
                                            - Check deploy status: https://github.com/nonwork3/scw_card/deployments
