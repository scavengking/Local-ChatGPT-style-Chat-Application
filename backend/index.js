const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fetch = require('node-fetch');

const app = express();
const port = 3001;

// A Map to store active AbortControllers for each chat session
const activeStreams = new Map();

app.use(cors());
app.use(express.json());

// ROUTES //

// Get all chat sessions
app.get('/api/chats', async (req, res) => {
  try {
    const allChats = await pool.query("SELECT * FROM chats ORDER BY created_at DESC");
    res.json(allChats.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Create a new chat session
app.post('/api/chat', async (req, res) => {
  try {
    const newChat = await pool.query(
      "INSERT INTO chats (title) VALUES ('New Chat') RETURNING *",
    );
    res.json(newChat.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all messages for a specific chat
app.get('/api/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await pool.query(
      "SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC",
      [chatId]
    );
    res.json(messages.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Add a new message and get a streaming response
app.post('/api/chat/:chatId/message', async (req, res) => {
  const { chatId } = req.params;
  const controller = new AbortController();
  activeStreams.set(chatId, controller);

  let fullBotResponse = '';

  try {
    const { content } = req.body;
    await pool.query(
      "INSERT INTO messages (chat_id, role, content) VALUES ($1, 'user', $2)",
      [chatId, content]
    );

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:1b', // Or gemma:1b
        prompt: content,
        stream: true,
      }),
      signal: controller.signal,
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    
    // *** FINAL FIX: Using Node.js stream events instead of .getReader() ***
    await new Promise((resolve, reject) => {
      let buffer = '';
      const decoder = new TextDecoder();

      ollamaResponse.body.on('data', (chunk) => {
        // Forward the raw chunk to the client
        res.write(chunk);

        // Process for saving to DB
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.trim() === '') continue;
          try {
            const parsed = JSON.parse(part);
            if (parsed.response) {
              fullBotResponse += parsed.response;
            }
          } catch (error) {
            console.error("Backend failed to parse JSON part:", part, error);
          }
        }
      });

      ollamaResponse.body.on('end', () => {
        console.log("Ollama stream finished.");
        resolve();
      });

      ollamaResponse.body.on('error', (err) => {
        console.error("Ollama stream error:", err);
        reject(err);
      });
    });

    // After the stream is finished, save the complete response
    if (fullBotResponse.trim()) {
      await pool.query(
        "INSERT INTO messages (chat_id, role, content) VALUES ($1, 'bot', $2)",
        [chatId, fullBotResponse.trim()]
      );
      console.log(`Saved bot response for chat ${chatId}.`);
    }
    
    res.end();

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`Stream for chat ${chatId} aborted by user.`);
    } else {
      console.error("Backend promise/fetch error:", err.message);
    }
    if (!res.writableEnded) {
      res.end();
    }
  } finally {
    activeStreams.delete(chatId);
    console.log(`Cleaned up stream for chat ${chatId}.`);
  }
});

// Update a chat's title
app.patch('/api/chat/:chatId/title', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).send('Title is required.');
    }

    const updatedChat = await pool.query(
      "UPDATE chats SET title = $1 WHERE id = $2 RETURNING *",
      [title, chatId]
    );

    if (updatedChat.rows.length === 0) {
      return res.status(404).send('Chat not found.');
    }

    res.json(updatedChat.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// New endpoint to stop a running stream
app.post('/api/chat/:chatId/stop', (req, res) => {
  const { chatId } = req.params;
  const controller = activeStreams.get(chatId);

  if (controller) {
    controller.abort();
    activeStreams.delete(chatId);
    console.log(`Stop request for chat ${chatId} processed.`);
    res.status(200).send('Stream stopped.');
  } else {
    res.status(404).send('No active stream found for this chat.');
  }
});

// Delete a chat session and all its messages
app.delete('/api/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const client = await pool.connect(); // Get a client from the pool for a transaction

  try {
    await client.query('BEGIN'); // Start a transaction

    // First, delete all messages associated with the chat
    await client.query('DELETE FROM messages WHERE chat_id = $1', [chatId]);

    // Second, delete the chat itself
    await client.query('DELETE FROM chats WHERE id = $1', [chatId]);

    await client.query('COMMIT'); // Commit the transaction
    res.status(200).send({ message: 'Chat deleted successfully.' });

  } catch (err) {
    await client.query('ROLLBACK'); // Roll back the transaction on error
    console.error(err.message);
    res.status(500).send("Server error");
  } finally {
    client.release(); // Release the client back to the pool
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});