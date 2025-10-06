# 📄 Doc Control Service

NestJS-based document management service with JWT authentication, file storage (S3), and real-time WebSocket notifications.

### SETTING UP IS DONE ONLY WITH DOCKER
### Using Docker (Recommended)
```bash
# Clone and setup
git clone <repo-url>
cd doc-control-service

# Copy environment file
cp .env.example .env

# Edit .env with your settings (JWT_SECRET, S3 credentials, etc.)
nano .env

# Start all services
docker-compose up --build 

# Check if running
docker-compose ps
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/login/access-token` - Refresh access token
- `GET /auth/verify` - Verify JWT token

### Users
- `GET /user/profile` - Get user profile
- `GET /user/:id` - Get user by ID
- `PATCH /user/:id` - Update user

### Documents
- `POST /document` - Upload document (with file)
- `GET /document` - Get all user documents
- `GET /document/:id` - Get document by ID
- `PATCH /document/:id` - Update document
- `DELETE /document/:id` - Delete document
- `GET /document/download/:id` - Get download URL

## 🔌 WebSocket Events

**Connection:** `ws://localhost:3000`

### Server → Client
- `documentCreated` - New document uploaded
- `documentUpdated` - Document modified
- `documentDeleted` - Document removed

## 📁 Supported File Types
- Images: PNG, JPEG, JPG
- Documents: PDF
- Max size: 20MB

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/doc_control

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRESIN=3h

# AWS S3
S3_BUCKET_NAME=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# App
PORT=3000
```
