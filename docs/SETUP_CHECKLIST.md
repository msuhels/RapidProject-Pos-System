# Login Page Setup Checklist

## ✅ Step-by-Step Setup

### 1. Environment Variables
Create `.env.local` in project root:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/rad_framework
NODE_ENV=development
```

### 2. Database Setup
```bash
# Initialize database (creates it if it doesn't exist)
npm run db:init

# Generate migrations from schema
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### 3. Seed Demo Data
```bash
# Install tsx if not already installed
npm install -D tsx

# Run seed script to add demo users
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Login Page
Open browser and navigate to:
```
http://localhost:3000/login
```

Or just go to root:
```
http://localhost:3000
```
(Will auto-redirect to `/login` if not authenticated)

## 🔑 Demo Login Credentials

After running the seed script, use these credentials:

- **Admin User:**
  - Email: `admin@example.com`
  - Password: `admin123`

- **Regular User:**
  - Email: `user@example.com`
  - Password: `user123`

## 🐛 Troubleshooting

### 404 Error on `/login`
- ✅ Check that `src/app/(auth)/login/page.tsx` exists
- ✅ Restart dev server after creating files
- ✅ Check browser console for errors

### Database Connection Error
- ✅ Verify `.env.local` has correct `DATABASE_URL`
- ✅ Ensure PostgreSQL is running
- ✅ Check database exists: `psql -U username -d rad_framework`

### "Users already exist" when seeding
- ✅ This is normal if you've seeded before
- ✅ To re-seed, clear the users table first

### Login fails with "Invalid email or password"
- ✅ Make sure you ran `npm run seed`
- ✅ Check database has users: `SELECT * FROM users;`
- ✅ Verify password hashing matches

## 📁 File Structure Verification

Ensure these files exist:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          ✅
│   │   └── login/
│   │       └── page.tsx        ✅
│   ├── api/
│   │   └── auth/
│   │       └── login/
│   │           └── route.ts   ✅
│   ├── layout.tsx              ✅
│   └── providers.tsx           ✅
├── core/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts        ✅
│   │   │   └── baseSchema.ts   ✅
│   │   └── validations/
│   │       └── auth.ts         ✅
│   ├── store/
│   │   └── authStore.ts        ✅
│   └── components/
│       └── ui/
│           ├── input.tsx       ✅
│           └── button.tsx      ✅
```

## 🚀 Quick Test

1. Start server: `npm run dev`
2. Open: `http://localhost:3000/login`
3. Enter: `admin@example.com` / `admin123`
4. Should redirect to `/dashboard` on success

