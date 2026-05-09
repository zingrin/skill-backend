# SkillBridge Backend

SkillBridge is a role-based skill learning platform backend built with
TypeScript, Express, PostgreSQL, and Prisma.

## 🚀 Features

- JWT Authentication
- Role-based Authorization (Admin / Trainer / Student)
- Trainer approval by Admin
- Course creation & approval workflow
- Student enrollment system
- Search, filter & pagination
- Dashboard stats (Admin / Trainer / Student)
- Course payment flow with manual/mobile provider confirmation

## 🧱 Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT, bcrypt
- Next.js 16 frontend app in `frontend/`

## 🔐 Roles

- **Admin**: Approve trainers & courses, view dashboard stats
- **Trainer**: Create courses, view enrollments
- **Student**: Browse courses, enroll, view enrolled courses

Run Locally

```
npm install
npx prisma migrate dev
npm run dev
```

Frontend

```
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` in
`frontend/.env.local` if your backend runs on a different URL.

API Base URL

```
http://localhost:5000/api/v1

```

---

# 📮 API DOCUMENTATION (Endpoints)

## 🔐 AUTH

| Method | Endpoint         | Description                |
| ------ | ---------------- | -------------------------- |
| POST   | `/auth/register` | Register Student / Trainer |
| POST   | `/auth/login`    | Login user                 |

---

## 🧑‍⚖️ ADMIN

| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/admin/trainers/pending`     | Pending trainers |
| PATCH  | `/admin/trainers/:id/approve` | Approve trainer  |
| GET    | `/admin/courses/pending`      | Pending courses  |
| PATCH  | `/admin/courses/:id/approve`  | Approve course   |
| PATCH  | `/admin/courses/:id/reject`   | Reject course    |
| GET    | `/admin/dashboard`            | Admin stats      |

---

## 🎓 TRAINER

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/trainer/courses`   | Create course     |
| GET    | `/trainer/dashboard` | Trainer dashboard |

---

## 👨‍🎓 STUDENT

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| GET    | `/student/courses`            | View approved courses |
| GET    | `/student/enrollments`        | View enrolled courses |
| POST   | `/student/courses/:id/enroll` | Enroll course         |

Paid courses require a completed payment before direct enrollment. Free
courses still enroll immediately.

---

## PAYMENT

| Method | Endpoint                         | Description                              |
| ------ | -------------------------------- | ---------------------------------------- |
| POST   | `/payments`                      | Create payment for a course              |
| PATCH  | `/payments/:paymentId/confirm`   | Confirm payment and auto-enroll student  |
| GET    | `/payments/my`                   | Student payment history                  |
| GET    | `/admin/payments`                | Admin payment list                       |
| PATCH  | `/admin/payments/:paymentId/status` | Admin update payment status           |

---

## 🔎 PUBLIC

| Method | Endpoint          | Description             |
| ------ | ----------------- | ----------------------- |
| GET    | `/courses/search` | Search & filter courses |

---
