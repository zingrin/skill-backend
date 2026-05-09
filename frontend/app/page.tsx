"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "STUDENT" | "TRAINER" | "ADMIN";
type Provider = "MANUAL" | "BKASH" | "NAGAD" | "ROCKET" | "CARD";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  trainer?: {
    id: string;
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  provider: Provider;
  status: string;
  transactionId?: string | null;
  checkoutUrl?: string | null;
  course: {
    id: string;
    title: string;
    price: number;
    category?: string;
  };
}

interface Enrollment {
  id: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    category: string;
    price: number;
    trainer: {
      id: string;
      name: string;
    };
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const providers: Provider[] = ["MANUAL", "BKASH", "NAGAD", "ROCKET", "CARD"];

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as Role,
  });
  const [selectedProvider, setSelectedProvider] = useState<Provider>("BKASH");
  const [transactionIds, setTransactionIds] = useState<Record<string, string>>(
    {}
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isLoggedIn = Boolean(token && user);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers || {}),
      },
    });
    const body = await response.json();

    if (!response.ok || body.success === false) {
      throw new Error(body.message || "Request failed");
    }

    return body;
  };

  const loadCourses = async () => {
    const body = await request<{ data: Course[] }>("/student/courses?limit=50");
    setCourses(body.data);
  };

  const loadStudentData = async () => {
    if (!token) return;

    const [paymentBody, enrollmentBody] = await Promise.all([
      request<{ data: Payment[] }>("/payments/my"),
      request<{ data: Enrollment[] }>("/student/enrollments"),
    ]);

    setPayments(paymentBody.data);
    setEnrollments(enrollmentBody.data);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("skillbridge_token");
    const savedUser = localStorage.getItem("skillbridge_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    loadCourses().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    loadStudentData().catch(() => undefined);
  }, [token]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;

      const body = await request<{ token?: string; data: User }>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (authMode === "register") {
        setAuthMode("login");
        setMessage("Account created. Please login now.");
        return;
      }

      if (!body.token) {
        throw new Error("Token missing from login response");
      }

      localStorage.setItem("skillbridge_token", body.token);
      localStorage.setItem("skillbridge_user", JSON.stringify(body.data));
      setToken(body.token);
      setUser(body.data);
      setMessage("Logged in successfully.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("skillbridge_token");
    localStorage.removeItem("skillbridge_user");
    setToken("");
    setUser(null);
    setPayments([]);
    setEnrollments([]);
    setMessage("Logged out.");
  };

  const startPayment = async (courseId: string) => {
    setBusy(true);
    setMessage("");

    try {
      const body = await request<{
        data: { payment: Payment | null; message: string };
      }>("/payments", {
        method: "POST",
        body: JSON.stringify({ courseId, provider: selectedProvider }),
      });

      setMessage(body.data.message);
      await loadStudentData();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmPayment = async (paymentId: string) => {
    setBusy(true);
    setMessage("");

    try {
      await request(`/payments/${paymentId}/confirm`, {
        method: "PATCH",
        body: JSON.stringify({ transactionId: transactionIds[paymentId] }),
      });
      setMessage("Payment confirmed and course enrolled.");
      await loadStudentData();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const enrolledCourseIds = new Set(enrollments.map((item) => item.course.id));
  const pendingPayments = payments.filter((item) => item.status === "PENDING");

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">SkillBridge</p>
          <h1>Courses, payments, and enrollments in one place.</h1>
        </div>
        {isLoggedIn ? (
          <div className="userbox">
            <span>{user?.name}</span>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </section>

      {message ? <p className="notice">{message}</p> : null}

      {!isLoggedIn ? (
        <section className="panel auth-grid">
          <div>
            <h2>{authMode === "login" ? "Login" : "Create account"}</h2>
            <p className="muted">
              Student account diye course payment flow test kora jabe.
            </p>
          </div>
          <form onSubmit={submitAuth} className="form">
            {authMode === "register" ? (
              <>
                <label>
                  Name
                  <input
                    value={authForm.name}
                    onChange={(event) =>
                      setAuthForm({ ...authForm, name: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={authForm.role}
                    onChange={(event) =>
                      setAuthForm({
                        ...authForm,
                        role: event.target.value as Role,
                      })
                    }
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TRAINER">Trainer</option>
                  </select>
                </label>
              </>
            ) : null}
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
                required
              />
            </label>
            <div className="actions">
              <button type="submit" disabled={busy}>
                {busy ? "Working..." : authMode === "login" ? "Login" : "Register"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
              >
                {authMode === "login" ? "Need account" : "Have account"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="content-grid">
        <div className="stack">
          <div className="section-head">
            <div>
              <p className="eyebrow">Marketplace</p>
              <h2>Approved courses</h2>
            </div>
            <select
              value={selectedProvider}
              onChange={(event) =>
                setSelectedProvider(event.target.value as Provider)
              }
              aria-label="Payment provider"
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div className="course-list">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <div>
                  <span className="pill">{course.category}</span>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <small>Trainer: {course.trainer?.name || "SkillBridge"}</small>
                </div>
                <div className="course-side">
                  <strong>{course.price > 0 ? `BDT ${course.price}` : "Free"}</strong>
                  {enrolledCourseIds.has(course.id) ? (
                    <span className="status done">Enrolled</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!isLoggedIn || busy}
                      onClick={() => startPayment(course.id)}
                    >
                      {course.price > 0 ? "Pay now" : "Enroll"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="stack">
          <section className="panel">
            <h2>Pending payments</h2>
            {pendingPayments.length === 0 ? (
              <p className="muted">No pending payment.</p>
            ) : (
              pendingPayments.map((payment) => (
                <div className="payment-row" key={payment.id}>
                  <div>
                    <strong>{payment.course.title}</strong>
                    <p>
                      {payment.provider} - {payment.currency} {payment.amount}
                    </p>
                  </div>
                  <input
                    placeholder="Transaction ID"
                    value={transactionIds[payment.id] || ""}
                    onChange={(event) =>
                      setTransactionIds({
                        ...transactionIds,
                        [payment.id]: event.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmPayment(payment.id)}
                  >
                    Confirm
                  </button>
                </div>
              ))
            )}
          </section>

          <section className="panel">
            <h2>My enrollments</h2>
            {enrollments.length === 0 ? (
              <p className="muted">No enrolled course yet.</p>
            ) : (
              enrollments.map((item) => (
                <div className="mini-row" key={item.id}>
                  <strong>{item.course.title}</strong>
                  <span>{item.course.category}</span>
                </div>
              ))
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
