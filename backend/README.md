# TrustComply — Backend

Node.js + Express + MongoDB (Mongoose) REST API.

## Requirements

- Node.js 18+
- MongoDB running locally (or a connection string to a remote/Atlas instance)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit values as needed
```

## Running

```bash
npm run dev    # development, with auto-reload (nodemon)
npm start      # production
```

Server starts on `http://localhost:5000` by default.

## Environment variables

| Variable        | Description                                  | Default                                  |
| --------------- | -------------------------------------------- | ---------------------------------------- |
| `PORT`          | Port the server listens on                   | `5000`                                   |
| `NODE_ENV`      | Environment mode                             | `development`                            |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated      | `http://localhost:3000`                  |
| `MONGO_URI`     | MongoDB connection string                    | `mongodb://127.0.0.1:27017/trustcomply`  |

## Endpoints

| Method | Path          | Description                    |
| ------ | ------------- | ------------------------------ |
| GET    | `/`           | API root message               |
| GET    | `/api/health` | Liveness + DB connection state |
| GET    | `/api/items`  | List sample items              |
| POST   | `/api/items`  | Create a sample item           |

## Structure

```
backend/
  src/
    config/       # db connection
    controllers/  # route handlers
    middleware/   # error handling, etc.
    models/       # mongoose schemas
    routes/       # express routers
    app.js        # express app setup
    server.js     # entry point
```
