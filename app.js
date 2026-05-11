// ============================================
// CloudExam - Main Application (Part 1: Auth & Navigation)
// ============================================

let currentPage = 'dashboard';
let examTimer = null;
let currentAttempt = null;
let currentQuestions = [];
let currentAnswers = {};

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    if (currentUser && authToken) { renderApp(); } else { renderAuth(); }
  }, 1500);
});

// ---- AUTH VIEW ----
function renderAuth() {
  let isLogin = true;
  const app = document.getElementById('app');
  function draw() {
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-brand">
          <div class="auth-brand-icon"><i class="ri-cloud-line"></i></div>
          <h1><span>Cloud</span>Exam</h1>
          <p>Cloud-Based Online Examination System</p>
        </div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab ${isLogin?'active':''}" onclick="switchAuth(true)">Sign In</button>
            <button class="auth-tab ${!isLogin?'active':''}" onclick="switchAuth(false)">Sign Up</button>
          </div>
          <form id="authForm" onsubmit="handleAuth(event)">
            ${!isLogin?'<div class="form-group"><label>Full Name</label><input class="form-input" name="name" placeholder="Enter your name" required></div>':''}
            <div class="form-group"><label>Email</label><input class="form-input" name="email" type="email" placeholder="Enter your email" required></div>
            <div class="form-group"><label>Password</label><input class="form-input" name="password" type="password" placeholder="Enter password" required minlength="6"></div>
            ${!isLogin?'<div class="form-group"><label>Role</label><select class="form-input form-select" name="role"><option value="student">Student</option><option value="admin">Admin / Instructor</option></select></div>':''}
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:1rem">${isLogin?'Sign In':'Create Account'}</button>
          </form>
        </div>
      </div>
    </div>`;
  }
  window.switchAuth = (v) => { isLogin = v; draw(); };
  window.handleAuth = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      saveAuth(data.token, data.user);
      showToast(data.message, 'success');
      renderApp();
    } catch (err) { showToast(err.message, 'error'); }
  };
  draw();
}

// ---- MAIN APP LAYOUT ----
function renderApp() {
  const isAdmin = currentUser.role === 'admin';
  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand"><i class="ri-cloud-line"></i><h2><span>Cloud</span>Exam</h2></div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar" style="background:${currentUser.avatar_color||'#6366f1'}">${initials}</div>
          <div class="user-details"><h4>${currentUser.name}</h4><p>${currentUser.role}</p></div>
          <button class="logout-btn" onclick="logout()" title="Logout"><i class="ri-logout-box-r-line"></i></button>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <button class="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="ri-menu-line"></i></button>
      <div id="pageContent"></div>
    </main>
  </div>`;
  const navItems = isAdmin
    ? [{id:'dashboard',icon:'ri-dashboard-line',label:'Dashboard'},{id:'exams',icon:'ri-file-list-3-line',label:'Manage Exams'},{id:'results',icon:'ri-bar-chart-box-line',label:'Results'}]
    : [{id:'dashboard',icon:'ri-dashboard-line',label:'Dashboard'},{id:'exams',icon:'ri-book-open-line',label:'Available Exams'},{id:'my-results',icon:'ri-award-line',label:'My Results'},{id:'leaderboard',icon:'ri-trophy-line',label:'Leaderboard'}];
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = navItems.map(n=>`<button class="nav-item ${currentPage===n.id?'active':''}" onclick="navigateTo('${n.id}')"><i class="${n.icon}"></i>${n.label}</button>`).join('');
  loadPage(currentPage);
}

window.navigateTo = (page) => { currentPage = page; renderApp(); };
window.logout = () => { clearAuth(); currentPage='dashboard'; showToast('Logged out','info'); renderAuth(); };

function loadPage(page) {
  const c = document.getElementById('pageContent');
  if (currentUser.role === 'admin') {
    if (page==='dashboard') loadAdminDashboard(c);
    else if (page==='exams') loadAdminExams(c);
    else if (page==='results') loadAdminResults(c);
  } else {
    if (page==='dashboard') loadStudentDashboard(c);
    else if (page==='exams') loadStudentExams(c);
    else if (page==='my-results') loadStudentResults(c);
    else if (page==='leaderboard') loadLeaderboard(c);
  }
}
