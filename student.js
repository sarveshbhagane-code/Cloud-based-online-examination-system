// ============================================
// CloudExam - Student Views
// ============================================

// ---- STUDENT: AVAILABLE EXAMS ----
async function loadStudentExams(c) {
  try {
    const data = await api('/exams');
    c.innerHTML = `
    <div class="page-header"><h1>Available Exams</h1><p>Browse and take exams</p></div>
    <div class="exam-grid">
      ${data.exams.length ? data.exams.map(e=>`
        <div class="exam-card">
          <div class="exam-card-header"><span class="exam-subject">${e.subject}</span></div>
          <h3>${e.title}</h3>
          <p>${e.description||'No description'}</p>
          <div class="exam-meta">
            <span><i class="ri-time-line"></i>${e.duration} min</span>
            <span><i class="ri-question-line"></i>${e.question_count} questions</span>
            <span><i class="ri-star-line"></i>${e.total_marks} marks</span>
          </div>
          <div class="exam-actions">
            ${e.my_attempts>0?`<span class="badge badge-info">Attempted ${e.my_attempts} time(s)</span>`:''}
            <button class="btn btn-primary btn-sm" onclick="startExam('${e.id}')"><i class="ri-play-line"></i> Start Exam</button>
          </div>
        </div>`).join('') : '<div class="empty-state" style="grid-column:1/-1"><i class="ri-book-line"></i><h3>No exams available</h3></div>'}
    </div>`;
  } catch(e) { showToast(e.message,'error'); }
}

// ---- START & TAKE EXAM ----
window.startExam = async (examId) => {
  if (!confirm('Ready to start this exam? The timer will begin immediately.')) return;
  try {
    const data = await api(`/exams/${examId}/start`, { method:'POST' });
    currentAttempt = data.attempt;
    currentQuestions = data.questions;
    currentAnswers = {};
    renderExamTaking(data.exam, data.questions, data.attempt);
  } catch(err) { showToast(err.message,'error'); }
};

function renderExamTaking(exam, questions, attempt) {
  if (examTimer) clearInterval(examTimer);
  const startTime = new Date(attempt.start_time).getTime();
  const endTime = startTime + exam.duration * 60 * 1000;
  
  function render() {
    const answered = Object.keys(currentAnswers).length;
    const total = questions.length;
    const c = document.getElementById('pageContent');
    c.innerHTML = `
    <div class="exam-taking">
      <div class="exam-top-bar">
        <div>
          <h3 style="font-size:1rem;margin-bottom:2px">${exam.title}</h3>
          <span style="font-size:0.8rem;color:var(--text-muted)">${exam.total_marks} marks total</span>
        </div>
        <div class="progress-info">
          <span>${answered}/${total} answered</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${(answered/total)*100}%"></div></div>
        </div>
        <div class="timer" id="examTimer"><i class="ri-time-line"></i><span id="timerDisplay">--:--</span></div>
      </div>
      <div id="questionsContainer">
        ${questions.map((q,i)=>`
          <div class="question-card" id="q-${q.id}">
            <div class="question-number">Question ${i+1} of ${total} — ${q.marks} mark(s)</div>
            <div class="question-text">${q.question_text}</div>
            <div class="options-list">
              ${q.options.map((opt,oi)=>`
                <div class="option-item ${currentAnswers[q.id]===opt?'selected':''}" onclick="selectAnswer('${q.id}','${opt.replace(/'/g,"\\'")}')">
                  <div class="option-radio"></div>
                  <span>${opt}</span>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div style="text-align:center;padding:2rem 0">
        <button class="btn btn-primary" onclick="submitExam('${attempt.exam_id}','${attempt.id}')" style="padding:14px 48px;font-size:1rem">
          <i class="ri-send-plane-line"></i> Submit Exam
        </button>
      </div>
    </div>`;
    startTimer(endTime, attempt.exam_id, attempt.id);
  }
  render();
}

window.selectAnswer = (qId, answer) => {
  currentAnswers[qId] = answer;
  // Update UI
  const card = document.getElementById(`q-${qId}`);
  if (card) {
    card.querySelectorAll('.option-item').forEach(el => {
      el.classList.toggle('selected', el.querySelector('span').textContent === answer);
    });
    // Update progress
    const answered = Object.keys(currentAnswers).length;
    const total = currentQuestions.length;
    const progInfo = document.querySelector('.progress-info span');
    const progFill = document.querySelector('.progress-fill');
    if (progInfo) progInfo.textContent = `${answered}/${total} answered`;
    if (progFill) progFill.style.width = `${(answered/total)*100}%`;
  }
};

function startTimer(endTime, examId, attemptId) {
  function tick() {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const display = document.getElementById('timerDisplay');
    const timer = document.getElementById('examTimer');
    if (display) display.textContent = formatTime(remaining);
    if (timer) {
      timer.className = 'timer' + (remaining <= 60 ? ' danger' : remaining <= 300 ? ' warning' : '');
    }
    if (remaining <= 0) { clearInterval(examTimer); submitExam(examId, attemptId); }
  }
  examTimer = setInterval(tick, 1000);
  tick();
}

window.submitExam = async (examId, attemptId) => {
  if (examTimer) clearInterval(examTimer);
  try {
    const data = await api(`/exams/${examId}/submit`, { method:'POST', body:JSON.stringify({ attempt_id:attemptId, answers:currentAnswers }) });
    renderResult(data.result, examId);
    showToast('Exam submitted successfully!','success');
  } catch(err) { showToast(err.message,'error'); }
};

function renderResult(result, examId) {
  const c = document.getElementById('pageContent');
  const mins = Math.floor(result.time_spent/60), secs = result.time_spent%60;
  c.innerHTML = `
  <div style="max-width:700px;margin:0 auto">
    <div class="result-hero">
      <i class="ri-${result.passed?'trophy':'close-circle'}-line" style="font-size:3rem;color:${result.passed?'var(--success)':'var(--danger)'}"></i>
      <div class="result-score">${result.percentage}%</div>
      <div class="result-status ${result.passed?'passed':'failed'}">${result.passed?'🎉 Congratulations! You Passed!':'😞 You Did Not Pass'}</div>
      <div class="result-details">
        <div class="result-detail"><div class="result-detail-value">${result.score}/${result.total_marks}</div><div class="result-detail-label">Score</div></div>
        <div class="result-detail"><div class="result-detail-value">${mins}m ${secs}s</div><div class="result-detail-label">Time Spent</div></div>
        <div class="result-detail"><div class="result-detail-value">${Object.keys(currentAnswers).length}/${currentQuestions.length}</div><div class="result-detail-label">Answered</div></div>
      </div>
    </div>
    ${result.graded_answers ? `
    <h3 style="margin-bottom:1rem">Answer Review</h3>
    ${currentQuestions.map((q,i)=>{
      const ga = result.graded_answers[q.id];
      if (!ga) return '';
      return `<div class="question-card">
        <div class="question-number">Question ${i+1} — ${ga.is_correct?'✅ Correct':'❌ Incorrect'} (${ga.marks_obtained}/${ga.marks_possible})</div>
        <div class="question-text">${q.question_text}</div>
        <div class="options-list">
          ${q.options.map(opt=>`<div class="option-item ${opt===ga.correct_answer?'correct':''} ${opt===ga.user_answer&&!ga.is_correct?'incorrect':''}"><div class="option-radio"></div><span>${opt}</span></div>`).join('')}
        </div>
      </div>`;
    }).join('')}` : ''}
    <div style="text-align:center;padding:2rem 0">
      <button class="btn btn-primary" onclick="navigateTo('exams')"><i class="ri-arrow-left-line"></i> Back to Exams</button>
    </div>
  </div>`;
}

// ---- STUDENT RESULTS ----
async function loadStudentResults(c) {
  try {
    const examsData = await api('/exams');
    const allResults = [];
    for (const exam of examsData.exams) {
      try {
        const res = await api(`/exams/${exam.id}/results`);
        res.attempts.forEach(a => allResults.push({...a, exam_title: res.exam.title, passing: res.exam.passing_marks}));
      } catch(e) {}
    }
    c.innerHTML = `
    <div class="page-header"><h1>My Results</h1><p>Your exam history and scores</p></div>
    <div class="card">
      <div class="card-body table-container">
        ${allResults.length ? `<table><thead><tr><th>Exam</th><th>Score</th><th>Percentage</th><th>Status</th><th>Date</th></tr></thead><tbody>
          ${allResults.map(r=>`<tr><td>${r.exam_title}</td><td>${r.score}/${r.total_marks}</td><td>${r.percentage}%</td><td><span class="badge ${r.score>=r.passing?'badge-success':'badge-danger'}">${r.score>=r.passing?'Passed':'Failed'}</span></td><td>${formatDate(r.end_time)}</td></tr>`).join('')}
        </tbody></table>` : '<div class="empty-state"><i class="ri-award-line"></i><h3>No results yet</h3><p>Take an exam to see your results!</p></div>'}
      </div>
    </div>`;
  } catch(e) { showToast(e.message,'error'); }
}

// ---- LEADERBOARD ----
async function loadLeaderboard(c) {
  try {
    const data = await api('/dashboard/leaderboard');
    c.innerHTML = `
    <div class="page-header"><h1>Leaderboard</h1><p>Top performing students</p></div>
    <div class="card">
      <div class="card-body table-container">
        ${data.leaderboard.length ? `<table><thead><tr><th>#</th><th>Student</th><th>Exams</th><th>Avg Score</th><th>Best</th></tr></thead><tbody>
          ${data.leaderboard.map((l,i)=>`<tr><td><span style="font-weight:700;color:${i<3?'var(--warning)':'var(--text-muted)'}">${i+1}</span></td><td><div style="display:flex;align-items:center;gap:10px"><div class="user-avatar" style="background:${l.avatar_color};width:32px;height:32px;font-size:0.75rem">${l.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>${l.name}</div></td><td>${l.exams_taken}</td><td>${Math.round(l.avg_score)}%</td><td>${Math.round(l.best_score)}%</td></tr>`).join('')}
        </tbody></table>` : '<div class="empty-state"><i class="ri-trophy-line"></i><h3>No data yet</h3></div>'}
      </div>
    </div>`;
  } catch(e) { showToast(e.message,'error'); }
}
