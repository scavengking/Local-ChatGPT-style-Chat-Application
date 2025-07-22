Local ChatGPT-style Chat Application
This is a full-stack chat application built for the Cointab Technical Assessment. It provides a clean, engaging, and fully functional chat experience similar to ChatGPT, powered by a locally-hosted Large Language Model (LLM) via Ollama. The application is built with a modern tech stack, focusing on clean code, clear logic, and a thoughtful user experience.

Features
This project successfully implements all mandatory requirements and a comprehensive set of bonus features, resulting in a robust and polished application.

Core Features
✅ Full Chat Interface: Real-time, streaming conversations with an LLM.

✅ Persistent Storage: All chats and messages are saved to a PostgreSQL database, so conversations are never lost.

✅ Chat History: A sidebar lists all past conversations, which can be loaded with a single click.

✅ New Chat: Users can start a fresh conversation at any time.

✅ Streaming Responses: Bot responses are rendered token-by-token for an interactive, real-time feel.

✅ Stop Generation: Users can interrupt the LLM at any point while it's generating a response.

✅ Auto-Naming Chats: New chats are automatically titled based on the user's first prompt, replacing the generic "New Chat" title.

Bonus Features Implemented
✅ "Typing..." Indicator: A visual indicator with a pulsing animation shows when the bot is processing a response.

✅ Rename Chats: Users can rename any chat session directly from the sidebar.

✅ Delete Chats: Users can delete entire chat sessions, which also removes all associated messages from the database.

✅ Retry Failed Messages: If a message fails to send (e.g., due to a server or network issue), a "Retry" button appears, allowing the user to resend it without retyping.

✅ Keyboard Shortcuts:

Enter: Sends the message.

Escape: Stops an ongoing AI response generation.

Tech Stack
Frontend: Next.js (React Framework) with TypeScript

Backend: Node.js with Express.js

Database: PostgreSQL

LLM Runtime: Ollama

LLM Model: gemma3:1b (or specified gemma model)

Styling: Tailwind CSS

API Client: node-fetch

Setup and Installation
Follow these steps to set up and run the project locally.

1. Prerequisites
Make sure you have the following installed on your system:

Node.js (v18 or later recommended)

PostgreSQL

Ollama

2. Clone the Repository
git clone <your-github-repository-url>
cd <repository-name>

3. Ollama Setup
Pull the required LLM model. Open your terminal and run the command that corresponds to the model you have installed (the backend is currently configured for gemma3:1b).

# Note: Use the specific model name you have installed and configured
ollama pull gemma3:1b

Ensure the Ollama application is running in the background.

4. Database Setup
Start your PostgreSQL service.

Using a tool like psql or pgAdmin, create a new database.

CREATE DATABASE cointab_chat;

Connect to the new database and run the schema script located at backend/db.sql to create the chats and messages tables.

5. Backend Setup
Navigate to the backend directory:

cd backend

Install all required dependencies:

npm install

Configure your database connection by editing the backend/db.js file with your PostgreSQL username and password.

6. Frontend Setup
From the root directory, navigate to the frontend:

cd frontend

Install all required dependencies:

npm install

Running the Application
You will need two separate terminals to run the backend and frontend servers concurrently.

Start the Backend Server:
In the backend directory, run:

node index.js

The server will start and listen on http://localhost:3001.

Start the Frontend Server:
In the frontend directory, run:

npm run dev

The application will be available at http://localhost:3000.

Open your web browser and navigate to http://localhost:3000 to use the app.

API Endpoints
The backend exposes the following RESTful API endpoints:

Method

Endpoint

Description

GET

/api/chats

Retrieves a list of all chat sessions.

POST

/api/chat

Creates a new, empty chat session.

GET

/api/chat/:chatId

Retrieves all messages for a specific chat.

POST

/api/chat/:chatId/message

Sends a message and streams the AI response.

POST

/api/chat/:chatId/stop

Stops an in-progress AI response stream.

PATCH

/api/chat/:chatId/title

Updates the title of a specific chat.

DELETE

/api/chat/:chatId

Deletes a chat and all of its associated messages.

Assumptions & Constraints
The application is designed for local development and demonstration, not for a production environment.

Active chat streams are tracked in-memory on the backend, which is not suitable for a scaled, multi-instance deployment.

User authentication and authorization are not implemented as they were not part of the project scope.

Error handling is focused on primary user flows; not all edge cases are covered.