# 🚀 TeamSync

> **Find the Right Team. Build Amazing Ideas.**

TeamSync is an AI-powered student collaboration platform that helps students form hackathon teams before registration deadlines.

---

## 📌 Features

- **Authentication:** Email/Password & Google OAuth 2.0 (Passport.js), JWT access tokens, HttpOnly refresh tokens.
- **Student Profile:** Bio, skills, college info, certificates, projects, and social links.
- **Hackathon Feed:** Upcoming hackathons, search, filtering, and bookmarking.
- **Team Management:** Create teams, browse open slots, submit applications, assignments, and notifications.
- **AI Matching (Phase 2):** Skill verification, team balance analysis, and project recommendations.

---

## 🔑 Google OAuth Setup Guide

To enable **"Continue with Google"** authentication via `passport-google-oauth20`:

### 1. Create Google OAuth Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > OAuth consent screen**:
   - Choose **External** user type.
   - Complete required application information and save.
4. Navigate to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Select Application type: **Web application**.
   - Add Authorized JavaScript Origins: `http://localhost:3000` & `http://localhost:5000`.
   - Add Authorized Redirect URIs: `http://localhost:5000/api/auth/google/callback`.
5. Copy the generated **Client ID** and **Client Secret**.

### 2. Configure Backend Environment Variables
Update `backend/.env` with your credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Installation & Running Locally

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend server runs on `http://localhost:5000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend application runs on `http://localhost:3000`.

---

## 🔒 Authentication Flow Overview

1. **Email / Password Registration & Login:** Standard hashed password via `bcrypt`, returns JWT Access Token + HttpOnly Refresh Token cookie.
2. **Google OAuth 2.0:**
   - User clicks **"Continue with Google"** on the Login page.
   - Frontend redirects to `/api/auth/google`.
   - Passport authenticates with Google and redirects to `/api/auth/google/callback`.
   - If user exists, signs in; if new, creates a student profile storing Google ID, name, email, and avatar.
   - Issues JWT Access Token & HttpOnly Refresh Token cookie, then redirects to `/auth/callback?token=...`.
   - Frontend extracts token, configures `Authorization` header, and completes login.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Axios, JWT-Decode.
- **Backend:** Node.js, Express.js, TypeScript, Mongoose, Passport.js (`passport-google-oauth20`), JWT (`jsonwebtoken`), Bcrypt.
- **Database:** MongoDB.
