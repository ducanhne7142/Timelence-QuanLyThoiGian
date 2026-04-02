Runtime: Node.js
Framework: Express.js v4.18.2
ORM: Sequelize v6.37.7
Database: MySQL (mysql2 v3.15.3) / MSSQL (mssql v10.0.4)
Authentication: JWT (jsonwebtoken v9.0.2)
Password: bcryptjs v2.4.3
File Upload: Multer v1.4.5, Cloudinary v2.8.0
Email: Nodemailer v6.10.1
Google APIs: googleapis v118.0.0, @google/generative-ai v0.3.0
Validation: Joi v17.13.3
Security: Helmet v7.2.0, CORS, Rate Limiting
Utilities: date-fns, ExcelJS, node-cron
Dev: Nodemon v3.0.2
Framework: React v18.2.0
Build Tool: Vite v5.0.8
CSS: Tailwind CSS v3.3.6
UI Components: Radix UI (@radix-ui/*)
Calendar: FullCalendar v6.1.10
Forms: react-hook-form v7.49.0 + Zod v3.22.4
Data Fetching: @tanstack/react-query v5.13.4
Routing: react-router-dom v6.21.0
State Management: Zustand v4.4.7
Charts: Recharts v3.5.0
Icons: Lucide React v0.294.0
HTTP: Axios v1.6.2
2. Cài Đặt Backend
Biến Môi Trường Backend (.env):

3. Cài Đặt Frontend
Biến Môi Trường Frontend (.env):

🚀 Chạy Ứng Dụng
Chế Độ Phát Triển
Terminal 1 - Backend:

Terminal 2 - Frontend:

Chế Độ Production
Backend:

Frontend:

📁 Cấu Trúc Thư Mục
🔌 API Endpoints Chính
Authentication
Tasks/Events
Calendar
Analytics/Reports
👨‍💻 Hướng Dẫn Phát Triển
Quy Ước Mã
Backend
Sử dụng async/await thay vì callback
Đặt tên biến rõ ràng, theo camelCase
Tách business logic vào services
Validation input bằng Joi
Error handling consistent
Frontend
Functional components với hooks
Sử dụng zustand cho global state
@tanstack/react-query cho server state
Tailwind CSS cho styling
Radix UI cho components
Git Workflow
Kiểm Tra & Debug
Backend:

Frontend:

📦 Build & Deploy
Backend
Frontend
Dùng static server để serve file dist (nginx, Vercel, Netlify, etc.)

🔒 Bảo Mật
✅ Mật khẩu hash với bcryptjs
✅ JWT authentication
✅ CORS enabled
✅ Rate limiting trên API
✅ Helmet security headers
✅ Input validation & sanitization
✅ Biến môi trường cho secrets
✅ HTTPS recommended
🐛 Troubleshooting
Backend không kết nối database
Frontend không giao tiếp Backend
Port already in use
