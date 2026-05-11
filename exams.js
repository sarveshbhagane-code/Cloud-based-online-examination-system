const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET all exams
router.get('/', authenticate, (req, res) => {
  try {
    let exams = db.getAll('exams');
    if (req.user.role !== 'admin') exams = exams.filter(e => e.status === 'published');
    exams = exams.map(e => ({
      ...e,
      question_count: db.count('questions', q => q.exam_id === e.id),
      attempt_count: db.count('exam_attempts', a => a.exam_id === e.id && a.status === 'completed'),
      my_attempts: req.user.role !== 'admin' ? db.count('exam_attempts', a => a.exam_id === e.id && a.user_id === req.user.id && a.status === 'completed') : 0
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ exams });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch exams.' }); }
});

// GET single exam
router.get('/:id', authenticate, (req, res) => {
  try {
    const exam = db.findOne('exams', e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    exam.question_count = db.count('questions', q => q.exam_id === exam.id);
    if (req.user.role === 'admin') {
      exam.questions = db.findMany('questions', q => q.exam_id === exam.id).sort((a, b) => a.order_index - b.order_index);
    }
    res.json({ exam });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch exam.' }); }
});

// CREATE exam
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { title, description, subject, duration, passing_marks, max_attempts } = req.body;
    if (!title || !subject) return res.status(400).json({ error: 'Title and subject are required.' });
    const exam = {
      id: uuidv4(), title, description: description || '', subject, duration: duration || 30,
      total_marks: 0, passing_marks: passing_marks || 6, max_attempts: max_attempts || 1,
      shuffle_questions: 0, show_results: 1, status: 'draft', created_by: req.user.id, created_at: new Date().toISOString()
    };
    db.insert('exams', exam);
    res.status(201).json({ message: 'Exam created!', exam });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create exam.' }); }
});

// UPDATE exam
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const exam = db.findOne('exams', e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    const updates = {};
    ['title','description','subject','duration','passing_marks','max_attempts','status'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const questions = db.findMany('questions', q => q.exam_id === req.params.id);
    updates.total_marks = questions.reduce((s, q) => s + q.marks, 0);
    const updated = db.update('exams', e => e.id === req.params.id, updates);
    res.json({ message: 'Exam updated!', exam: updated });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update exam.' }); }
});

// DELETE exam
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    db.delete('exam_attempts', a => a.exam_id === req.params.id);
    db.delete('questions', q => q.exam_id === req.params.id);
    db.delete('exams', e => e.id === req.params.id);
    res.json({ message: 'Exam deleted!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete exam.' }); }
});

// ADD questions
router.post('/:id/questions', authenticate, requireAdmin, (req, res) => {
  try {
    const { questions } = req.body;
    if (!questions || !questions.length) return res.status(400).json({ error: 'Questions required.' });
    const currentCount = db.count('questions', q => q.exam_id === req.params.id);
    questions.forEach((q, i) => {
      db.insert('questions', {
        id: uuidv4(), exam_id: req.params.id, question_text: q.question_text,
        question_type: q.question_type || 'mcq', options: q.options || [],
        correct_answer: q.correct_answer, marks: q.marks || 1,
        explanation: q.explanation || null, order_index: currentCount + i
      });
    });
    const totalMarks = db.findMany('questions', q => q.exam_id === req.params.id).reduce((s, q) => s + q.marks, 0);
    db.update('exams', e => e.id === req.params.id, { total_marks: totalMarks });
    res.status(201).json({ message: `${questions.length} question(s) added!` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add questions.' }); }
});

// START exam
router.post('/:id/start', authenticate, (req, res) => {
  try {
    const exam = db.findOne('exams', e => e.id === req.params.id && e.status === 'published');
    if (!exam) return res.status(404).json({ error: 'Exam not found or not available.' });
    const inProgress = db.findOne('exam_attempts', a => a.exam_id === req.params.id && a.user_id === req.user.id && a.status === 'in_progress');
    const questions = db.findMany('questions', q => q.exam_id === req.params.id).sort((a, b) => a.order_index - b.order_index)
      .map(q => ({ id: q.id, question_text: q.question_text, question_type: q.question_type, options: q.options, marks: q.marks, order_index: q.order_index }));
    if (inProgress) return res.json({ message: 'Resuming attempt.', attempt: inProgress, questions, exam: { title: exam.title, duration: exam.duration, total_marks: exam.total_marks } });
    const completed = db.count('exam_attempts', a => a.exam_id === req.params.id && a.user_id === req.user.id && (a.status === 'completed' || a.status === 'timed_out'));
    if (completed >= exam.max_attempts) return res.status(403).json({ error: `Max attempts (${exam.max_attempts}) reached.` });
    const attempt = { id: uuidv4(), exam_id: req.params.id, user_id: req.user.id, start_time: new Date().toISOString(), total_marks: exam.total_marks, status: 'in_progress', answers: {} };
    db.insert('exam_attempts', attempt);
    res.json({ message: 'Exam started!', attempt, questions, exam: { title: exam.title, duration: exam.duration, total_marks: exam.total_marks } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to start exam.' }); }
});

// SUBMIT exam
router.post('/:id/submit', authenticate, (req, res) => {
  try {
    const { attempt_id, answers } = req.body;
    const attempt = db.findOne('exam_attempts', a => a.id === attempt_id && a.user_id === req.user.id && a.status === 'in_progress');
    if (!attempt) return res.status(404).json({ error: 'No active attempt found.' });
    const questions = db.findMany('questions', q => q.exam_id === req.params.id);
    let score = 0;
    const graded = {};
    questions.forEach(q => {
      const ua = (answers[q.id] || '').toString().trim().toLowerCase();
      const ca = q.correct_answer.toString().trim().toLowerCase();
      const correct = ua === ca;
      if (correct) score += q.marks;
      graded[q.id] = { user_answer: answers[q.id] || '', correct_answer: q.correct_answer, is_correct: correct, marks_obtained: correct ? q.marks : 0, marks_possible: q.marks };
    });
    const pct = attempt.total_marks > 0 ? Math.round((score / attempt.total_marks) * 10000) / 100 : 0;
    const timeSpent = Math.floor((Date.now() - new Date(attempt.start_time).getTime()) / 1000);
    db.update('exam_attempts', a => a.id === attempt_id, { end_time: new Date().toISOString(), time_spent: timeSpent, score, percentage: pct, status: 'completed', answers: graded });
    const exam = db.findOne('exams', e => e.id === req.params.id);
    res.json({ message: 'Exam submitted!', result: { score, total_marks: attempt.total_marks, percentage: pct, passed: score >= exam.passing_marks, time_spent: timeSpent, graded_answers: graded } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit exam.' }); }
});

// GET results
router.get('/:id/results', authenticate, (req, res) => {
  try {
    let attempts;
    if (req.user.role === 'admin') {
      attempts = db.findMany('exam_attempts', a => a.exam_id === req.params.id && (a.status === 'completed' || a.status === 'timed_out'));
      attempts = attempts.map(a => { const u = db.findOne('users', u2 => u2.id === a.user_id); return { ...a, student_name: u ? u.name : 'Unknown', student_email: u ? u.email : '' }; });
    } else {
      attempts = db.findMany('exam_attempts', a => a.exam_id === req.params.id && a.user_id === req.user.id && (a.status === 'completed' || a.status === 'timed_out'));
    }
    const exam = db.findOne('exams', e => e.id === req.params.id);
    res.json({ exam: { title: exam.title, total_marks: exam.total_marks, passing_marks: exam.passing_marks }, attempts });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch results.' }); }
});

module.exports = router;
