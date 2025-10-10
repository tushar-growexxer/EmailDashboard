# Email Dashboard API

A secure REST API for user management built with Node.js, Express, TypeScript, and SAP HANA database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- SAP HANA database (optional for development)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the server:**
   ```bash
   pnpm dev
   ```

The server will start on `http://localhost:3000` even without a database connection.

## 📊 Health Checks

- **Server Health:** `GET /health`
- **Database Health:** `GET /health/db`
- **API Info:** `GET /api/v1`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30m

# SAP HANA Database Configuration (Optional)
DB_HOST=your-hana-host
DB_PORT=30015
DB_USER=your-db-username
DB_SCHEMA=YOUR_SCHEMA
DB_USERS_TABLE=YOUR_USERS_TABLE
```

### Database Setup (Optional)

If you have a SAP HANA database:

1. **Run the database initialization script:**
   ```bash
   pnpm run setup:db
   ```

2. **Execute the SQL script** in `scripts/init-database.sql` on your SAP HANA database.

3. **Update your `.env` file** with the correct database credentials.

## 🛠️ Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test:api` - Test API endpoints
- `pnpm setup:db` - Database setup instructions

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/auth/validate` - Validate JWT token

### User Management (Admin Only)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input validation

## 📝 Logging

The API uses structured logging with:
- **Console output:** Color-coded with emojis for development
- **File output:** Structured format for production
- **Request logging:** Detailed HTTP request information
- **Error tracking:** Stack traces and metadata

## 🚨 Current Status

✅ **Server is running** on port 3000  
✅ **Health endpoints** are working  
✅ **API structure** is ready  
⚠️ **Database connection** is optional (configure for full functionality)

## 📚 Documentation

- **Complete API Documentation:** `API_DOCUMENTATION.md`
- **Database Schema:** `scripts/init-database.sql`
- **API Testing:** `scripts/test-api.js`

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use JSDoc comments for all functions
3. Ensure proper error handling
4. Follow the existing code structure

## 📄 License

ISC License