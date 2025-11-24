# College ERP System

A full-stack **ERP (Enterprise Resource Planning)** web application built with **React** (frontend) and **Node.js + Express + MySQL** (backend). Designed for college administration with role-based access (CA, Staff, HOD, Principal) to manage students, subjects, attendance, and marks.

---

## Quick summary

* Frontend: React (Create React App or Vite), Tailwind CSS
* Backend: Node.js + Express, MySQL
* Auth: JWT-based authentication
* Frontend hosting: GitHub Pages (static)
* Backend hosting: Render / InfinityFree / any Node-capable host

---

## Repo layout (recommended)

If you keep frontend and backend in one repository, use this structure:

```
/ (root)
├── client/          # React frontend
├── server/          # Node + Express backend
├── .gitignore
└── README.md
```

If you keep them in separate repos, put this README in each repo and adapt the instructions below accordingly.

---

## Frontend (client) — setup

1. Go to the client folder:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Update API base URL used by the app. In `src/constants/API.js` or similar, set:

```js
export const BASE_URL = "https://your-backend-url.com/api";
```

4. Run development server:

```bash
npm start
```

5. Build for production:

```bash
npm run build
```

---

## Deploy frontend to GitHub Pages

1. In `client/package.json` add a homepage field (replace with your repo path):

```json
"homepage": "https://<your-github-username>.github.io/<your-repo-name>"
```

2. Install `gh-pages` (dev dependency):

```bash
npm install gh-pages --save-dev
```

3. Add deploy scripts to `client/package.json`:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

4. Deploy:

```bash
npm run deploy
```

5. When using React Router, set BrowserRouter basename:

```jsx
<BrowserRouter basename="/<your-repo-name>">
  {/* ... */}
</BrowserRouter>
```

Or use `HashRouter` to avoid refresh 404s:

```jsx
<HashRouter>
  {/* ... */}
</HashRouter>
```

---

## Backend (server) — setup

1. Go to the server folder:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` with values:

```
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=some-secret
```

4. Ensure CORS allows the frontend origin(s):

```js
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://<your-github-username>.github.io'
  ],
  credentials: true
}));
```

5. Start server (development):

```bash
npm run dev
```

> Production: deploy the server to Render / Railway / Heroku or any provider that supports Node and MySQL. Configure a managed MySQL instance or a remote database.

---

## Environment variables (example)

Backend `.env` example:

```
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=pass
DB_NAME=erp_db
JWT_SECRET=supersecret
```

Frontend `.env` (optional):

```
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

## Database & tables (overview)

Minimum tables used by the app:

* `users` — id, name, email, password_hash, role (CA, Staff, HOD, Principal), department_id
* `students` — reg_no, name, dob, gender, class, contact, email, other academic fields
* `subjects` — id, code, title, staff_id, department_id
* `attendance` — id, student_id, subject_id, date, status
* `marks` — id, student_id, subject_id, exam_type, marks, max_marks

Adjust schema to match your app.

---

## Common tasks

### Export data to CSV

* Backend: implement endpoints that return CSV (use `json2csv` or manual serialization)
* Frontend: download blob and trigger file save

### Export to PDF

* Use server-side PDF libraries (Puppeteer, pdfkit) or client-side (jsPDF) depending on complexity

### Authentication & Role checks

* Protect sensitive routes using middleware that validates JWT and checks `req.user.role`
* On the frontend, conditionally render UI elements based on the logged-in user role

---

## Deployment checklist

* [ ] `BASE_URL` in frontend points to deployed backend
* [ ] CORS configured on backend for production origin
* [ ] JWT secret set in backend environment
* [ ] Database credentials set and database accessible from backend host
* [ ] `homepage` and router basename configured for GitHub Pages (if used)

---

## Troubleshooting

* 404 on page refresh: use `HashRouter` or configure `basename` for `BrowserRouter` when using GitHub Pages
* CORS errors: confirm backend allows origin and that Fetch uses `credentials` if needed
* Images not loading after build: ensure asset paths are relative or use `process.env.PUBLIC_URL`

---

## Author

**Abinanthan V** — B.E., Computer Science and Engineering — Chennai

GitHub: [https://github.com/mrbi10](https://github.com/mrbi10)

---

## License

MIT License
"# erp" 
