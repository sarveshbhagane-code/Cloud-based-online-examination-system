// ============================================
// CloudExam - Dashboard Views
// ============================================

// ---- ADMIN DASHBOARD ----
async function loadAdminDashboard(c) {
  c.innerHTML = '<div class="page-header"><h1>Admin Dashboard</h1><p>Overview of your examination system</p></div><p style="color:var(--text-muted)">Loading...</p>';
  try {
    const data = await api('/dashboard/admin');
    const s = data.stats;
    c.innerHTML = `
    <div class="page-header"><h1>Admin Dashboard</h1><p>Overview of your examination system</p></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon purple"><i class="ri-group-line"></i></div><div class="stat-value">${s.totalStudents}</div><div class="stat-label">Total Students</div></div>
      <div class="stat-card"><div class="stat-icon cyan"><i class="ri-file-list-3-line"></i></div><div class="stat-value">${s.totalExams}</div><div class="stat-label">Total Exams</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="ri-check-double-line"></i></div><div class="stat-value">${s.totalAttempts}</div><div class="stat-label">Completed Attempts</div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="ri-percent-line"></i></div><div class="stat-value">${s.avgScore}%</div><div class="stat-label">Average Score</div></div>
      <div class="stat-card"><div class="stat-icon pink"><i class="ri-trophy-line"></i></div><div class="stat-value">${s.passRate}%</div><div class="stat-label">Pass Rate</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Attempts</h3></div>
      <div class="card-body table-container">
        ${data.recentAttempts.length ? `<table><thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Status</th></tr></thead><tbody>
          ${data.recentAttempts.map(a=>`<tr><td>${a.student_name}</td><td>${a.exam_title}</td><td>${a.score}/${a.total_marks} (${a.percentage}%)</td><td><span class="badge ${a.percentage>=60?'badge-success':'badge-danger'}">${a.percentage>=60?'Passed':'Failed'}</span></td></tr>`).join('')}
        </tbody></table>` : '<div class="empty-state"><i class="ri-inbox-line"></i><h3>No attempts yet</h3></div>'}
      </div>
    </div>`;
  } catch(e) { c.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

// ---- STUDENT DASHBOARD ----
async function loadStudentDashboard(c) {
  c.innerHTML = '<div class="page-header"><h1>Dashboard</h1><p>Loading...</p></div>';
  try {
    const data = await api('/dashboard/student');
    const s = data.stats;
    c.innerHTML = `
    <div class="page-header"><h1>Welcome, ${currentUser.name}!</h1><p>Your examination overview</p></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon cyan"><i class="ri-book-open-line"></i></div><div class="stat-value">${s.totalExamsAvailable}</div><div class="stat-label">Available Exams</div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="ri-edit-line"></i></div><div class="stat-value">${s.examsTaken}</div><div class="stat-label">Exams Taken</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="ri-check-line"></i></div><div class="stat-value">${s.passed}</div><div class="stat-label">Passed</div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="ri-percent-line"></i></div><div class="stat-value">${s.avgScore}%</div><div class="stat-label">Average Score</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Results</h3></div>
      <div class="card-body table-container">
        ${data.recentResults.length ? `<table><thead><tr><th>Exam</th><th>Subject</th><th>Score</th><th>Status</th><th>Date</th></tr></thead><tbody>
          ${data.recentResults.map(r=>`<tr><td>${r.exam_title}</td><td>${r.subject}</td><td>${r.score}/${r.total_marks} (${r.percentage}%)</td><td><span class="badge ${r.score>=r.exam_passing_marks?'badge-success':'badge-danger'}">${r.score>=r.exam_passing_marks?'Passed':'Failed'}</span></td><td>${formatDate(r.end_time)}</td></tr>`).join('')}
        </tbody></table>` : '<div class="empty-state"><i class="ri-book-line"></i><h3>No exams taken yet</h3><p>Browse available exams to get started!</p></div>'}
      </div>
    </div>`;
  } catch(e) { c.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}
