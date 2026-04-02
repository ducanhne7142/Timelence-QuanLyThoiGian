# ⏳ TimeLence - Quản Lý Thời Gian Cá Nhân

## 🚀 Giới thiệu

TimeLence là ứng dụng web giúp người dùng quản lý thời gian, tạo sự kiện, theo dõi công việc và phân tích hiệu suất cá nhân.

---

## 🛠️ Công nghệ sử dụng

### 🔹 Backend

* Runtime: Node.js
* Framework: Express.js
* ORM: Sequelize
* Database: MySQL / MSSQL
* Authentication: JWT
* Password Hashing: bcryptjs
* File Upload: Multer + Cloudinary
* Email: Nodemailer
* Validation: Joi
* Security: Helmet, CORS, Rate Limiting
* Utilities: date-fns, ExcelJS, node-cron

---

### 🔹 Frontend

* Framework: React.js
* Build Tool: Vite
* CSS: Tailwind CSS
* UI: Radix UI
* Form: react-hook-form + Zod
* State: Zustand
* Data Fetching: React Query
* Routing: react-router-dom
* Charts: Recharts
* HTTP: Axios

---

## ⚙️ Cài đặt

### 🔹 1. Clone project

```bash
git clone https://github.com/ducanhne7142/Timelence-QuanLyThoiGian.git
cd TimeLence
```

---

### 🔹 2. Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=timelence
JWT_SECRET=your_secret_key
```

Chạy backend:

```bash
npm run dev
```

---

### 🔹 3. Frontend

```bash
cd frontend
npm install
```

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Chạy frontend:

```bash
npm run dev
```

---

## 🚀 Chạy ứng dụng

* Frontend: http://localhost:5173
* Backend: http://localhost:5000

---

## 📁 Cấu trúc thư mục

```
TimeLence/
│── backend/
│── frontend/
│── database/
```

---

## 🔌 API chính

### 🔐 Authentication

* Đăng ký / đăng nhập
* JWT authentication

### 📅 Tasks / Events

* CRUD sự kiện
* Quản lý lịch

### 📊 Analytics

* Báo cáo và thống kê

---

## 👨‍💻 Hướng dẫn phát triển

### Backend

* Sử dụng async/await
* Tách business logic vào services
* Validate input bằng Joi

### Frontend

* Functional components + Hooks
* Zustand cho global state
* React Query cho API

---

## 🔒 Bảo mật

* Hash mật khẩu với bcrypt
* JWT authentication
* Helmet + CORS
* Rate limiting
* Validate input

---

## 📦 Build & Deploy

### Backend

```bash
npm run build
```

### Frontend

```bash
npm run build
```

Deploy:

* Vercel / Netlify (Frontend)
* Render / VPS (Backend)

---

## 🐛 Troubleshooting

* ❌ Backend không connect DB → kiểm tra `.env`
* ❌ Frontend không gọi API → check URL
* ❌ Port bị trùng → đổi port




