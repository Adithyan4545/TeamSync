# 🚀 TeamSync

> **Find the Right Team. Build Amazing Ideas.**

TeamSync is an AI-powered student collaboration platform that helps
students form hackathon teams before registration deadlines.

## 📌 Problem Statement

Students often struggle to find teammates with the right skills before
hackathon registration closes. Most rely on WhatsApp, friends, Telegram,
or social media, making team formation slow and unreliable.

## 💡 Solution

TeamSync provides a centralized platform where students can:

-   Create hackathon teams
-   Browse available teams
-   Apply to join teams
-   Complete technical assignments
-   Build balanced teams

> **Note:** TeamSync is **not** a job portal. Every user is a student.

------------------------------------------------------------------------

# 🏗 Tech Stack

## Frontend

-   Next.js 15
-   React 19
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Framer Motion
-   Axios

## Backend

-   Node.js
-   Express.js
-   TypeScript

## Database

-   MongoDB
-   Mongoose

## Authentication

-   JWT
-   bcrypt

## AI (Phase 2)

-   FastAPI
-   Ollama
-   Sentence Transformers

------------------------------------------------------------------------

# 📂 Project Structure

``` text
TeamSync/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── public/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   ├── config/
│   ├── uploads/
│   └── server.ts
```

# ✨ Features

## Authentication

-   Register
-   Login
-   Logout
-   Forgot Password
-   Reset Password
-   JWT Authentication

## Student Profile

-   Profile Picture
-   College
-   Department
-   Year
-   Skills
-   GitHub
-   LinkedIn
-   Portfolio
-   Resume Upload
-   Certificates
-   Projects
-   Availability

## Hackathon Feed

-   Upcoming Hackathons
-   Search
-   Filter
-   Bookmark

## Team Management

-   Create Team
-   Browse Teams
-   Apply to Teams
-   Manage Applications
-   Assignment Module
-   Notifications
-   Dashboards

# 🤖 AI Features (Phase 2)

-   AI Resume Parser
-   AI Skill Verification
-   AI Team Match Score
-   AI Assignment Evaluation
-   AI Team Balance Analysis
-   AI Skill Gap Analysis
-   AI Project Recommendation

# 🔒 Security

-   JWT Authentication
-   bcrypt Password Hashing
-   Protected Routes
-   Input Validation
-   Role-Based Access

# 📊 Database Collections

-   Users
-   Hackathons
-   Teams
-   Applications
-   Assignments
-   Submissions
-   Messages
-   Notifications
-   Certificates

# 🚀 Installation

## Frontend

``` bash
cd frontend
npm install
npm run dev
```

## Backend

``` bash
cd backend
npm install
npm run dev
```

# 🌐 Environment Variables

``` env
MONGODB_URI=
JWT_SECRET=
PORT=5000
```

# 🛣 Roadmap

## Phase 1

-   Authentication
-   Student Profiles
-   Hackathon Feed
-   Team Creation
-   Applications
-   Assignment Module
-   Dashboards

## Phase 2

-   AI Resume Parser
-   AI Team Matching
-   AI Assignment Evaluation

## License

MIT License
