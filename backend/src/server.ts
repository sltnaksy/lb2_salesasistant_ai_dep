import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "./config/database";

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "SalesAssist AI backend is running",
    });
});

// Dashboard statistics
app.get("/dashboard/stats", async (req, res) => {
    try {
        const knowledgeCountResult = await pool.query(`
      SELECT COUNT(*) AS count
      FROM knowledge_entries
    `);

        const lastResponseResult = await pool.query(`
  SELECT
    created_at,
    to_char(created_at, 'DD.MM.YYYY, HH24:MI') AS created_display
  FROM ai_responses
  ORDER BY created_at DESC
  LIMIT 1
`);

        res.json({
            systemStatus: "System aktiv",
            knowledgeCount: Number(knowledgeCountResult.rows[0].count),

            lastProcessing:
                lastResponseResult.rows.length > 0
                    ? lastResponseResult.rows[0].created_at
                    : null,

            lastProcessingDisplay:
                lastResponseResult.rows.length > 0
                    ? lastResponseResult.rows[0].created_display
                    : null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load dashboard stats" });
    }
});

// Load users
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});

// Save message
app.post("/messages", async (req, res) => {
    try {
        const { session_id, sender, content } = req.body;

        const result = await pool.query(
            `
      INSERT INTO messages (session_id, sender, content)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
            [session_id, sender, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save message" });
    }
});

// Load messages by session
app.get("/messages/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await pool.query(
            `
      SELECT *
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      `,
            [sessionId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load messages" });
    }
});
// Extract customer info from request text
function extractCustomerInfo(requestText: string) {
  const lines = requestText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let customerName = null;
  let customerCompany = null;

  // Try to detect customer name
   const possibleName = lines.find((line) => {
  const lower = line.toLowerCase();

  return (
    line.includes(" ") &&
    line.length < 40 &&
    !lower.includes("gmbh") &&
    !/\bAG\b/.test(line) &&
    !lower.includes("grüsse") &&
    !lower.includes("grüssen") &&
    !lower.includes("freundlichen") &&
    !lower.includes("enterprise") &&
    !lower.includes("lösung") &&
    /^[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+$/.test(line)
  );
});
  if (possibleName) {
    customerName = possibleName;
  }

  // Try to detect company
 const possibleCompany = lines.find((line) => {
  const lower = line.toLowerCase();

  return (
    lower.includes("gmbh") ||
    /\bAG\b/.test(line) ||
    lower.includes("group") ||
    lower.includes("solutions")
  );
});

  if (possibleCompany) {
    customerCompany = possibleCompany;
  }

  return {
    customerName,
    customerCompany,
  };
}

// Generate AI answer with Claude and Wissensbasis
app.post("/ai/generate", async (req, res) => {
    try {
        const { requestText } = req.body;
        const { customerName, customerCompany } =
         extractCustomerInfo(requestText);

        if (!requestText || !requestText.trim()) {
            return res.status(400).json({ error: "Request text is required" });
        }

        // Save customer request
        const savedMessage = await pool.query(
            `
      INSERT INTO messages (
  session_id,
  sender,
  content,
  customer_name,
  customer_company
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
      `,
            [1, "user", requestText, customerName, customerCompany]
        );

        const messageId = savedMessage.rows[0].id;

        // Simple keyword extraction for knowledge retrieval
        const keywords = requestText
            .toLowerCase()
            .replace(/[.,!?]/g, "")
            .split(" ")
            .filter((word: string) => word.length > 4);

        const searchTerms = keywords.length > 0 ? keywords : ["enterprise"];

        const knowledgeResult = await pool.query(
            `
      SELECT id, title, content, category
      FROM knowledge_entries
      WHERE
        LOWER(title) LIKE ANY($1)
        OR LOWER(content) LIKE ANY($1)
        OR LOWER(category) LIKE ANY($1)
      LIMIT 3
      `,
            [searchTerms.map((term: string) => `%${term}%`)]
        );

        let knowledgeEntries = knowledgeResult.rows;

        // Fallback if no matching knowledge entries are found
        if (knowledgeEntries.length === 0) {
            const fallbackResult = await pool.query(`
        SELECT id, title, content, category
        FROM knowledge_entries
        ORDER BY id ASC
        LIMIT 3
      `);

            knowledgeEntries = fallbackResult.rows;
        }

        // Save relation between customer request and used knowledge entries
        for (const entry of knowledgeEntries) {
            await pool.query(
                `
        INSERT INTO message_knowledge_entries (
         message_id,
         knowledge_entry_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         `,
                [messageId, entry.id]
            );
        }

        // Build context for Claude
        const contextText = knowledgeEntries
            .map(
                (entry) =>
                    `Quelle: ${entry.title}\nKategorie: ${entry.category}\nInhalt: ${entry.content}`
            )
            .join("\n\n");

        const prompt = `
Du bist ein professioneller KI-basierter Sales-Assistent für Enterprise-Kunden.

AUFGABE:
Analysiere die Kundenanfrage und erstelle eine passende Antwort auf Basis der Wissensbasis.

WICHTIGE REGELN:
- Antworte ausschliesslich auf Deutsch.
- Verwende nur Informationen aus der Wissensbasis.
- Erfinde keine Informationen.
- Keine Markdown-Formatierung.
- Keine Sternchen.
- Keine Emojis.
- Erwähne die Quellen nicht direkt im Antworttext.
- Wenn eine Information nicht in der Wissensbasis steht, formuliere vorsichtig.
- Gib deine Antwort ausschliesslich als gültiges JSON zurück.

JSON-FORMAT:
{
  "answer": "Professionelle Antwort als Fliesstext",
  "requestType": "Kurzer Typ der Anfrage",
  "priority": "Niedrig | Mittel | Hoch",
  "intents": ["Absicht 1", "Absicht 2"],
  "confidence": 0.95
}

KUNDENANFRAGE:
${requestText}

WISSENSBASIS:
${contextText}
`;

        // Claude request
        const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            temperature: 0.4,
            system:
                "Du bist ein hilfreicher Sales-Assistent für Enterprise-Kundenanfragen. Gib immer gültiges JSON zurück.",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const rawAiText =
            message.content[0]?.type === "text"
                ? message.content[0].text.trim()
                : "";

        // Remove possible markdown code fences
        const cleanedAiText = rawAiText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let aiResult = {
            answer: "Es konnte keine Antwort generiert werden.",
            requestType: "Unbekannt",
            priority: "Mittel",
            intents: ["Allgemeine Anfrage"],
            confidence: 0.7,
        };

        try {
            aiResult = JSON.parse(cleanedAiText);
        } catch (parseError) {
            console.error("Failed to parse Claude JSON response:", cleanedAiText);
        }

        const generatedAnswer = aiResult.answer;

        // Store generated AI response
        const savedAiResponse = await pool.query(
            `
      INSERT INTO ai_responses (
        message_id,
        generated_text,
        status,
        request_type,
        priority,
        intents,
        confidence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, status, created_at
      `,
            [
                messageId,
                generatedAnswer,
                "generated",
                aiResult.requestType,
                aiResult.priority,
                aiResult.intents,
                aiResult.confidence,
            ]
        );

        console.log(`AI response generated successfully for message ${messageId}`);

        res.json({
            answer: generatedAnswer,
            messageId,
            aiResponseId: savedAiResponse.rows[0].id,
            status: savedAiResponse.rows[0].status,
            created_at: savedAiResponse.rows[0].created_at,
            requestType: aiResult.requestType,
            priority: aiResult.priority,
            intents: aiResult.intents,
            confidence: aiResult.confidence,
            sources: knowledgeEntries.map((entry) => ({
                id: entry.id,
                title: entry.title,
                category: entry.category,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate AI answer" });
    }
});


// Load history overview
app.get("/history", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        a.id AS ai_response_id,
        a.message_id,
        m.content AS customer_request,
        a.generated_text AS ai_answer,
        a.status,
        a.created_at,
        m.customer_name,
        m.customer_company,
        to_char(a.created_at, 'DD.MM.YYYY') AS created_date,
        to_char(a.created_at, 'HH24:MI') AS created_time
      FROM ai_responses a
      JOIN messages m ON a.message_id = m.id
      ORDER BY a.created_at DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to load history",
        });
    }
});

// Load one AI response with related customer request
app.get("/ai-responses/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      SELECT
        a.id AS ai_response_id,
        a.message_id,
        m.content AS customer_request,
        a.generated_text AS ai_answer,
        a.status,
        a.request_type,
        a.priority,
        a.intents,
        a.confidence,
        a.created_at,
        m.customer_name,
        m.customer_company
      FROM ai_responses a
      JOIN messages m ON a.message_id = m.id
      WHERE a.id = $1
      `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "AI response not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load AI response" });
    }
});

// Update AI response status
app.patch("/ai-responses/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["generated", "in_review", "approved"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const result = await pool.query(
            `
      UPDATE ai_responses
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
            [status, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update AI response status" });
    }
});

// Update edited AI response text
app.patch("/ai-responses/:id/text", async (req, res) => {
    try {
        const { id } = req.params;
        const { generatedText } = req.body;

        if (!generatedText || !generatedText.trim()) {
            return res.status(400).json({ error: "Generated text is required" });
        }

        const result = await pool.query(
            `
      UPDATE ai_responses
      SET generated_text = $1
      WHERE id = $2
      RETURNING *
      `,
            [generatedText, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update AI response text" });
    }
});

pool
    .connect()
    .then(() => {
        console.log("Connected to PostgreSQL");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});

// Simple login endpoint
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        // Find user by email
        const result = await pool.query(
            `
      SELECT id, username, email, password_hash
      FROM users
      WHERE email = $1
      `,
            [email]
        );

        // User not found
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        // Simple password check for PoC
        if (password !== user.password_hash) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        // Successful login
        res.json({
            message: "Login successful",

            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Login failed",
        });
    }
});

// Load knowledge base entries
app.get("/knowledge", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        id,
        title,
        category,
        content,
        created_at,
        file_type,
        file_size,
        usage_count,
        used_in_responses
      FROM knowledge_entries
      ORDER BY created_at DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load knowledge entries" });
    }

});

