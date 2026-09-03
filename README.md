# StreamBox

A Netflix-like streaming platform for Cameroonian movies and anime, with age-group-based content filtering. Built with the MERN stack and YouTube Data API.

## Features

- **Age-Group Content Filtering** — Kids, Teens, Adults see only age-appropriate content
- **Netflix-Style UI** — Hero banner, horizontal scrolling content rows with carousel arrows, dark theme
- **Full Catalog + Carousels** — Browsable `/catalog` page with category filter, search, and sort (recent/popular/rated/A-Z)
- **Adult-Content Moderation** — Pornographic/explicit content is blocked at intake, search, and display (keyword filter + YouTube content-rating API check)
- **Landing Page** — Public marketing page with Cameroonian cultural branding
- **YouTube Integration** — Streams content via embedded YouTube player
- **Search** — Search Cameroonian movies, anime, documentaries via YouTube API
- **Watchlist** — Add/remove content to your personal list
- **Watch History** — Tracks what you've watched
- **User Profiles** — Change age group, manage account settings
- **Sample Content Seed** — Pre-loaded Cameroonian movies and anime

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, CSS
- **Backend:** Express.js, MongoDB (Mongoose), JWT Auth
- **API:** YouTube Data API v3

## Setup

### 1. Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- YouTube Data API key ([get one here](https://console.cloud.google.com/))

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env` with your values:
```
MONGODB_URI=mongodb://localhost:27017/streambox
JWT_SECRET=your_secret_here
YOUTUBE_API_KEY=your_youtube_api_key
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

### 4. Seed Content

After starting both servers, click "Load Sample Content" on the home page, or:

```bash
curl -X POST http://localhost:5000/api/content/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable **YouTube Data API v3**
4. Create an API key under Credentials
5. Paste it in `backend/.env`

## Project Structure

```
streambox/
├── backend/
│   ├── models/          # User, Content, WatchParty
│   ├── routes/          # auth, content, user
│   ├── middleware/       # auth, age-group
│   ├── services/        # YouTube API + content moderation service
│   ├── server.js        # Express entry point
│   └── .env             # Environment variables
├── frontend/
│   ├── index.html       # Vite entry
│   ├── vite.config.js   # Vite config (proxy /api -> backend)
│   └── src/
│       ├── components/  # Navbar, ContentRow (carousel)
│       ├── context/     # AuthContext
│       ├── pages/       # Landing, Home, Catalog, Login, Register, Player, Search, Profile, Watchlist
│       ├── services/    # Axios API client
│       └── App.jsx      # Router + layout
└── README.md
```

## Content Moderation

StreamBox blocks pornographic/adult content at three levels:

1. **Intake** — Fixed `blocked`/`flagged` fields on every `Content` document. New content is scanned for blocked keywords.
2. **Search** — YouTube search results are filtered via a keyword allow/deny list AND verified against the YouTube content-rating API before being shown.
3. **Display** — Every list/featured/trending/catalog/`/:id` query excludes `blocked` content (Mongoose query hooks + explicit filters), so adult content can never surface to users.

Innocent false positives (e.g. "sex education" documentaries) are allowlisted so they aren't wrongly removed.

## Age Groups

| Group     | Allowed Ratings       | Description            |
|-----------|-----------------------|------------------------|
| Kids      | G, PG                 | Family-friendly only   |
| Teens     | G, PG, PG-13          | Moderate content       |
| Adults    | G, PG, PG-13, R, NC-17 | All content            |
