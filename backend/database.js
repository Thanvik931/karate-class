const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'dojo.db');
const db = new sqlite3.Database(dbPath);

const BELT_RANKS = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Purple',
  'Blue',
  'Brown III',
  'Brown II',
  'Brown I',
  'Black'
];

const BATCHES = [
  'Morning (6:00–7:00 AM)',
  'Evening Batch 1 (5:00–6:00 PM)',
  'Evening Batch 2 (6:30–7:30 PM)'
];

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDatabase() {
  db.serialize(async () => {
    // 1. Users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'student', 'parent')),
        name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Students table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_code TEXT UNIQUE NOT NULL,
        user_id INTEGER UNIQUE NOT NULL,
        parent_user_id INTEGER,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        contact TEXT NOT NULL,
        belt_rank TEXT NOT NULL,
        batch TEXT NOT NULL,
        join_date TEXT NOT NULL,
        guardian_name TEXT NOT NULL,
        guardian_phone TEXT NOT NULL,
        guardian_relation TEXT DEFAULT 'Parent',
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_user_id) REFERENCES users(id)
      )
    `);

    // 3. Dojo Info table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS dojo_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        academy_name TEXT NOT NULL,
        style TEXT NOT NULL,
        head_instructor TEXT NOT NULL,
        instructor_phone TEXT NOT NULL,
        max_capacity INTEGER NOT NULL
      )
    `);

    // 4. Attendance Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        batch TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
        notes TEXT,
        marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);

    // 5. Syllabus Requirements Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS syllabus_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        belt_rank TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'Technique',
        description TEXT
      )
    `);

    // 6. Student Progress Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS student_syllabus_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        syllabus_item_id INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, syllabus_item_id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (syllabus_item_id) REFERENCES syllabus_items(id)
      )
    `);

    // 7. Belt Promotion History Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS belt_promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        old_belt TEXT NOT NULL,
        new_belt TEXT NOT NULL,
        promotion_date TEXT NOT NULL,
        promoted_by TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);

    // 8. Katas Library Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS katas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        japanese_name TEXT,
        belt_level TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // 9. Karate Terminology Glossary Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS glossary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        japanese_term TEXT NOT NULL,
        english_meaning TEXT NOT NULL,
        category TEXT DEFAULT 'General'
      )
    `);

    // 10. Class Training Logs Table (Module 6)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS class_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        batch TEXT NOT NULL,
        instructor_name TEXT NOT NULL,
        syllabus_covered TEXT NOT NULL,
        drills_conducted TEXT,
        general_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Student Performance Notes Table (Module 6)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS student_performance_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_log_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        rating INTEGER DEFAULT 5,
        performance_note TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_log_id) REFERENCES class_logs(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);

    // 12. Fees Management Table (Module 7)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        month_year TEXT NOT NULL,
        amount INTEGER DEFAULT 2000,
        status TEXT DEFAULT 'due' CHECK(status IN ('paid', 'due', 'overdue')),
        due_date TEXT NOT NULL,
        payment_date TEXT,
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);

    // 13. Timetable Table (Module 8)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week TEXT NOT NULL,
        batch TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        focus_area TEXT NOT NULL,
        instructor_name TEXT DEFAULT 'Afroz Khan'
      )
    `);

    // 14. Announcements Table (Module 8)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Sensei Afroz Khan',
        target_role TEXT DEFAULT 'all' CHECK(target_role IN ('all', 'students', 'parents')),
        is_pinned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 15. Competitions & Events Table (Module 9)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        event_type TEXT DEFAULT 'Tournament' CHECK(event_type IN ('Tournament', 'Camp', 'Grading Exam', 'Seminar')),
        event_date TEXT NOT NULL,
        venue TEXT NOT NULL,
        description TEXT,
        entry_fee INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 16. Competition Participations Table (Module 9)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS event_participations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competition_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        result TEXT DEFAULT 'Registered' CHECK(result IN ('Gold Medal', 'Silver Medal', 'Bronze Medal', 'Participant', 'Registered')),
        notes TEXT,
        FOREIGN KEY (competition_id) REFERENCES competitions(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);

    // Performance Indices for Stress Resilience under Load
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_students_parent_user_id ON students(parent_user_id)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_attendance_date_batch ON attendance(date, batch)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS idx_syllabus_belt ON syllabus_items(belt_rank)`);


    // Insert default Dojo Info if missing
    const dojo = await getQuery(`SELECT * FROM dojo_info LIMIT 1`);
    if (!dojo) {
      await runQuery(
        `INSERT INTO dojo_info (academy_name, style, head_instructor, instructor_phone, max_capacity) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          'Ultimate Fitness Martial Arts Academy',
          'Shotokan',
          'Afroz Khan',
          '9133538828',
          50
        ]
      );
    }

    // Seed default users if empty
    const adminCheck = await getQuery(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
    if (!adminCheck) {
      console.log('Seeding initial demo data...');
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const instPassHash = await bcrypt.hash('inst123', 10);
      const stu1PassHash = await bcrypt.hash('stu123', 10);
      const par1PassHash = await bcrypt.hash('par123', 10);
      const stu2PassHash = await bcrypt.hash('stu2123', 10);
      const par2PassHash = await bcrypt.hash('par2123', 10);

      // 1. Admin (Head Instructor Afroz Khan)
      await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['admin', adminPassHash, 'admin', 'Afroz Khan', '9133538828']
      );

      // 2. Instructor (Assisting instructor)
      await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['instructor1', instPassHash, 'instructor', 'Sensei Rahul Sharma', '9876543210']
      );

      // 3. Student 1 & Parent 1
      const stu1User = await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['STU001', stu1PassHash, 'student', 'Aarav Patel', '9123456780']
      );
      const par1User = await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['PAR001', par1PassHash, 'parent', 'Suresh Patel', '9123456781']
      );

      await runQuery(
        `INSERT INTO students 
        (student_code, user_id, parent_user_id, name, age, contact, belt_rank, batch, join_date, guardian_name, guardian_phone, guardian_relation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'STU001',
          stu1User.lastID,
          par1User.lastID,
          'Aarav Patel',
          12,
          '9123456780',
          'Orange',
          'Evening Batch 1 (5:00–6:00 PM)',
          '2024-01-15',
          'Suresh Patel',
          '9123456781',
          'Father'
        ]
      );

      // 4. Student 2 & Parent 2
      const stu2User = await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['STU002', stu2PassHash, 'student', 'Ananya Verma', '9811223344']
      );
      const par2User = await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        ['PAR002', par2PassHash, 'parent', 'Sunita Verma', '9811223345']
      );

      await runQuery(
        `INSERT INTO students 
        (student_code, user_id, parent_user_id, name, age, contact, belt_rank, batch, join_date, guardian_name, guardian_phone, guardian_relation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'STU002',
          stu2User.lastID,
          par2User.lastID,
          'Ananya Verma',
          15,
          '9811223344',
          'Green',
          'Morning (6:00–7:00 AM)',
          '2023-08-10',
          'Sunita Verma',
          '9811223345',
          'Mother'
        ]
      );
    }

    // Seed Syllabus Items if empty
    const syllabusCheck = await getQuery(`SELECT id FROM syllabus_items LIMIT 1`);
    if (!syllabusCheck) {
      console.log('Seeding default Shotokan syllabus requirements...');
      const defaultSyllabus = [
        { belt: 'White', title: 'Gedan Barai (Downward Block)', cat: 'Kihon', desc: 'Basic low block in Zenkutsu Dachi' },
        { belt: 'White', title: 'Choku Zuki (Straight Punch)', cat: 'Kihon', desc: 'Stationary straight punch focusing on hip rotation' },
        { belt: 'White', title: 'Zenkutsu Dachi (Front Stance)', cat: 'Stance', desc: '60/40 weight distribution front leg bent' },
        { belt: 'White', title: 'Dojo Etiquette & Bowing', cat: 'Theory', desc: 'Understanding Dojo Kun and bowing protocol (Rei)' },
        
        { belt: 'Yellow', title: 'Heian Shodan Kata', cat: 'Kata', desc: '20 movements focusing on Zenkutsu Dachi, Gedan Barai, Oi Zuki, and Age Uke' },
        { belt: 'Yellow', title: 'Age Uke (Rising Block)', cat: 'Kihon', desc: 'Upper level block protecting forehead' },
        { belt: 'Yellow', title: 'Mae Geri (Front Snap Kick)', cat: 'Kihon', desc: 'Snap kick with ball of foot (Koshitsubo)' },
        { belt: 'Yellow', title: 'Gohon Kumite (5-Step Sparring)', cat: 'Kumite', desc: 'Pre-arranged 5-step attack and block sparring' },

        { belt: 'Orange', title: 'Heian Nidan Kata', cat: 'Kata', desc: 'Introduces Kokutsu Dachi, Nukite, and Yoko Geri' },
        { belt: 'Orange', title: 'Kokutsu Dachi (Back Stance)', cat: 'Stance', desc: '70/30 weight distribution on back leg' },
        { belt: 'Orange', title: 'Soto Uke (Outside Block)', cat: 'Kihon', desc: 'Mid-level block from outside inwards' },
        { belt: 'Orange', title: 'Gyaku Zuki (Reverse Punch)', cat: 'Kihon', desc: 'Punching with rear arm while in front stance' },

        { belt: 'Green', title: 'Heian Sandan Kata', cat: 'Kata', desc: 'Focuses on Kiba Dachi stance, Empi elbow strike, and Fumikomi' },
        { belt: 'Green', title: 'Kiba Dachi (Horse Stance)', cat: 'Stance', desc: '50/50 side stance with knees pressed outward' },
        { belt: 'Green', title: 'Yoko Geri Keage & Kekomi', cat: 'Kihon', desc: 'Side snap kick and side thrust kick execution' },
        { belt: 'Green', title: 'Sanbon Kumite (3-Step Sparring)', cat: 'Kumite', desc: 'Three step sparring against upper, middle, and low attacks' },

        { belt: 'Purple', title: 'Heian Yondan Kata', cat: 'Kata', desc: 'Dynamic timing, Morote Uke, Kakiwake Uke, and double kicks' },
        { belt: 'Purple', title: 'Ushiro Geri (Back Kick)', cat: 'Kihon', desc: 'Thrusting back kick targeting stomach/solar plexus' },

        { belt: 'Blue', title: 'Heian Godan Kata', cat: 'Kata', desc: 'Includes jumping movement, Kamae, and crescent kick' },
        { belt: 'Blue', title: 'Kihon Ippon Kumite', cat: 'Kumite', desc: 'One-step sparring with counter attack' },

        { belt: 'Brown III', title: 'Tekki Shodan Kata', cat: 'Kata', desc: 'Entirely in Kiba Dachi stance moving laterally' },
        { belt: 'Brown II', title: 'Bassai Dai Kata', cat: 'Kata', desc: 'Penetrating a fortress - major Shotokan kata' },
        { belt: 'Brown I', title: 'Jion Kata', cat: 'Kata', desc: 'Traditional temple style kata with calm control' },
        { belt: 'Black', title: 'Kanku Dai Kata', cat: 'Kata', desc: 'Mastery kata containing 65 movements' }
      ];

      for (const item of defaultSyllabus) {
        await runQuery(
          `INSERT INTO syllabus_items (belt_rank, title, category, description) VALUES (?, ?, ?, ?)`,
          [item.belt, item.title, item.cat, item.desc]
        );
      }
    }

    // Seed Katas if empty
    const kataCheck = await getQuery(`SELECT id FROM katas LIMIT 1`);
    if (!kataCheck) {
      console.log('Seeding default Shotokan Katas...');
      const defaultKatas = [
        { name: 'Heian Shodan', jap: '平安初段', belt: 'Yellow', desc: 'Peaceful Mind Level 1. Focuses on Zenkutsu Dachi, Gedan Barai, Oi Zuki, and Age Uke.' },
        { name: 'Heian Nidan', jap: '平安二段', belt: 'Orange', desc: 'Peaceful Mind Level 2. Introduces Kokutsu Dachi (back stance), Nukite spear hand, and Yoko Geri side kick.' },
        { name: 'Heian Sandan', jap: '平安三段', belt: 'Green', desc: 'Peaceful Mind Level 3. Emphasizes Kiba Dachi stance, Fumikomi stomping kick, and Empi elbow strikes.' },
        { name: 'Heian Yondan', jap: '平安四段', belt: 'Purple', desc: 'Peaceful Mind Level 4. Features slow and fast grace, Morote Uke double block, and front snap kicks.' },
        { name: 'Heian Godan', jap: '平安五段', belt: 'Blue', desc: 'Peaceful Mind Level 5. Advanced Heian kata featuring a jump, crescent kick, and Kamae posture.' },
        { name: 'Tekki Shodan', jap: '鉄騎初段', belt: 'Brown III', desc: 'Iron Horse Level 1. Performed entirely in Kiba Dachi stance along a linear line.' },
        { name: 'Bassai Dai', jap: '披塞大', belt: 'Brown I', desc: 'To Penetrate a Fortress (Major). Dynamic, powerful kata essential for black belt grading.' },
        { name: 'Kanku Dai', jap: '観空大', belt: 'Black', desc: 'To View the Sky (Major). The benchmark Shotokan kata consisting of 65 movements.' },
        { name: 'Jion', jap: '慈恩', belt: 'Black', desc: 'Named after the Buddhist temple Jion-ji. Harmonious and direct movements.' },
        { name: 'Empi', jap: '燕飛', belt: 'Black', desc: 'Flying Swallow. Fast, sharp up-and-down changes in hips simulating a swallow in flight.' }
      ];

      for (const k of defaultKatas) {
        await runQuery(
          `INSERT INTO katas (name, japanese_name, belt_level, description) VALUES (?, ?, ?, ?)`,
          [k.name, k.jap, k.belt, k.desc]
        );
      }
    }

    // Seed Terminology Glossary if empty
    const glossaryCheck = await getQuery(`SELECT id FROM glossary LIMIT 1`);
    if (!glossaryCheck) {
      console.log('Seeding Shotokan Karate Glossary...');
      const defaultGlossary = [
        { term: 'Rei', mean: 'Bow / Show respect', cat: 'Etiquette' },
        { term: 'Sensei', mean: 'Teacher / Instructor (literally "one who has gone before")', cat: 'Etiquette' },
        { term: 'Dojo', mean: 'Training hall (literally "place of the Way")', cat: 'Etiquette' },
        { term: 'Karate', mean: 'Empty Hand (Kara = Empty, Te = Hand)', cat: 'General' },
        { term: 'Shotokan', mean: 'Pine Wave Hall - style founded by Gichin Funakoshi', cat: 'General' },
        { term: 'Oss', mean: 'Expression of respect, understanding, and perseverance', cat: 'Etiquette' },
        { term: 'Kiai', mean: 'Spirit shout to release internal power', cat: 'General' },
        { term: 'Hajime', mean: 'Begin / Start', cat: 'Commands' },
        { term: 'Yame', mean: 'Stop / Return to ready position', cat: 'Commands' },
        { term: 'Zenkutsu Dachi', mean: 'Front stance (forward long stance)', cat: 'Stances' },
        { term: 'Kokutsu Dachi', mean: 'Back stance', cat: 'Stances' },
        { term: 'Kiba Dachi', mean: 'Horse riding stance / Straddle stance', cat: 'Stances' },
        { term: 'Oi Zuki', mean: 'Stepping lunge punch', cat: 'Strikes' },
        { term: 'Gyaku Zuki', mean: 'Reverse punch (rear hand)', cat: 'Strikes' },
        { term: 'Mae Geri', mean: 'Front snap kick', cat: 'Kicks' },
        { term: 'Mawashi Geri', mean: 'Roundhouse kick', cat: 'Kicks' },
        { term: 'Yoko Geri', mean: 'Side kick (Keage = snap, Kekomi = thrust)', cat: 'Kicks' },
        { term: 'Ushiro Geri', mean: 'Back thrust kick', cat: 'Kicks' },
        { term: 'Gedan Barai', mean: 'Downward block', cat: 'Blocks' },
        { term: 'Age Uke', mean: 'Rising upper block', cat: 'Blocks' },
        { term: 'Soto Uke', mean: 'Outside forearm block', cat: 'Blocks' },
        { term: 'Uchi Uke', mean: 'Inside forearm block', cat: 'Blocks' },
        { term: 'Shuto Uke', mean: 'Knife-hand block', cat: 'Blocks' }
      ];

      for (const g of defaultGlossary) {
        await runQuery(
          `INSERT INTO glossary (japanese_term, english_meaning, category) VALUES (?, ?, ?)`,
          [g.term, g.mean, g.cat]
        );
      }
    }

    // Seed Timetable if empty
    const timetableCheck = await getQuery(`SELECT id FROM timetable LIMIT 1`);
    if (!timetableCheck) {
      console.log('Seeding Weekly Timetable...');
      const defaultTimetable = [
        { day: 'Monday', batch: 'Morning (6:00–7:00 AM)', time: '6:00 AM – 7:00 AM', focus: 'Kihon Basics & Stances' },
        { day: 'Monday', batch: 'Evening Batch 1 (5:00–6:00 PM)', time: '5:00 PM – 6:00 PM', focus: 'Heian Katas & Bunkai' },
        { day: 'Monday', batch: 'Evening Batch 2 (6:30–7:30 PM)', time: '6:30 PM – 7:30 PM', focus: 'Sparring & Conditioning' },

        { day: 'Wednesday', batch: 'Morning (6:00–7:00 AM)', time: '6:00 AM – 7:00 AM', focus: 'Speed Kicks & Footwork' },
        { day: 'Wednesday', batch: 'Evening Batch 1 (5:00–6:00 PM)', time: '5:00 PM – 6:00 PM', focus: 'Block & Counter Drills' },
        { day: 'Wednesday', batch: 'Evening Batch 2 (6:30–7:30 PM)', time: '6:30 PM – 7:30 PM', focus: 'Advanced Katas (Bassai Dai)' },

        { day: 'Friday', batch: 'Morning (6:00–7:00 AM)', time: '6:00 AM – 7:00 AM', focus: 'Sanbon Kumite Drills' },
        { day: 'Friday', batch: 'Evening Batch 1 (5:00–6:00 PM)', time: '5:00 PM – 6:00 PM', focus: 'Grading Syllabus Practice' },
        { day: 'Friday', batch: 'Evening Batch 2 (6:30–7:30 PM)', time: '6:30 PM – 7:30 PM', focus: 'Competition Tournament Prep' }
      ];

      for (const t of defaultTimetable) {
        await runQuery(
          `INSERT INTO timetable (day_of_week, batch, time_slot, focus_area, instructor_name) VALUES (?, ?, ?, ?, ?)`,
          [t.day, t.batch, t.time, t.focus, 'Sensei Afroz Khan']
        );
      }
    }

    // Seed Fees if empty
    const feesCheck = await getQuery(`SELECT id FROM fees LIMIT 1`);
    if (!feesCheck) {
      console.log('Seeding initial Fees data...');
      await runQuery(
        `INSERT INTO fees (student_id, month_year, amount, status, due_date, payment_date, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, '2026-09', 2000, 'paid', '2026-09-05', '2026-09-02', 'UPI / Online', 'Monthly tuition fee paid']
      );
      await runQuery(
        `INSERT INTO fees (student_id, month_year, amount, status, due_date, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [2, '2026-09', 2000, 'overdue', '2026-09-05', 'Fee payment pending for September']
      );
    }

    // Seed Announcements if empty
    const annCheck = await getQuery(`SELECT id FROM announcements LIMIT 1`);
    if (!annCheck) {
      console.log('Seeding Announcements...');
      await runQuery(
        `INSERT INTO announcements (title, content, author, target_role, is_pinned) VALUES (?, ?, ?, ?, ?)`,
        [
          'Annual Shotokan Karate Championship 2026 Registration Open!',
          'All students from Green Belt and above are invited to register for the upcoming State Level Karate Championship. Contact Sensei Afroz Khan for details.',
          'Sensei Afroz Khan',
          'all',
          1
        ]
      );
      await runQuery(
        `INSERT INTO announcements (title, content, author, target_role, is_pinned) VALUES (?, ?, ?, ?, ?)`,
        [
          'Quarterly Belt Promotion Grading Exam Date',
          'The upcoming belt grading examination will take place on October 15th at the main dojo hall. Please ensure your syllabus checklist items are verified.',
          'Sensei Afroz Khan',
          'all',
          0
        ]
      );
    }

    // Seed Competitions if empty
    const compCheck = await getQuery(`SELECT id FROM competitions LIMIT 1`);
    if (!compCheck) {
      console.log('Seeding Competitions & Events...');
      const compRes = await runQuery(
        `INSERT INTO competitions (title, event_type, event_date, venue, description, entry_fee) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'State Shotokan Martial Arts Championship 2026',
          'Tournament',
          '2026-10-24',
          'Indoor Sports Complex, Hyderabad',
          'Inter-dojo kata and kumite championship across all weight & belt divisions.',
          500
        ]
      );

      await runQuery(
        `INSERT INTO event_participations (competition_id, student_id, category, result, notes) VALUES (?, ?, ?, ?, ?)`,
        [compRes.lastID, 1, 'Junior Kata (12-14 yrs)', 'Gold Medal', 'Outstanding Heian Nidan execution']
      );
    }
  });
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  initDatabase,
  BELT_RANKS,
  BATCHES
};
