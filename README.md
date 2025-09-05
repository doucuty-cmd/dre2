# DRE MVP Prototype (Static SPA)

Lightweight single-page app prototype to mock Admin, Mentor, and Student flows.

## How to run
- Open `index.html` in a browser (double-click).
- Use the Login screen to pick a role and enter your name. Press Enter or click Login.
- Your session persists automatically; use Logout to clear.

## Implemented flows:

### 🔹 Admin Flow
- **Login → Dashboard**
- **Dashboard Buttons:**
  - 📅 **Agenda** – view upcoming events and deadlines
  - 📂 **Submissions** – access all student submissions  
  - 🎖️ **Give Credits** – grant tokens/credits to students

### 🔹 Mentor Flow
- **Login → Dashboard**
- **Dashboard Buttons:**
  - 📅 **Agenda** – overview of events and sessions
  - 📂 **Submissions** – review and track student work
  - 🎖️ **Give Credits** – award tokens to classroom members
  - 📘 **Assignments** (classroom-like)
    - Open Assignment → Review student/team work → Attach evaluation file → Select member(s) → ✅ Evaluate

### 🔹 Student Flow
- **Dashboard →**
  - 🏆 **Challenges**
    - View Challenge → Submit → Attach File(s) → ✅ Confirm Submission
  - 📢 **Announcements**
    - Read announcement list → Open details → Mark as read
  - 📘 **Assignments**
    - Open Assignment → Submit → Attach File(s) → Confirmation Modal → ✅ Submit
  - 🎖️ **Credits / Token Wallet**
    - View Token Balance → Redeem Session → Select Ticket/Session → Confirm → ✅ Redeemed

## ✨ Design Features
- Light theme with modern typography (Inter), soft shadows and accessible contrast
- Buttons, inputs, and focus states refined for usability
- Cards for Dashboard (Agenda, Assignments, Challenges, Credits, Announcements)
- 3 items visible with "View All" for longer lists
- Progress/status badges (Submitted, Pending, Late) with gentle colors
- Confirmation modals for critical actions (Submit, Redeem, Evaluate)

## Notes
- Actions are mocked; data is non-persistent except for login session (localStorage).
- Routing uses URL hash (e.g., `#/student-dashboard`).
- File uploads are simulated; counts and confirmations are shown only.