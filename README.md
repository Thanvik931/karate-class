# Ultimate Fitness Martial Arts Academy - ERP System

Full-stack Enterprise Resource Planning (ERP) web application for **Ultimate Fitness Martial Arts Academy** (Shotokan Style Karate Dojo).

---

## 🥋 Tech Stack & Architecture

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express REST API
- **Database**: SQLite (`dojo.db`) file-based database with auto-seeding
- **Authentication**: JWT & Role-Based Access Control (RBAC)

---

## 📦 Features & Modules Built

1. **Authentication & Login**: Multi-role login portals (Admin, Instructor, Student, Parent) with quick 1-click test login buttons.
2. **Student Profile Management**: Full student profiles with student codes (`STU001`), parent accounts, contact details, join dates, and 50-student dojo capacity gauge.
3. **Batch Management**: Morning (6:00–7:00 AM), Evening Batch 1 (5:00–6:00 PM), Evening Batch 2 (6:30–7:30 PM).
4. **Attendance Tracking**: Daily batch attendance marking (Present/Absent/Late) with auto-alerts for parents.
5. **Belt & Syllabus Management**: Standard Shotokan grading hierarchy (`White → Yellow → Orange → Green → Purple → Blue → Brown III → Brown II → Brown I → Black`), requirement checklists, promotion log history with real-time belt updates.
6. **Kata Library**: Catalog of traditional Shotokan Katas (*Heian Shodan–Godan*, *Tekki Shodan*, *Bassai Dai*, *Kanku Dai*, *Jion*, *Empi*) with Japanese Kanji & descriptions.
7. **Karate Terminology Glossary**: Searchable Japanese karate terms & English definitions.
8. **Class / Training Logs**: Instructor session logs, syllabus covered, drills, and per-student performance notes/ratings.
9. **Fees Management**: Monthly fee tracking, paid/due/overdue status cards, auto-reminders, and payment recording.
10. **Timetable & Announcements**: Weekly training schedule by focus area & notice board.
11. **Competitions & Events**: Tournaments, camps, student event registration, and medal results tracking (Gold, Silver, Bronze, Participant).

---

## 🚀 How to Run

### Single Command Start
```bash
cd backend
node server.js
```
Open **`http://localhost:5000`** in your browser.

---

## 🔑 Test Credentials (Pre-seeded)

- **Admin (Owner / Head Instructor Afroz Khan)**: `admin` / `admin123`
- **Instructor (Rahul Sharma)**: `instructor1` / `inst123`
- **Student (Aarav Patel)**: `STU001` / `stu123`
- **Parent (Suresh Patel)**: `PAR001` / `par123`
