# TrustLab Admin — Frontend

React 19 + Material UI (MUI) 5.18 admin panel, bootstrapped with `react-scripts` (Create React App).

## Included libraries

- **React 19** / React DOM
- **@mui/material 5.18** + **@mui/icons-material** + Emotion (styling engine)
- **@reduxjs/toolkit** + **react-redux** — state management
- **react-router-dom 6** — routing
- **firebase** — auth / backend services
- **@react-google-maps/api** — Google Maps
- **socket.io-client** — realtime

> Note: MUI is pinned to `5.18.0` (React 19 compatible). All versions match the
> provided `package.json` exactly.

## Setup

```bash
cd frontend
npm install
```

## Running

```bash
npm start      # dev server at http://localhost:3000
npm run build  # production build into ./build
npm test       # run tests
```

## Environment variables

Create React App only exposes vars prefixed with `REACT_APP_`. See `.env`:

| Variable             | Description          | Default                     |
| -------------------- | -------------------- | --------------------------- |
| `REACT_APP_API_URL`  | Backend API base URL | `http://localhost:5000/api` |

## Structure

```
frontend/
  public/          # index.html, manifest, static assets
  src/
    App.js         # root component
    index.js       # entry point (ThemeProvider + CssBaseline)
    theme.js       # MUI theme
```
