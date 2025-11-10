import { Hono } from "hono";
import { getRandomQuizQuestion, getQuizQuestionByTopic, findById, type KBEntry, type Topic } from "../rag/knowledge.js";

export const quizRouter = new Hono();

// In-memory session store (for demo - in production use Redis/DB)
interface QuizSession {
  questionId: string;
  lastOutcome: "correct" | "wrong" | null;
  paymentSettled: boolean;
  timestamp: number;
}

const sessions = new Map<string, QuizSession>(); // sessionId -> session

/**
 * GET /quiz/question
 * 
 * Query params:
 * - mode: "topic" | "random" (default: "random")
 * - topic: Topic name (required if mode=topic)
 * 
 * Returns: { id, question, options: [{id, text}], topic, timerSeconds: 10 }
 */
quizRouter.get("/question", async (c) => {
  try {
    const mode = c.req.query("mode") || "random";
    const topicParam = c.req.query("topic");
    
    let question: KBEntry | null = null;
    
    if (mode === "topic" && topicParam) {
      question = getQuizQuestionByTopic(topicParam as Topic);
    }
    
    if (!question) {
      question = getRandomQuizQuestion();
    }
    
    if (!question || !question.quizOptions) {
      return c.json({ error: "No quiz questions available" }, 404);
    }
    
    // Shuffle options (keep correct answer but randomize order)
    const shuffled = [...question.quizOptions].sort(() => Math.random() - 0.5);
    
    return c.json({
      id: question.id,
      question: question.q,
      options: shuffled.map(opt => ({ id: opt.id, text: opt.text })),
      topic: question.topic,
      timerSeconds: 10,
    });
  } catch (error) {
    console.error("Error in /quiz/question:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /quiz/submit
 * 
 * Body: { questionId, optionId, sessionId? }
 * 
 * Returns:
 * - 200 (correct): { correct: true, xp: 15, explanationShort, nextUnlocked: true }
 * - 402 (wrong): Payment Required (x402 middleware will handle)
 * - 404: Question not found
 */
quizRouter.post("/submit", async (c) => {
  try {
    const body = await c.req.json();
    const { questionId, optionId, sessionId } = body;
    
    if (!questionId || !optionId) {
      return c.json({ error: "questionId and optionId are required" }, 400);
    }
    
    const entry = findById(questionId);
    if (!entry || !entry.quizOptions) {
      return c.json({ error: "Question not found" }, 404);
    }
    
    // Handle timeout case (no option selected)
    if (optionId === "timeout") {
      // Timeout is always wrong
      const isCorrect = false;
      
      // Update session
      if (sessionId) {
        sessions.set(sessionId, {
          questionId,
          lastOutcome: "wrong",
          paymentSettled: false,
          timestamp: Date.now(),
        });
      }
      
      // Return payment required
      return c.json({
        correct: false,
        paymentRequired: true,
        questionId,
        optionId: "timeout",
      });
    }
    
    const selectedOption = entry.quizOptions.find(opt => opt.id === optionId);
    if (!selectedOption) {
      return c.json({ error: "Invalid option" }, 400);
    }
    
    const isCorrect = selectedOption.correct;
    
    // Update session
    if (sessionId) {
      sessions.set(sessionId, {
        questionId,
        lastOutcome: isCorrect ? "correct" : "wrong",
        paymentSettled: isCorrect, // Correct answers don't need payment
        timestamp: Date.now(),
      });
    }
    
    if (isCorrect) {
      // Correct answer - return immediately
      return c.json({
        correct: true,
        xp: 15,
        explanationShort: entry.explanationShort || "Correct!",
        nextUnlocked: true,
      });
    } else {
      // Wrong answer - return 200 with payment required flag
      // Client will then call /quiz/settle which is protected by x402 middleware
      return c.json({
        correct: false,
        paymentRequired: true,
        questionId,
        optionId,
      });
    }
  } catch (error) {
    console.error("Error in /quiz/submit:", error);
    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /quiz/settle
 * 
 * Protected by x402 middleware - only accessible after payment
 * 
 * Body: { questionId, sessionId? }
 * 
 * Returns: { correct: false, xp: 5, explanationFull, paymentSettled: true }
 */
quizRouter.post("/settle", async (c) => {
  try {
    const body = await c.req.json();
    const { questionId, sessionId } = body;
    
    if (!questionId) {
      return c.json({ error: "questionId is required" }, 400);
    }
    
    const entry = findById(questionId);
    if (!entry || !entry.quizOptions) {
      return c.json({ error: "Question not found" }, 404);
    }
    
    // Update session to mark payment as settled
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.paymentSettled = true;
        sessions.set(sessionId, session);
      }
    }
    
    return c.json({
      correct: false,
      xp: 5,
      explanationFull: entry.explanationFull || entry.aMd,
      paymentSettled: true,
    });
  } catch (error) {
    console.error("Error in /quiz/settle:", error);
    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /quiz/next
 * 
 * Body: { sessionId }
 * 
 * Validates that last submission was correct OR wrong+settled
 * Returns 409 if payment pending
 */
quizRouter.post("/next", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }
    
    const session = sessions.get(sessionId);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }
    
    // Check if can proceed
    const canProceed = 
      session.lastOutcome === "correct" || 
      (session.lastOutcome === "wrong" && session.paymentSettled);
    
    if (!canProceed) {
      return c.json(
        { error: "pending_payment", message: "Payment required before proceeding" },
        409
      );
    }
    
    // Clear session for next question
    sessions.delete(sessionId);
    
    return c.json({ ok: true, nextUnlocked: true });
  } catch (error) {
    console.error("Error in /quiz/next:", error);
    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /quiz/stats
 * 
 * Returns: { streak, totalCorrect, totalWrong, recentQuestions }
 * (For now, returns placeholder - could be enhanced with localStorage parsing)
 */
quizRouter.get("/stats", async (c) => {
  try {
    // Placeholder - in real app, parse from localStorage or DB
    return c.json({
      streak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      recentQuestions: [],
    });
  } catch (error) {
    console.error("Error in /quiz/stats:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

