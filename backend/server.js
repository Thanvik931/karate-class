const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const {
  db,
  runQuery,
  getQuery,
  allQuery,
  initDatabase,
  BELT_RANKS,
  BATCHES
} = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ultimate_dojo_secret_key_2026_shotokan';

// Process-level crash prevention for production resilience under load
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize database
initDatabase().catch(err => console.error('Database initialization error:', err));

// Uptime Health Check Endpoint for Cloud Monitoring (Cloud Run, Render, Railway, AWS, Heroku)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dojo: 'Ultimate Fitness Martial Arts Academy',
    uptime_seconds: process.uptime()
  });
});


// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Role Authorization Middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role action' });
    }
    next();
  };
}

const ADMIN_SECURITY_PIN = process.env.ADMIN_SECURITY_PIN || 'DOJO2026';

// --- AUTH ROUTES ---

// Public Registration / Self-Signup Route with Admin Security Verification
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      role = 'student',
      phone,
      admin_security_pin,
      age,
      batch,
      guardian_name,
      guardian_phone,
      guardian_relation
    } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, Username/Code, and Password are required' });
    }

    // SECURITY CHECK: Admin or Instructor Registration requires valid Master Admin Security PIN
    if (role === 'admin' || role === 'instructor') {
      if (!admin_security_pin || admin_security_pin.trim() !== ADMIN_SECURITY_PIN) {
        return res.status(403).json({
          error: 'Security Authorization Failed: Invalid Master Admin Security PIN. Cannot grant Admin/Instructor access.'
        });
      }
    }

    // Check if username already exists
    const existing = await getQuery(`SELECT id FROM users WHERE username = ?`, [username.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Username or Login ID already registered. Please choose another or sign in.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Create user account
    const userRes = await runQuery(
      `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
      [username.trim(), password_hash, role, name.trim(), phone || '']
    );

    const userId = userRes.lastID;
    let studentDetails = null;

    // If registering as a student, create student profile & linked parent user
    if (role === 'student') {
      const dojo = await getQuery(`SELECT max_capacity FROM dojo_info LIMIT 1`);
      const countRow = await getQuery(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`);
      if (countRow.count >= dojo.max_capacity) {
        return res.status(400).json({ error: `Dojo capacity limit reached (${dojo.max_capacity} students max).` });
      }

      const parentCode = `PAR_${username.trim()}`;
      const parentHash = await bcrypt.hash(`par123`, 10);
      const parentRes = await runQuery(
        `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
        [parentCode, parentHash, 'parent', guardian_name || `Parent of ${name}`, guardian_phone || phone || '']
      );

      const today = new Date().toISOString().split('T')[0];
      const stuRes = await runQuery(
        `INSERT INTO students 
        (student_code, user_id, parent_user_id, name, age, contact, belt_rank, batch, join_date, guardian_name, guardian_phone, guardian_relation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username.trim().toUpperCase(),
          userId,
          parentRes.lastID,
          name.trim(),
          age ? parseInt(age) : 12,
          phone || '9999999999',
          'White',
          batch || BATCHES[0],
          today,
          guardian_name || 'Parent/Guardian',
          guardian_phone || phone || '9999999999',
          guardian_relation || 'Parent'
        ]
      );

      studentDetails = await getQuery(`SELECT * FROM students WHERE id = ?`, [stuRes.lastID]);
    }

    const tokenPayload = { id: userId, username: username.trim(), role, name: name.trim() };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: {
        id: userId,
        username: username.trim(),
        role,
        name: name.trim(),
        phone,
        studentDetails
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await getQuery(`SELECT * FROM users WHERE username = ?`, [username.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    let studentDetails = null;
    if (user.role === 'student') {
      studentDetails = await getQuery(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
    } else if (user.role === 'parent') {
      studentDetails = await getQuery(`SELECT * FROM students WHERE parent_user_id = ?`, [user.id]);
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
        studentDetails
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(`SELECT id, username, role, name, phone FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let studentDetails = null;
    if (user.role === 'student') {
      studentDetails = await getQuery(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
    } else if (user.role === 'parent') {
      studentDetails = await getQuery(`SELECT * FROM students WHERE parent_user_id = ?`, [user.id]);
    }

    res.json({ user: { ...user, studentDetails } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// --- DOJO INFO ---

app.get('/api/dojo/info', async (req, res) => {
  try {
    const dojo = await getQuery(`SELECT * FROM dojo_info LIMIT 1`);
    const studentCountRow = await getQuery(`SELECT COUNT(*) as activeCount FROM students WHERE status = 'active'`);
    const activeCount = studentCountRow ? studentCountRow.activeCount : 0;

    res.json({
      ...dojo,
      active_students_count: activeCount,
      capacity_percentage: Math.round((activeCount / (dojo.max_capacity || 50)) * 100),
      belt_ranks: BELT_RANKS,
      batches: BATCHES
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dojo info' });
  }
});

// --- STUDENT PROFILES (MODULE 2) ---

app.get('/api/students', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { search, belt, batch } = req.query;
    let sql = `
      SELECT s.*, u.username as student_username, pu.username as parent_username
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users pu ON s.parent_user_id = pu.id
      WHERE s.status = 'active'
    `;
    const params = [];

    if (belt) {
      sql += ` AND s.belt_rank = ?`;
      params.push(belt);
    }
    if (batch) {
      sql += ` AND s.batch = ?`;
      params.push(batch);
    }
    if (search) {
      sql += ` AND (s.name LIKE ? OR s.student_code LIKE ? OR s.guardian_name LIKE ? OR s.contact LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY s.id DESC`;

    const students = await allQuery(sql, params);
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students list' });
  }
});

app.post('/api/students', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      age,
      contact,
      belt_rank,
      batch,
      join_date,
      guardian_name,
      guardian_phone,
      guardian_relation
    } = req.body;

    if (!name || !age || !contact || !belt_rank || !batch || !guardian_name || !guardian_phone) {
      return res.status(400).json({ error: 'Missing required student/guardian fields' });
    }

    const dojo = await getQuery(`SELECT max_capacity FROM dojo_info LIMIT 1`);
    const countRow = await getQuery(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`);
    if (countRow.count >= dojo.max_capacity) {
      return res.status(400).json({
        error: `Dojo capacity limit reached (${dojo.max_capacity} students max). Cannot add more students.`
      });
    }

    const lastStu = await getQuery(`SELECT id FROM students ORDER BY id DESC LIMIT 1`);
    const nextNum = lastStu ? lastStu.id + 1 : 1;
    const student_code = `STU${String(nextNum).padStart(3, '0')}`;
    const parent_code = `PAR${String(nextNum).padStart(3, '0')}`;

    const studentPass = `stu${nextNum}123`;
    const parentPass = `par${nextNum}123`;

    const stuHash = await bcrypt.hash(studentPass, 10);
    const parHash = await bcrypt.hash(parentPass, 10);

    const stuUserRes = await runQuery(
      `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
      [student_code, stuHash, 'student', name, contact]
    );

    const parUserRes = await runQuery(
      `INSERT INTO users (username, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
      [parent_code, parHash, 'parent', guardian_name, guardian_phone]
    );

    const today = join_date || new Date().toISOString().split('T')[0];
    const studentRes = await runQuery(
      `INSERT INTO students 
      (student_code, user_id, parent_user_id, name, age, contact, belt_rank, batch, join_date, guardian_name, guardian_phone, guardian_relation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_code,
        stuUserRes.lastID,
        parUserRes.lastID,
        name.trim(),
        parseInt(age),
        contact.trim(),
        belt_rank,
        batch,
        today,
        guardian_name.trim(),
        guardian_phone.trim(),
        guardian_relation || 'Parent'
      ]
    );

    // Auto generate current month fee
    const currentMonth = new Date().toISOString().slice(0, 7);
    await runQuery(
      `INSERT INTO fees (student_id, month_year, amount, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [studentRes.lastID, currentMonth, 2000, 'due', `${currentMonth}-05`, 'Initial registration fee due']
    );

    res.status(201).json({
      message: 'Student created successfully',
      student_id: studentRes.lastID,
      credentials: {
        student: { username: student_code, password: studentPass },
        parent: { username: parent_code, password: parentPass }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create student profile' });
  }
});

app.put('/api/students/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      name,
      age,
      contact,
      belt_rank,
      batch,
      join_date,
      guardian_name,
      guardian_phone,
      guardian_relation
    } = req.body;

    const existing = await getQuery(`SELECT * FROM students WHERE id = ?`, [studentId]);
    if (!existing) return res.status(404).json({ error: 'Student not found' });

    await runQuery(
      `UPDATE students SET 
        name = ?, age = ?, contact = ?, belt_rank = ?, batch = ?, join_date = ?, guardian_name = ?, guardian_phone = ?, guardian_relation = ?
       WHERE id = ?`,
      [
        name || existing.name,
        age ? parseInt(age) : existing.age,
        contact || existing.contact,
        belt_rank || existing.belt_rank,
        batch || existing.batch,
        join_date || existing.join_date,
        guardian_name || existing.guardian_name,
        guardian_phone || existing.guardian_phone,
        guardian_relation || existing.guardian_relation,
        studentId
      ]
    );

    if (name) {
      await runQuery(`UPDATE users SET name = ? WHERE id = ?`, [name, existing.user_id]);
    }

    res.json({ message: 'Student profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

app.delete('/api/students/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const studentId = req.params.id;
    await runQuery(`UPDATE students SET status = 'inactive' WHERE id = ?`, [studentId]);
    res.json({ message: 'Student profile deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.get('/api/students/profile', authenticateToken, async (req, res) => {
  try {
    let student = null;
    if (req.user.role === 'student') {
      student = await getQuery(`SELECT * FROM students WHERE user_id = ?`, [req.user.id]);
    } else if (req.user.role === 'parent') {
      student = await getQuery(`SELECT * FROM students WHERE parent_user_id = ?`, [req.user.id]);
    } else {
      return res.status(400).json({ error: 'This route is for student/parent roles' });
    }

    if (!student) return res.status(404).json({ error: 'No associated student profile found' });

    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// --- ATTENDANCE TRACKING (MODULE 4) ---

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { date, batch } = req.query;
    if (!date || !batch) return res.status(400).json({ error: 'Date and batch required' });

    const records = await allQuery(
      `SELECT a.*, s.name as student_name, s.student_code
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.date = ? AND a.batch = ?`,
      [date, batch]
    );

    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { date, batch, attendanceData } = req.body;
    if (!date || !batch || !Array.isArray(attendanceData)) return res.status(400).json({ error: 'Invalid data' });

    for (const item of attendanceData) {
      const existing = await getQuery(
        `SELECT id FROM attendance WHERE student_id = ? AND date = ? AND batch = ?`,
        [item.student_id, date, batch]
      );

      if (existing) {
        await runQuery(`UPDATE attendance SET status = ?, notes = ? WHERE id = ?`, [item.status, item.notes || '', existing.id]);
      } else {
        await runQuery(
          `INSERT INTO attendance (student_id, batch, date, status, notes) VALUES (?, ?, ?, ?, ?)`,
          [item.student_id, batch, date, item.status, item.notes || '']
        );
      }
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

app.get('/api/attendance/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await allQuery(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30`, [req.params.studentId]);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

// --- BELT & SYLLABUS, KATAS, GLOSSARY (MODULE 5) ---

app.get('/api/syllabus', authenticateToken, async (req, res) => {
  try {
    const { belt } = req.query;
    let sql = `SELECT * FROM syllabus_items`;
    const params = [];
    if (belt) {
      sql += ` WHERE belt_rank = ?`;
      params.push(belt);
    }
    sql += ` ORDER BY id ASC`;
    const items = await allQuery(sql, params);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch syllabus' });
  }
});

app.post('/api/syllabus', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { belt_rank, title, category, description } = req.body;
    const result = await runQuery(
      `INSERT INTO syllabus_items (belt_rank, title, category, description) VALUES (?, ?, ?, ?)`,
      [belt_rank, title.trim(), category || 'Technique', description || '']
    );
    res.status(201).json({ message: 'Syllabus item added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add syllabus item' });
  }
});

app.put('/api/syllabus/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { belt_rank, title, category, description } = req.body;
    await runQuery(
      `UPDATE syllabus_items SET belt_rank = ?, title = ?, category = ?, description = ? WHERE id = ?`,
      [belt_rank, title, category, description, req.params.id]
    );
    res.json({ message: 'Syllabus item updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update syllabus item' });
  }
});

app.delete('/api/syllabus/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    await runQuery(`DELETE FROM syllabus_items WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Syllabus item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete syllabus item' });
  }
});

app.get('/api/syllabus/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const progress = await allQuery(`SELECT syllabus_item_id FROM student_syllabus_progress WHERE student_id = ?`, [req.params.studentId]);
    res.json({ completedIds: progress.map(p => p.syllabus_item_id) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/syllabus/student/:studentId/toggle', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { syllabus_item_id } = req.body;
    const existing = await getQuery(
      `SELECT id FROM student_syllabus_progress WHERE student_id = ? AND syllabus_item_id = ?`,
      [studentId, syllabus_item_id]
    );

    if (existing) {
      await runQuery(`DELETE FROM student_syllabus_progress WHERE id = ?`, [existing.id]);
      res.json({ completed: false });
    } else {
      await runQuery(`INSERT INTO student_syllabus_progress (student_id, syllabus_item_id) VALUES (?, ?)`, [studentId, syllabus_item_id]);
      res.json({ completed: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle progress' });
  }
});

app.get('/api/promotions/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const history = await allQuery(`SELECT * FROM belt_promotions WHERE student_id = ? ORDER BY id DESC`, [req.params.studentId]);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

app.post('/api/promotions', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { student_id, new_belt, notes, promotion_date } = req.body;
    const student = await getQuery(`SELECT * FROM students WHERE id = ?`, [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const old_belt = student.belt_rank;
    const pDate = promotion_date || new Date().toISOString().split('T')[0];

    await runQuery(
      `INSERT INTO belt_promotions (student_id, old_belt, new_belt, promotion_date, promoted_by, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, old_belt, new_belt, pDate, req.user.name || 'Sensei Afroz Khan', notes || '']
    );

    await runQuery(`UPDATE students SET belt_rank = ? WHERE id = ?`, [new_belt, student_id]);

    res.json({ message: `Student promoted from ${old_belt} to ${new_belt} successfully!`, old_belt, new_belt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to promote student' });
  }
});

app.get('/api/katas', authenticateToken, async (req, res) => {
  try {
    const { belt } = req.query;
    let sql = `SELECT * FROM katas`;
    const params = [];
    if (belt) {
      sql += ` WHERE belt_level = ?`;
      params.push(belt);
    }
    sql += ` ORDER BY id ASC`;
    const katas = await allQuery(sql, params);
    res.json({ katas });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch katas' });
  }
});

app.post('/api/katas', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { name, japanese_name, belt_level, description } = req.body;
    const result = await runQuery(
      `INSERT INTO katas (name, japanese_name, belt_level, description) VALUES (?, ?, ?, ?)`,
      [name.trim(), japanese_name || '', belt_level, description.trim()]
    );
    res.status(201).json({ message: 'Kata added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add Kata' });
  }
});

app.put('/api/katas/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { name, japanese_name, belt_level, description } = req.body;
    await runQuery(
      `UPDATE katas SET name = ?, japanese_name = ?, belt_level = ?, description = ? WHERE id = ?`,
      [name, japanese_name, belt_level, description, req.params.id]
    );
    res.json({ message: 'Kata updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Kata' });
  }
});

app.delete('/api/katas/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    await runQuery(`DELETE FROM katas WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Kata deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete Kata' });
  }
});

app.get('/api/glossary', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql = `SELECT * FROM glossary WHERE 1=1`;
    const params = [];
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (japanese_term LIKE ? OR english_meaning LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term);
    }
    sql += ` ORDER BY japanese_term ASC`;
    const terms = await allQuery(sql, params);
    res.json({ terms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

app.post('/api/glossary', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { japanese_term, english_meaning, category } = req.body;
    const result = await runQuery(
      `INSERT INTO glossary (japanese_term, english_meaning, category) VALUES (?, ?, ?)`,
      [japanese_term.trim(), english_meaning.trim(), category || 'General']
    );
    res.status(201).json({ message: 'Term added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add term' });
  }
});

// --- CLASS / TRAINING LOGS (MODULE 6) ---

app.get('/api/class-logs', authenticateToken, async (req, res) => {
  try {
    const { batch } = req.query;
    let sql = `SELECT * FROM class_logs`;
    const params = [];
    if (batch) {
      sql += ` WHERE batch = ?`;
      params.push(batch);
    }
    sql += ` ORDER BY id DESC LIMIT 50`;
    const logs = await allQuery(sql, params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class logs' });
  }
});

app.post('/api/class-logs', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { date, batch, syllabus_covered, drills_conducted, general_notes, performance_notes } = req.body;
    if (!date || !batch || !syllabus_covered) {
      return res.status(400).json({ error: 'Date, batch, and syllabus covered are required' });
    }

    const logRes = await runQuery(
      `INSERT INTO class_logs (date, batch, instructor_name, syllabus_covered, drills_conducted, general_notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [date, batch, req.user.name || 'Sensei Afroz Khan', syllabus_covered, drills_conducted || '', general_notes || '']
    );

    const classLogId = logRes.lastID;

    if (Array.isArray(performance_notes)) {
      for (const note of performance_notes) {
        if (note.student_id && note.performance_note) {
          await runQuery(
            `INSERT INTO student_performance_notes (class_log_id, student_id, rating, performance_note) VALUES (?, ?, ?, ?)`,
            [classLogId, note.student_id, note.rating || 5, note.performance_note]
          );
        }
      }
    }

    res.status(201).json({ message: 'Training log created', id: classLogId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save class log' });
  }
});

app.get('/api/class-logs/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const notes = await allQuery(
      `SELECT spn.*, cl.date, cl.batch, cl.syllabus_covered, cl.instructor_name
       FROM student_performance_notes spn
       JOIN class_logs cl ON spn.class_log_id = cl.id
       WHERE spn.student_id = ?
       ORDER BY cl.date DESC`,
      [req.params.studentId]
    );
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student training performance' });
  }
});

// --- FEES MANAGEMENT (MODULE 7) ---

app.get('/api/fees', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { month, status } = req.query;
    let sql = `
      SELECT f.*, s.name as student_name, s.student_code, s.contact, s.guardian_name, s.guardian_phone
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (month) {
      sql += ` AND f.month_year = ?`;
      params.push(month);
    }
    if (status) {
      sql += ` AND f.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY f.id DESC`;

    const feeRecords = await allQuery(sql, params);
    res.json({ feeRecords });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

app.post('/api/fees', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id, month_year, amount, due_date, notes } = req.body;
    if (!student_id || !month_year || !amount || !due_date) {
      return res.status(400).json({ error: 'Student, month, amount, and due date are required' });
    }

    const result = await runQuery(
      `INSERT INTO fees (student_id, month_year, amount, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, month_year, amount, 'due', due_date, notes || '']
    );

    res.status(201).json({ message: 'Fee record created', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create fee record' });
  }
});

app.put('/api/fees/:id/pay', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { payment_method, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    await runQuery(
      `UPDATE fees SET status = 'paid', payment_date = ?, payment_method = ?, notes = ? WHERE id = ?`,
      [today, payment_method || 'Cash / Online', notes || 'Paid in full', req.params.id]
    );
    res.json({ message: 'Fee payment recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

app.get('/api/fees/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const feeRecords = await allQuery(
      `SELECT * FROM fees WHERE student_id = ? ORDER BY month_year DESC`,
      [req.params.studentId]
    );
    res.json({ feeRecords });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student fee records' });
  }
});

// --- TIMETABLE & ANNOUNCEMENTS (MODULE 8) ---

app.get('/api/timetable', authenticateToken, async (req, res) => {
  try {
    const schedule = await allQuery(`SELECT * FROM timetable ORDER BY id ASC`);
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

app.post('/api/timetable', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { day_of_week, batch, time_slot, focus_area, instructor_name } = req.body;
    const result = await runQuery(
      `INSERT INTO timetable (day_of_week, batch, time_slot, focus_area, instructor_name) VALUES (?, ?, ?, ?, ?)`,
      [day_of_week, batch, time_slot, focus_area, instructor_name || 'Sensei Afroz Khan']
    );
    res.status(201).json({ message: 'Timetable entry added', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add timetable entry' });
  }
});

app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await allQuery(`SELECT * FROM announcements ORDER BY is_pinned DESC, id DESC`);
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/announcements', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { title, content, target_role, is_pinned } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const result = await runQuery(
      `INSERT INTO announcements (title, content, author, target_role, is_pinned) VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), content.trim(), req.user.name || 'Sensei Afroz Khan', target_role || 'all', is_pinned ? 1 : 0]
    );

    res.status(201).json({ message: 'Announcement posted', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

app.delete('/api/announcements/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    await runQuery(`DELETE FROM announcements WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// --- COMPETITIONS & EVENTS (MODULE 9) ---

app.get('/api/competitions', authenticateToken, async (req, res) => {
  try {
    const competitions = await allQuery(`SELECT * FROM competitions ORDER BY event_date DESC`);
    res.json({ competitions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

app.post('/api/competitions', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { title, event_type, event_date, venue, description, entry_fee } = req.body;
    if (!title || !event_date || !venue) {
      return res.status(400).json({ error: 'Title, date, and venue are required' });
    }

    const result = await runQuery(
      `INSERT INTO competitions (title, event_type, event_date, venue, description, entry_fee) VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), event_type || 'Tournament', event_date, venue.trim(), description || '', entry_fee || 0]
    );

    res.status(201).json({ message: 'Event created', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/competitions/:id/participations', authenticateToken, async (req, res) => {
  try {
    const participations = await allQuery(
      `SELECT ep.*, s.name as student_name, s.student_code, s.belt_rank
       FROM event_participations ep
       JOIN students s ON ep.student_id = s.id
       WHERE ep.competition_id = ?`,
      [req.params.id]
    );
    res.json({ participations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch participations' });
  }
});

app.post('/api/competitions/:id/participations', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const competition_id = req.params.id;
    const { student_id, category, result, notes } = req.body;

    if (!student_id || !category) {
      return res.status(400).json({ error: 'Student and category required' });
    }

    const existing = await getQuery(
      `SELECT id FROM event_participations WHERE competition_id = ? AND student_id = ?`,
      [competition_id, student_id]
    );

    if (existing) {
      await runQuery(
        `UPDATE event_participations SET category = ?, result = ?, notes = ? WHERE id = ?`,
        [category, result || 'Registered', notes || '', existing.id]
      );
    } else {
      await runQuery(
        `INSERT INTO event_participations (competition_id, student_id, category, result, notes) VALUES (?, ?, ?, ?, ?)`,
        [competition_id, student_id, category, result || 'Registered', notes || '']
      );
    }

    res.json({ message: 'Participation record updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record participation' });
  }
});

// Wildcard route for React SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
});

module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Ultimate Dojo ERP Backend running on http://localhost:${PORT}`);
  });
}

