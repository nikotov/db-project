# Frontend

React + Vite frontend for the database project.

## Requirements

- Node.js 20+

## Run locally

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

By default, Vite serves the app on `http://localhost:5173`.

The frontend calls the backend through `/api/*`.
In local development, Vite proxies `/api` to `http://localhost:8000`.

## Build

```bash
npm run build
npm run preview
```

## Docker setup

The Docker multi-stage build:

1. Builds frontend assets with Node.js.
2. Serves assets with Nginx.
3. Proxies `/api/*` requests to the backend container.
