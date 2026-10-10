# DailyBibleFuel Web Platform

A serene, modern, and fully responsive website for **DailyBibleFuel** — providing daily scripture devotionals, bilingual worship lyrics (English & Telugu), interactive Bible quizzes, pastoral guidance, and official Truemark Christian badges and merchandise.

---

## 📁 Project Directory Structure

```text
DAILY BIBLE FUEL WEB/
├── assets/
│   ├── css/
│   │   └── style.css            # Global styling, custom scrollbars, reading tone themes (Light/Sepia/Dark)
│   ├── images/
│   │   └── logo.png             # Official 120x120 DailyBibleFuel logo
│   └── js/
│       ├── common.js            # Shared cart engine, mobile drawer, toast notifications, WhatsApp checkout
│       ├── live-sync.js         # Real-time synchronization with backend APIs
│       └── admin.js             # Admin Dashboard UI logic and CRUD operations
├── data/                        # JSON Database Layer
│   ├── products.json            # Store catalog & authentic Christian Badges
│   ├── site-content.json        # Headlines, banners, daily verses, contact details
│   ├── worship-songs.json       # Telugu & English worship song lyrics
│   └── submissions.json         # User prayer requests and salvation commitments
├── uploads/                     # Uploaded merchandise images
├── admin.html                   # Admin Content & Store Management Dashboard
├── index.html                   # Home Page
├── daily-verse.html             # Devotionals > Daily Verse & Audio Meditation
├── videos-messages.html         # Devotionals > Videos & Messages (Cinema Modal Player)
├── bible-quiz.html              # Devotionals > Bible Quiz & Knowledge Insights
├── english-worship-lyrics.html  # Worship > English Worship Lyrics & Chord Transposer
├── telugu-worship-lyrics.html   # Worship > Telugu Worship Lyrics & Aksharamala Directory
├── start-a-new-life-with-jesus.html # The Gospel Pathway, Sinner's Prayer & Discipleship
├── contact-us.html              # 24/7 Pastoral Helpline, Prayer Requests & FAQ
├── shop.html                    # Official TrueMark Merch & Christian Badges
├── christian-badges.html        # Direct alias/redirect to Christian Badges collection
├── server.js                    # Node.js server with REST APIs, authentication & file uploads
├── package.json                 # Project configuration & start scripts
└── README.md                    # Project documentation
```

---

## 🛠️ Admin Dashboard (`/admin`)

The website includes a dedicated **Admin Dashboard** allowing authorized ministry administrators to edit site content, manage products, update prices, and upload merchandise photos in real-time.

- **Access URL**: [`http://localhost:8080/admin`](http://localhost:8080/admin) (or `http://localhost:8080/admin.html`)
- **Default Username**: `admin`
- **Default Password**: `fuel2025`

### Admin Capabilities:
1. **🛍️ Store & Christian Badges Management**:
   - Add new products / pin badges.
   - Edit prices, sale prices, badge ribbons (`Bestseller`, `Popular`, etc.), and descriptions.
   - Upload badge images directly from device or enter image URLs.
   - Toggle **In Stock / Out of Stock** with instant persistence.
   - Delete products.
2. **📢 Headlines & Banners**:
   - Update homepage Hero Headline, Subtitle, Slogan Badge (`Fill Up with Emmanuel`), and CTA buttons.
   - Change banner images and top announcement bar text.
3. **📖 Daily Verse & Devotionals**:
   - Update Verse Reference, English Scripture, Telugu Translation, devotional reflection, and guided prayer.
4. **🎥 Sermons & Videos**:
   - Add/edit YouTube video IDs, sermon titles, and devotional series tags.
5. **🎶 Worship Lyrics**:
   - Manage English and Telugu worship lyrics, chords, and artists.
6. **💬 Helplines & Ministry Contacts**:
   - Change phone (`+91 8019-777-939`), emails (`hello@dailybiblefuel.com`), and WhatsApp links.
7. **📬 Prayer Requests & Decisions**:
   - View live incoming prayer requests and salvation commitments submitted by visitors.

---

## 🌟 Pages & Key Features

| Page | File | Highlights |
| :--- | :--- | :--- |
| **Home** | [`index.html`](index.html) | Hero banner, daily scripture focus, founder quote (Sis. Udaysree Gurajada), feature exploration cards, about section, newsletter, 24/7 helpline banner. |
| **Daily Verse** | [`daily-verse.html`](daily-verse.html) | Bilingual audio player with interactive scrubber, date switcher, reading tone themes (Light, Sepia, Dark), font scale controls, ESV / Telugu / NIV / KJV parallel translation toggle, 3 heart reflection journaling boxes (`localStorage`), Amen counter. |
| **Videos / Messages** | [`videos-messages.html`](videos-messages.html) | Cinema video player modal, category tabs (Daily 2-Min, Sermons, Telugu, Kids, Worship), instant search filter, language switcher, transcript drawer, 60-second shorts carousel, study notes downloads. |
| **Bible Quiz** | [`bible-quiz.html`](bible-quiz.html) | Interactive multiple-choice quiz engine with instant score tracking, scripture answer explanations, 60-second speed challenge timer, printable Certificate of Completion modal, theological root word explorer. |
| **English Worship Lyrics** | [`english-worship-lyrics.html`](english-worship-lyrics.html) | Live chord transposer (`-` / `+` key selector), chords toggle (show/hide for vocal mode), rehearsal audio track, setlist planner, complete song directory with tempo & key metadata. |
| **Telugu Worship Lyrics** | [`telugu-worship-lyrics.html`](telugu-worship-lyrics.html) | Noto Sans Telugu typography, Aksharamala (అక్షరమాల) alphabetical filter bar, bilingual search (Telugu & Romanized English), Hosanna / Andhra hymn directory, chords toggle. |
| **Start a New Life with Jesus** | [`start-a-new-life-with-jesus.html`](start-a-new-life-with-jesus.html) | Four Truths of God's Love (bilingual scriptures), interactive Sinner's Prayer with confession milestone counter and rejoicing animation, printable Certificate of New Birth modal, 5 Essential Next Steps discipleship checklist with interactive checkmarks (`localStorage`), Starter Bundle download form. |
| **Contact Us** | [`contact-us.html`](contact-us.html) | 24/7 Pastoral Helpline cards (`+91 8019-777-939` & WhatsApp), validated Prayer Request / Contact inquiry form with category tabs, FAQ collapsible accordions with chevron rotation, fellowship locations (Hyderabad, Visakhapatnam), ministry leadership cards. |
| **Shop & Christian Badges** | [`shop.html`](shop.html) | Prioritizes **Christian Badges & Lapel Pins** (Faith Over Fear, Cross & Dove Shield, Emmanuel Love Telugu pack, Lion of Judah, etc.), category filters (Badges, Bibles, Journals, Kids, Apparel), search & sort, persistent Slide-Over Cart Drawer, and 1-click WhatsApp order checkout. |

---

## 🎨 Design System

- **Primary Typography**: **Poppins** Google Font applied across all elements, titles, scriptures, buttons, and navigation.
- **Telugu Script**: **Noto Sans Telugu** for native script rendering.
- **Icons**: **Google Material Symbols Outlined**.
- **Color Palette**:
  - **Deep Navy**: `#163A63`
  - **Sacred Crimson**: `#D32F2F`
  - **Celestial Sky**: `#1DA1E8`
  - **Warm Parchment**: `#FAF8F5`
  - **Antique Gold**: `#D4A359`
- **Responsiveness**: Fluid layout across **Mobile (<768px)**, **Tablet (768px-1024px)**, and **Desktop (1024px+)** with mobile drawer navigation and collapsible accordions.

---

## 🚀 Running the Project Locally

### Option 1: Using Node.js (Recommended)
```bash
npm start
```
or
```bash
node server.js
```
Then visit: [http://localhost:8080](http://localhost:8080)

### Option 2: Direct File Access
You can open any file (e.g. `index.html`) directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option 3: VS Code Live Server
Right-click on `index.html` in VS Code and select **Open with Live Server**.

---

## ☁️ Deployment

This project contains standard static web assets and can be deployed directly to:
- **GitHub Pages**: Push to repository and enable GitHub Pages on the root directory.
- **Vercel / Netlify / Cloudflare Pages**: Connect your repository with default static settings.
- **Any Apache / Nginx / cPanel web host**: Upload the files directly to `public_html`.
