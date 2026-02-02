# Anime Streaming Website

A modern anime streaming platform built with a React frontend and Node.js backend.

## 🚀 Features

- **Homepage**: Hero carousel, ongoing anime slider, top-rated section.
- **Anime Detail**: Comprehensive info, episode lists, and related anime.
- **Streaming**: Custom video player with quality selection and servers.
- **User System**: Login/Register, profile management, watchlist, and history.
- **Admin Panel**: Dashboard for managing anime content.
- **Search & Filter**: Real-time search with genre and status filters.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Animation**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)

## � Project Structure

```
├── app/                # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   └── ...
├── server/             # Backend (Express)
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── ...
└── package.json        # Root script orchestration
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation

1. **Install Dependencies**
   Run the following command from the root directory to install dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   cd server && npm install
   cd ../app && npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the `server` directory and configure the necessary variables (e.g., MongoDB URI, JWT Secret).
   Create a `.env` file in the `app` directory if needed for API endpoints.

### Running the Project

To run both the frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000 (or your configured port)

## 📄 License

This project is licensed under the ISC License.