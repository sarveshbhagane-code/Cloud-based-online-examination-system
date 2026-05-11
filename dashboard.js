const express = require('express');
const db = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/admin', authenticate, requireAdmin, (req, res) => {
  try {
    const totalStudents = db.count('users', u => u.role === 'student');
    const totalExams = db.count('exams');
    const completedAttempts = db.findMany('exam_attempts', a => a.status === 'completed');
    const totalAttempts = completedAttempts.length;
    const totalQuestions = db.count('questions');
    const avgScore = totalAttempts > 0 ? Math.round(completedAttempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts * 100) / 100 : 0;
    let passed = 0;
    completedAttempts.forEach(a => { const e = db.findOne('exams', ex => ex.id === a.exam_id); if (e && a.score >= e.passing_marks) passed++; });
    const passRate = totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0;
    const recentAttempts = completedAttempts.sort((a, b) => new Date(b.end_time) - new Date(a.end_time)).slice(0, 10).map(a => {
      const u = db.findOne('users', u2 => u2.id === a.user_id);
      const e = db.findOne('exams', ex => ex.id === a.exam_id);
      return { ...a, student_name: u ? u.name : 'Unknown', exam_title: e ? e.title : 'Unknown' };
    });
    res.json({ stats: { totalStudents, totalExams, publishedExams: db.count('exams', e => e.status === 'published'), totalAttempts, totalQuestions, avgScore, passRate }, recentAttempts });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load dashboard.' }); }
});

router.get('/student', authenticate, (req, res) => {
  try {
    const uid = req.user.id;
    const totalExamsAvailable = db.count('exams', e => e.status === 'published');
    const myAttempts = db.findMany('exam_attempts', a => a.user_id === uid && a.status === 'completed');
    const examsTaken = [...new Set(myAttempts.map(a => a.exam_id))].length;
    const avgScore = myAttempts.length > 0 ? Math.round(myAttempts.reduce((s, a) => s + a.percentage, 0) / myAttempts.length * 100) / 100 : 0;
    let passed = 0, failed = 0;
    myAttempts.forEach(a => { const e = db.findOne('exams', ex => ex.id === a.exam_id); if (e && a.score >= e.passing_marks) passed++; else failed++; });
    const recentResults = myAttempts.sort((a, b) => new Date(b.end_time) - new Date(a.end_time)).slice(0, 10).map(a => {
      const e = db.findOne('exams', ex => ex.id === a.exam_id);
      return { ...a, exam_title: e ? e.title : 'Unknown', subject: e ? e.subject : '', exam_passing_marks: e ? e.passing_marks : 0 };
    });
    res.json({ stats: { totalExamsAvailable, examsTaken, avgScore, passed, failed }, recentResults });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load dashboard.' }); }
});

router.get('/leaderboard', authenticate, (req, res) => {
  try {
    const students = db.findMany('users', u => u.role === 'student');
    const leaderboard = students.map(s => {
      const attempts = db.findMany('exam_attempts', a => a.user_id === s.id && a.status === 'completed');
      if (!attempts.length) return null;
      return { id: s.id, name: s.name, avatar_color: s.avatar_color, exams_taken: attempts.length, avg_score: attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length, best_score: Math.max(...attempts.map(a => a.percentage)) };
    }).filter(Boolean).sort((a, b) => b.avg_score - a.avg_score).slice(0, 20);
    res.json({ leaderboard });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load leaderboard.' }); }
});

module.exports = router;
