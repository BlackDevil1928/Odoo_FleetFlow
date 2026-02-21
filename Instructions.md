## Project Development Guidelines for Odoo Hackathon

This document defines the standards, rules, and expectations that must be followed while designing, developing, and presenting this project.

The goal is not just to build a working solution, but to build a scalable, well-structured, production-grade system with strong database design and modular architecture.

---

# 1️⃣ Core Principles

- Think before coding.
- Design database schema first.
- Build backend logic before UI polish.
- Avoid unnecessary third-party dependencies.
- Write modular, readable, and scalable code.
- Handle errors gracefully.
- Use proper Git workflow.

---

# 2️⃣ Technology Constraints & Expectations

## ✅ Preferred
- MySQL or PostgreSQL (Local database setup)
- Custom backend implementation (Node.js / FastAPI / Django, etc.)
- RESTful API architecture
- JWT-based authentication
- Modular folder structure
- Server-side input validation
- Real-time or dynamic data handling

## ❌ Avoid
- Backend-as-a-Service platforms (Firebase, Supabase, MongoDB Atlas)
- Heavy reliance on third-party APIs
- Static JSON as final solution
- Single-file backend structure
- Hardcoded data

---

# 3️⃣ Development Workflow

## Step 1: Problem Understanding
- Clearly define the problem statement.
- Identify user roles.
- List core features.
- Define database entities.

## Step 2: Database Design (Critical)
- Create ER Diagram before implementation.
- Normalize tables properly.
- Use:
  - PRIMARY KEY
  - FOREIGN KEY
  - UNIQUE constraints
  - NOT NULL
  - INDEX where necessary

All relationships must be meaningful and justified.

## Step 3: Backend Architecture

Follow layered architecture:

/controllers  
/services  
/routes  
/models  
/middlewares  
/utils  
/config  

- Controllers → Handle requests & responses  
- Services → Business logic  
- Models → Database interaction  
- Middlewares → Authentication, validation, logging  

---

# 4️⃣ API Design Standards

- Follow REST principles.
- Use proper HTTP methods (GET, POST, PUT, DELETE).
- Return structured responses.

### Success Example:
{
  "status": "success",
  "data": {}
}

### Error Example:
{
  "status": "error",
  "message": "Invalid email format"
}

- Always validate inputs (server-side validation mandatory).
- Never trust frontend data.

---

# 5️⃣ Input Validation Rules

Must validate:
- Email format
- Password strength
- Required fields
- Numeric limits
- Unique constraints
- Role permissions

Return clear and user-friendly error messages.

---

# 6️⃣ Security Requirements

- Hash passwords using bcrypt.
- Use JWT for authentication.
- Protect private routes.
- Prevent SQL injection via parameterized queries / ORM.
- Implement basic rate limiting if possible.

---

# 7️⃣ Real-Time & Dynamic Data

- Data must come from database.
- Avoid static JSON in final build.
- Implement:
  - Live status updates
  - Timestamp tracking
  - Aggregations or analytics if relevant

---

# 8️⃣ Git Workflow Rules

- Use feature branches.
- Meaningful commit messages:
  - feat: implement user authentication
  - fix: correct foreign key constraint
- Avoid generic commits like "updated code".
- Multiple contributors should commit.
- Maintain clean README.

---

# 9️⃣ UI/UX Guidelines

- Clean layout with consistent spacing.
- Logical navigation flow.
- Responsive design.
- Clear form validation feedback.
- Loading indicators where necessary.
- Consistent color theme.

User interface must be intuitive and minimal.

---

# 🔟 Performance & Scalability Considerations

- Use indexing on frequently queried fields.
- Avoid unnecessary database calls.
- Optimize queries.
- Design schema for future expansion.
- Follow modular coding patterns.

---

# 1️⃣1️⃣ Evaluation Criteria Alignment

The project must demonstrate:

- Strong database modeling
- Logical backend flow
- Clean modular architecture
- Robust validation
- Secure implementation
- Scalable design thinking
- Clear and interactive UI
- Team collaboration through Git

---

# 1️⃣2️⃣ Presentation Expectations

During presentation:
- Explain database schema first.
- Justify architecture decisions.
- Demonstrate validation handling.
- Show real-time/dynamic data.
- Explain scalability improvements.
- All team members must participate.

---

# Final Reminder

This hackathon is about:
- Technical clarity
- Strong fundamentals
- Clean architecture
- Real-world readiness


Build thoughtfully. Avoid shortcuts. Think like engineers.
