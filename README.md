# ☁️ Cloud-Based Online Examination System

A comprehensive, full-stack web application for conducting online examinations with real-time monitoring, auto-grading, and analytics — built as a **Cloud Computing Internship Project**.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

## 📋 Features

### 🔐 Authentication & Authorization
- Secure user registration and login with JWT tokens
- Role-based access control (Admin / Student)
- Password hashing with bcrypt

### 👨‍💼 Admin Panel
- **Dashboard** — Real-time statistics: total students, exams, attempts, pass rate, avg score
- **Exam Management** — Create, edit, publish, unpublish, and delete exams
- **Question Bank** — Add MCQ questions with options, correct answers, and marks
- **Results Overview** — View all student results per exam with scores and pass/fail status

### 🎓 Student Portal
- **Dashboard** — Personal stats: exams taken, passed, average score
- **Exam Browser** — Browse published exams with details (duration, questions, marks)
- **Exam Taking** — Real-time countdown timer, progress tracker, option selection
- **Auto-Grading** — Instant results with score, percentage, pass/fail status
- **Answer Review** — Detailed review showing correct/incorrect answers
- **Leaderboard** — Compete with other students based on average scores

### ☁️ Cloud Computing Concepts Demonstrated
- RESTful API architecture
- Stateless authentication (JWT)
- Scalable application design (separation of concerns)
- Environment-based configuration
- Ready for cloud deployment (Docker, Heroku, AWS)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Database** | JSON file-based storage |
| **Auth** | JWT (JSON Web Tokens), bcrypt |
| **Design** | Dark theme, responsive, modern UI |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cloud-exam-system.git
cd cloud-exam-system

# Install dependencies
npm install

# Seed database with demo data
npm run seed

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cloudexam.com | admin123 |
| Student | rahul@student.com | student123 |

---

## 📁 Project Structure

```
cloud-exam-system/
├── server.js            # Express server entry point
├── database.js          # JSON-based database engine
├── seed.js              # Demo data seeder
├── package.json         # Dependencies & scripts
├── .env                 # Environment variables
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── routes/
│   ├── auth.js          # Login / Register endpoints
│   ├── exams.js         # Exam CRUD, questions, taking, grading
│   └── dashboard.js     # Admin & student dashboard analytics
└── public/
    ├── index.html       # Main HTML page
    ├── styles.css       # Complete CSS design system
    ├── core.js          # API utilities & helpers
    ├── app.js           # App init, auth, navigation
    ├── views.js         # Dashboard views
    ├── exams.js         # Exam management views
    └── student.js       # Student exam-taking views
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/exams` | List exams | Yes |
| POST | `/api/exams` | Create exam | Admin |
| PUT | `/api/exams/:id` | Update exam | Admin |
| DELETE | `/api/exams/:id` | Delete exam | Admin |
| POST | `/api/exams/:id/questions` | Add questions | Admin |
| POST | `/api/exams/:id/start` | Start exam attempt | Yes |
| POST | `/api/exams/:id/submit` | Submit exam | Yes |
| GET | `/api/exams/:id/results` | View results | Yes |
| GET | `/api/dashboard/admin` | Admin stats | Admin |
| GET | `/api/dashboard/student` | Student stats | Yes |
| GET | `/api/dashboard/leaderboard` | Leaderboard | Yes |

---

## 📸 Screenshots

### Login Page
Modern dark-themed authentication with sign in/sign up tabs.

### Student Dashboard
Overview with stats cards, recent results table, and navigation.

### Exam Taking
Timer-based exam with progress tracking and MCQ options.

### Results & Review
Detailed results with correct/incorrect answer highlighting.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

## 📄 License

[MIT](LICENSE)

---

> Built with ❤️ as a Cloud Computing Internship Project
