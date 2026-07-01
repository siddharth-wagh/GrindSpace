# GrindSpace

GrindSpace is a full-stack real-time community chat platform built around servers, channels, direct messages, and friend management. It combines authenticated social features with Socket.IO-powered live updates so users can chat, manage communities, and stay online in real time.

## What It Does

- User authentication with signup, login, logout, and session validation.
- Profile setup and editing, including avatar upload and bio/about text.
- Server creation, discovery, search, joining, leaving, invites, and member management.
- Channel-based messaging inside servers, with support for creating, editing, deleting, reordering, and reacting to messages.
- Direct messages and group DMs, plus conversation history.
- Friend requests, friend lists, request handling, and user search.
- Realtime presence updates with online/offline status.
- Typing indicators, room joins/leaves, and realtime message delivery.
- Voice-channel and WebRTC signaling support for call-style interactions.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Zustand for state management
- Tailwind CSS
- Radix UI primitives and Radix Themes
- Framer Motion
- Socket.IO client
- Axios
- Sonner for toasts
- Lucide React icons
- Emoji Picker React

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- bcrypt / bcryptjs for password hashing
- Multer for file uploads
- Cloudinary for media storage
- CORS and cookie-parser for secure cross-origin auth flows
- Cron and crypto utilities

## Core Features

### Authentication and Profiles

- Register and sign in with email, username, and password.
- Check auth status on app load and route users accordingly.
- Update profile picture and about section.
- Store auth state in the frontend store and protect private routes.

### Servers and Communities

- Create custom servers with an uploaded icon.
- Discover and search public servers.
- Join, leave, and browse your own servers.
- Invite other users through generated invite codes.
- Manage server members, including role changes and kicks.

### Channels and Messaging

- Create, rename, delete, and reorder channels inside a server.
- Send channel messages with optional image uploads.
- Edit, delete, and react to messages.
- Load message history for channels and DMs.

### Direct Messages and Groups

- Start direct message conversations.
- Create and use group DMs.
- Browse existing DM conversations.
- Send image-based DM messages.

### Friends and Presence

- Send, accept, decline, and remove friend requests.
- Search for users.
- Track online/offline status in real time.
- Show typing activity in conversations and channels.

### Realtime and Voice Support

- Socket.IO is used for presence, room membership, typing, and message delivery.
- Voice channel membership is tracked on the server.
- WebRTC signaling events are available for peer-to-peer audio/video style interactions.
- DM call lifecycle events are supported for ringing, acceptance, decline, and end states.

## Project Structure

```text
GrindSpace/
	backend/
		index.js
		src/
			controllers/
			lib/
			middlewares/
			models/
			routes/
	frontend/
		src/
			components/
			hooks/
			lib/
			pages/
			store/
			utils/
```

## Setup

### Prerequisites

- Node.js 18+ recommended
- MongoDB database
- Cloudinary account for image uploads

### Backend

1. Open the `backend` folder.
2. Install dependencies with `npm install`.
3. Create a `.env` file with the required values.
4. Start the server with `npm run dev`.

Example backend environment variables:

```env
PORT=8000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend

1. Open the `frontend` folder.
2. Install dependencies with `npm install`.
3. Create a `.env` file if you want to override the API host.
4. Start the app with `npm run dev`.

Example frontend environment variables:

```env
VITE_SERVER_URL=http://localhost:8000
```

## Available Scripts

### Backend

- `npm run dev` starts the Express server with Nodemon.

### Frontend

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.

## API Overview

The backend exposes the following route groups:

- `/api/auth` for signup, login, auth checks, profile updates, and logout.
- `/api/servers` for server lifecycle, discovery, membership, and invites.
- `/api/servers/:serverId/channels` for channel management.
- `/api/messages` for channel message operations and reactions.
- `/api/dm` for direct and group conversations.
- `/api/friends` for social graph and friend requests.

## Realtime Events

Socket.IO is used for:

- user-online and user-status-change
- join-server and leave-server
- join-channel and leave-channel
- join-conversation and leave-conversation
- typing-start and typing-stop
- voice room membership and WebRTC signaling
- DM call ring, accept, decline, and end events

## Notes

- The app uses cookie-based auth on the frontend and backend.
- Uploaded images are handled through Multer on the server and stored in Cloudinary.
- The UI is built as a fixed, full-screen chat layout with separate panels for servers, channels, conversations, chat content, and members.