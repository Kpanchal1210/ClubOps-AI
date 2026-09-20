# 🤖 ClubOps AI

## 📌 Project Overview

**ClubOps AI** is an AI-powered club and event management platform designed to help college clubs efficiently manage their members, events, tasks, volunteers, risks, meetings, and documents.

The platform combines **Node.js, Express.js, MongoDB, React, and Google Gemini AI** to provide centralized club operations along with AI-powered meeting analysis, document-based Q&A, and intelligent automation.

---

## 🎯 Features

### 👤 User Management

- User registration and authentication
- JWT-based authentication
- Role-based access control
- User profile management
- Skills and availability tracking
- Club membership management

### 🏢 Club Management

- Create and manage clubs
- Add and remove members
- Manage club information
- Club administration

### 🎪 Event Management

- Create, update, and manage events
- Track event status
- Manage venue and event dates
- Track expected participants and volunteers
- Centralized event dashboard

### ✅ Task Management

- Create and assign tasks
- Set priority and deadlines
- Track task status
- Manage task dependencies
- Track pending, completed, and overdue tasks
- AI-generated task support

### 🙋 Volunteer Management

- Manage event volunteers
- Assign volunteers to teams
- Track skills and availability
- Assign tasks to volunteers

### ⚠️ Risk Management

- Identify and manage event risks
- Track severity and probability
- Assign risks to members
- Track risk status
- Store recommended actions
- AI-detected risk support

### 🗣️ Meeting Management

- Create and manage meetings
- Store meeting transcripts
- Generate AI summaries
- Extract tasks and risks
- Extract decisions and action items

### 🤖 AI Meeting Analysis

Google Gemini AI analyzes meeting transcripts and extracts structured information such as:

- Meeting summary
- Tasks
- Deadlines
- Priorities
- Risks
- Decisions
- Action items

### 📄 Document Intelligence & RAG

- Upload club and event documents
- Extract and process document content
- Generate embeddings
- Retrieve relevant information
- AI-powered document Q&A

### 🧠 AI Agent

- Natural-language commands
- Intent detection
- Automated task and event operations
- Backend-validated AI actions
- AI action tracking

### 🔔 Notifications

- Task assignment notifications
- Task deadline notifications
- Risk notifications
- Event updates
- Read/unread notification tracking

---

## 🏗️ Architecture

```text
Frontend
React + Tailwind CSS
        │
        ▼
Backend
Node.js + Express.js
        │
        ▼
MongoDB
        │
        ├── Club & Event Management
        ├── Task & Volunteer Management
        ├── Risk Management
        ├── Meeting Management
        └── Notifications

AI Layer
        │
        ├── Google Gemini
        ├── RAG
        └── AI Agent
```

### AI Workflow

```text
Meeting / Document / User Command
              │
              ▼
             AI
              │
              ▼
      Structured Output
              │
              ▼
      Backend Validation
              │
              ▼
           Database
```

AI operations are processed through the backend rather than directly accessing MongoDB.

---

## 🔐 Security

- JWT-based authentication
- BCrypt password hashing
- Role-based authorization
- Protected API endpoints
- Backend validation
- Secure MongoDB connection
- Environment variables for sensitive credentials
- AI actions validated before database operations

---

## 🗃️ Main Entities

The system manages the following major entities:

- User
- Club
- Event
- Task
- Volunteer
- Risk
- Meeting
- AI Analysis
- Document
- Notification
- Agent Action

### Entity Relationship

```text
Club
 │
 └── Events
      │
      ├── Tasks
      ├── Volunteers
      ├── Risks
      ├── Meetings
      ├── Documents
      └── Notifications

Meetings
   │
   └── AI Analysis

Documents
   │
   └── RAG Processing

Users
   │
   └── Agent Actions
```

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/:id` | Get user |
| PATCH | `/api/users/:id` | Update user |
| GET | `/api/users/:id/club` | Get user's club |

### Clubs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/clubs` | Create club |
| GET | `/api/clubs/:id` | Get club |
| GET | `/api/clubs/:id/members` | Get club members |
| PATCH | `/api/clubs/:id` | Update club |
| POST | `/api/clubs/:id/members` | Add member |
| DELETE | `/api/clubs/:id/members/:userId` | Remove member |

### Events

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Get event |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/events/club/:clubId` | Get club events |
| GET | `/api/events/:id/dashboard` | Event dashboard |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/events/:eventId/tasks` | Get event tasks |

### Volunteers

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/volunteers` | Add volunteer |
| GET | `/api/events/:eventId/volunteers` | Get event volunteers |
| PATCH | `/api/volunteers/:id` | Update volunteer |

### Risks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/risks` | Create risk |
| GET | `/api/events/:eventId/risks` | Get event risks |
| PATCH | `/api/risks/:id` | Update risk |

### Meetings & AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/meetings` | Create meeting |
| GET | `/api/meetings/:id` | Get meeting |
| POST | `/api/meetings/:id/process` | Process meeting |
| POST | `/api/meetings/:id/analyze` | Analyze meeting |

### Documents & RAG

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents` | Add document |
| GET | `/api/documents/:id` | Get document |
| POST | `/api/documents/:id/process` | Process document |
| POST | `/api/rag/query` | Query documents using RAG |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |

### AI Agent

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/command` | Execute AI command |
| GET | `/api/agent/actions` | Get agent actions |
| GET | `/api/agent/actions/:id` | Get agent action |

---

## 🧪 Validations

- Required field validation
- User authentication
- Role-based authorization
- Club membership validation
- Event ownership and membership validation
- Task assignment validation
- Volunteer validation
- Risk validation
- AI response validation
- Secure AI-generated operations

---

## 🗄️ Database

**MongoDB Atlas** is used as the primary database.

**Mongoose** is used for database interaction and data modeling.

MongoDB Compass can be used for database inspection and management during development.

---

## 🤖 AI Integration

### Google Gemini

Gemini is used for:

- Meeting transcript analysis
- Meeting summarization
- Task extraction
- Risk extraction
- Decision extraction
- Action-item extraction
- AI Agent functionality

### RAG

RAG enables the system to retrieve relevant information from uploaded club and event documents before generating AI responses.

### AI Agent

The AI Agent allows users to interact with the system using natural-language commands and perform supported operations through the backend.

---

## 🚀 How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/Kpanchal1210/ClubOps-AI.git
```

### 2. Install Backend Dependencies

```bash
cd ClubOps-AI/backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Start the Backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

## 🛠️ Technologies Used

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, MongoDB Atlas
- **ODM:** Mongoose
- **Authentication:** JWT, BCrypt
- **AI:** Google Gemini
- **AI Architecture:** RAG, AI Agent
- **Testing:** Postman
- **Development:** VS Code, MongoDB Compass
- **Version Control:** Git, GitHub

---

## ⭐ Key Highlights

- AI-powered club and event management
- Centralized event operations
- RESTful backend architecture
- JWT authentication and authorization
- MongoDB-based data management
- AI-powered meeting analysis
- Document-based AI Q&A using RAG
- Natural-language AI Agent
- Automated task and risk extraction
- Event-level dashboard
- Backend validation for AI operations

---

## 🔮 Future Improvements

- Real-time notifications
- Advanced RAG and vector search
- Automated task assignment
- AI-based volunteer matching
- Email and calendar integration
- Voice-based AI commands
- Advanced event analytics
- Mobile application
- Scheduled automation

---

## 📌 Final Note

ClubOps AI combines **club management, event management, artificial intelligence, RAG, and automation** into a single platform.

The project demonstrates how modern web technologies and AI can be integrated to improve the organization, coordination, and efficiency of college club operations.
