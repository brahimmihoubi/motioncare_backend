# MotionCare Backend

**Pediatric Rehabilitation Exercise Assistant**

This is the backend RESTful API for the MotionCare platform, providing shared services for both the **Web Dashboard** (used by Doctors/Therapists and Administrators) and the **Mobile Application** (used by Patients).

## Technology Stack
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: SQLite3 (Promisified for async/await)
* **Authentication**: JSON Web Tokens (JWT) & bcrypt (Password Hashing)
* **API Documentation**: Swagger UI

---

## User Roles & Access Control

The backend implements strict Role-Based Access Control (RBAC) to ensure data privacy and security.

1. **Administrator (`admin`)**
   * Can view global system statistics across the entire platform.
   * Can view lists of all registered doctors and patients.
   * Can add new rehabilitation exercises to the global library.
   * Can create exercise programs for patients.
   * *Default Account:* `admin@motioncare.com` / `admin123` (Auto-seeded on first run).

2. **Doctor / Therapist (`doctor`)**
   * Can register their own account.
   * Can register new patients and link them to their profile.
   * Can view a dashboard of their patients' compliance and progress.
   * Can assign and customize exercise programs for their patients (customize sets, reps, rest time, duration).

3. **Patient (`patient`)**
   * Logs in via the Mobile Application using credentials provided by their Doctor.
   * Can retrieve their currently active rehabilitation program.
   * Can submit ("log") completed exercise sessions.
   * Can view their own history of completed and missed sessions.

---

## Installation & Setup

1. **Install dependencies:**
   Make sure you are in the `motioncare_backend` directory and run:
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000` (or the port defined in your `.env` file).*

3. **Database Initialization:**
   The SQLite database (`database.sqlite`) is automatically initialized and seeded with default exercises and the default Administrator account the first time the server starts.

---

## API Documentation (Swagger)

The backend includes a fully interactive, visual API documentation interface powered by Swagger UI.

Once the server is running, open your web browser and navigate to:
**[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

From there, you can explore all available endpoints, view the required JSON schemas for requests, see expected responses, and even test the APIs directly from your browser. 

*(Note: For protected routes, you will need to log in via one of the `/api/auth/*/login` endpoints, copy the returned JWT token, and click the "Authorize" button at the top of the Swagger page to inject the token as a Bearer Token).*

---

## Project Structure

```text
motioncare_backend/
├── src/
│   ├── config/          # Database connection and initialization
│   ├── controllers/     # Route logic (Auth, Admin, Patient, Dashboard, etc.)
│   ├── database/        # SQLite migrations and initial seeders
│   ├── middlewares/     # JWT verification and Role-based guards
│   ├── models/          # Data access layer (SQL queries)
│   ├── routes/          # Express route definitions
│   ├── services/        # Core business logic (e.g., complex Auth flows)
│   ├── utils/           # Helpers (JWT generation, Password Hashing)
│   ├── app.js           # Express app setup and middleware registration
│   ├── server.js        # HTTP server entry point
│   └── swagger.json     # OpenAPI / Swagger definition file
├── .env                 # Environment variables (Port, JWT Secret)
├── package.json         # Project dependencies and scripts
└── README.md            # This documentation file
```