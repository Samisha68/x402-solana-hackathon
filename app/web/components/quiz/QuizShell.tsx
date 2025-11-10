"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard } from "./QuestionCard";
import { TimerBar } from "./TimerBar";
import { ResultBanner } from "./ResultBanner";
import { PaymentGate } from "./PaymentGate";
import { ProgressDots } from "./ProgressDots";
import { useHotkeys } from "./Hotkeys";
import { XPAnimation } from "./XPAnimation";
import { WelcomeScreen } from "./WelcomeScreen";
import { Scorecard } from "./Scorecard";
import { loadState, saveState, resetQuestState, getLevel, getRank } from "@/lib/quest";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";
const TIMER_SECONDS = 10;
const TOTAL_QUESTIONS = 10;

type QuizState = 
  | "WELCOME"
  | "IDLE"
  | "LOADING_QUESTION"
  | "SHOWING_QUESTION"
  | "SUBMITTING"
  | "CORRECT"
  | "WRONG_ANSWER"
  | "PAYMENT_REQUIRED"
  | "PAYING"
  | "PAID"
  | "SHOWING_EXPLANATION"
  | "READY_NEXT"
  | "COMPLETED";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  level: number;
  timerSeconds: number;
}

interface SubmitResponse {
  correct: boolean;
  xp: number;
  explanationShort?: string;
  explanationFull?: string;
  nextUnlocked?: boolean;
}

type Topic = "Solana Basics" | "Anchor Basics" | "PDAs & Programs" | "Transactions & Troubleshooting";

interface QuizSession {
  name: string;
  topic: Topic;
  correct: number;
  wrong: number;
  questionsAnswered: number;
  startXP: number;
  askedQuestionIds: string[]; // Track which questions have been asked
}

const QUIZ_SESSION_KEY = "x402-quiz-session";

function loadQuizSession(): QuizSession | null {
  try {
    const stored = localStorage.getItem(QUIZ_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

function saveQuizSession(session: QuizSession): void {
  try {
    localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // Ignore storage errors
  }
}

function clearQuizSession(): void {
  try {
    localStorage.removeItem(QUIZ_SESSION_KEY);
  } catch (e) {
    // Ignore errors
  }
}

export function QuizShell() {
  const [state, setState] = useState<QuizState>("WELCOME");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [sessionId] = useState(() => `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [explanation, setExplanation] = useState<string>("");
  const [xpGained, setXpGained] = useState(0);
  const [xpAnimationTrigger, setXpAnimationTrigger] = useState(0);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const isLoadingQuestion = useRef(false);

  // Clear session on page load (prevent resume on refresh)
  useEffect(() => {
    // Clear any existing session - refreshing should reset the quiz
    clearQuizSession();
    // Reset XP to 0 on refresh
    resetQuestState();
    // Dispatch events to update XP display immediately
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("xp-reset"));
    setState("WELCOME");
  }, []);

  const handleStart = useCallback((name: string, topic: Topic) => {
    // Reset XP to 0 for new quiz
    resetQuestState();
    // Dispatch storage event to update XPDisplay immediately
    window.dispatchEvent(new Event("storage"));
    // Also trigger a custom event to ensure all components update
    window.dispatchEvent(new CustomEvent("xp-reset"));

    // Create new quiz session
    const session: QuizSession = {
      name,
      topic,
      correct: 0,
      wrong: 0,
      questionsAnswered: 0,
      startXP: 0,
      askedQuestionIds: [],
    };
    setQuizSession(session);
    saveQuizSession(session);
    setState("IDLE");
  }, []);

  const loadQuestion = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingQuestion.current) return;
    
    setQuizSession((currentSession) => {
      if (!currentSession) return currentSession;
      
      // Check if quiz is complete
      if (currentSession.questionsAnswered >= TOTAL_QUESTIONS) {
        setState("COMPLETED");
        return currentSession;
      }
      
      // Prevent loading if already loading
      if (isLoadingQuestion.current) return currentSession;
      isLoadingQuestion.current = true;
      
      // Load question asynchronously
      (async () => {
        setState("LOADING_QUESTION");
        try {
          // Fetch questions from selected topic until we get one we haven't asked yet
          let attempts = 0;
          let data: Question | null = null;
          const maxAttempts = 20; // Max attempts to find unique questions from topic
          
          while (attempts < maxAttempts) {
            try {
              const response = await fetch(`${API_URL}/quiz/question?mode=topic&topic=${encodeURIComponent(currentSession.topic)}`);
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load question: ${response.status} ${errorText}`);
              }
              
              const fetched = await response.json();
              
              // Check if we've already asked this question
              if (!currentSession.askedQuestionIds.includes(fetched.id)) {
                data = fetched;
                break;
              }
              
              attempts++;
            } catch (fetchError) {
              // If it's a network error (server not running), throw immediately
              if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
                throw new Error(`Cannot connect to server at ${API_URL}. Make sure the backend server is running.`);
              }
              // Otherwise, continue trying
              attempts++;
              if (attempts >= maxAttempts) {
                throw fetchError;
              }
            }
          }
          
          // If we couldn't find a new question, we've run out - end quiz
          if (!data) {
            console.warn("Ran out of unique questions, ending quiz");
            setState("COMPLETED");
            isLoadingQuestion.current = false;
            return;
          }
          
          // Add to asked questions
          const updated: QuizSession = {
            ...currentSession,
            askedQuestionIds: [...currentSession.askedQuestionIds, data.id],
          };
          
          setQuizSession(updated);
          saveQuizSession(updated);
          
          setQuestion(data);
          setTimeLeft(data.timerSeconds || TIMER_SECONDS);
          setSelectedOption(null);
          setState("SHOWING_QUESTION");
          isLoadingQuestion.current = false;
        } catch (error) {
          console.error("Failed to load question", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          // Show error state instead of silently retrying
          setState("IDLE");
          isLoadingQuestion.current = false;
          // Log detailed error for debugging
          console.error("Quiz question load error:", {
            error: errorMessage,
            apiUrl: API_URL,
            topic: currentSession.topic,
            session: currentSession,
          });
        }
      })();
      
      return currentSession;
    });
  }, []); // Empty deps - uses functional update instead

  const handleNext = useCallback(async () => {
    // Use functional update to get latest session state
    let shouldLoadNext = false;
    setQuizSession((currentSession) => {
      if (!currentSession) return currentSession;

      // Check if quiz is complete (questionsAnswered is already incremented in submit handlers)
      if (currentSession.questionsAnswered >= TOTAL_QUESTIONS) {
        // Quiz complete - show scorecard
        setState("COMPLETED");
        return currentSession;
      }

      // Mark that we should load the next question
      shouldLoadNext = true;

      // DO NOT increment questionsAnswered here - it's already incremented in submit handlers
      // Just update the current question index
      setCurrentQuestionIndex(currentSession.questionsAnswered);
      
      // Reset state
      setExplanation("");
      setXpGained(0);
      setSelectedOption(null);
      
      return currentSession;
    });

    // Call /quiz/next to validate and clear session (async, but we proceed anyway)
    fetch(`${API_URL}/quiz/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch((error) => {
      console.error("Failed to proceed to next question", error);
    });

    // Load next question after state update
    if (shouldLoadNext) {
      await loadQuestion();
    }
  }, [sessionId, loadQuestion]);

  const handleSubmit = useCallback(async (optionId: string | null) => {
    if (!question || !quizSession) return;
    
    // Prevent multiple submissions
    if (state !== "SHOWING_QUESTION") return;
    
    setState("SUBMITTING");
    
    try {
      const response = await fetch(`${API_URL}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          optionId: optionId || "timeout",
          sessionId,
        }),
      });

      if (response.status === 200) {
        const data: SubmitResponse = await response.json();
        if (data.correct) {
          setXpGained(data.xp);
          setExplanation(data.explanationShort || "Correct!");
          setState("CORRECT");
          
          // Award XP using proper saveState function
          const questState = loadState();
          questState.xp += data.xp;
          saveState(questState);
          window.dispatchEvent(new Event("storage"));
          // Trigger XP animation
          setXpAnimationTrigger((prev) => prev + 1);
          
          // Update session - preserve all fields including askedQuestionIds
          const updated: QuizSession = {
            ...quizSession,
            correct: quizSession.correct + 1,
            questionsAnswered: quizSession.questionsAnswered + 1,
            askedQuestionIds: quizSession.askedQuestionIds, // Preserve asked questions
          };
          setQuizSession(updated);
          saveQuizSession(updated);
          
          // Check if this was the last question
          if (updated.questionsAnswered >= TOTAL_QUESTIONS) {
            setTimeout(() => {
              setState("COMPLETED");
            }, 3000);
          } else {
            // Automatically proceed to next question after showing success
            setTimeout(() => {
              handleNext();
            }, 3000);
          }
        } else if ((data as any).paymentRequired) {
          // Wrong answer - apply -5 XP penalty immediately
          const questState = loadState();
          questState.xp = Math.max(0, questState.xp - 5); // Don't go below 0
          saveState(questState);
          window.dispatchEvent(new Event("storage"));
          
          setXpGained(-5); // Show -5 XP penalty
          setExplanation("Wrong answer! Pay to see the full explanation and continue.");
          setState("WRONG_ANSWER");
          // Trigger XP animation for penalty
          setXpAnimationTrigger((prev) => prev + 1);
          
          // Show payment gate after 2 seconds
          setTimeout(() => {
            setState("PAYMENT_REQUIRED");
          }, 2000);
        } else {
          throw new Error("Unexpected response format");
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to submit answer");
      setState("IDLE");
    }
  }, [question, sessionId, state, handleNext, quizSession]);

  const handlePaymentComplete = useCallback((data: { xp: number; explanationFull: string }) => {
    if (!quizSession) return;
    
    // No XP gained after payment - the -5 XP penalty remains
    setXpGained(0);
    setExplanation(data.explanationFull || "Payment successful!");
    setState("SHOWING_EXPLANATION");
    
    // Do NOT add XP - payment only unlocks explanation, penalty remains
    
    // Update session - preserve all fields including askedQuestionIds
    const updated: QuizSession = {
      ...quizSession,
      wrong: quizSession.wrong + 1,
      questionsAnswered: quizSession.questionsAnswered + 1,
      askedQuestionIds: quizSession.askedQuestionIds, // Preserve asked questions
    };
    setQuizSession(updated);
    saveQuizSession(updated);
    
    // Check if this was the last question
    if (updated.questionsAnswered >= TOTAL_QUESTIONS) {
      setTimeout(() => {
        setState("COMPLETED");
      }, 3000);
    } else {
      // Automatically proceed to next question after showing explanation
      setTimeout(() => {
        handleNext();
      }, 3000);
    }
  }, [handleNext, quizSession]);

  // Load initial question when ready
  // Only trigger when state changes to IDLE, not when quizSession changes
  useEffect(() => {
    if (state === "IDLE" && quizSession && !isLoadingQuestion.current) {
      // Check if quiz is complete
      if (quizSession.questionsAnswered >= TOTAL_QUESTIONS) {
        setState("COMPLETED");
        return;
      }
      
      // Only load if we haven't reached the question limit
      if (quizSession.questionsAnswered < TOTAL_QUESTIONS) {
        loadQuestion();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]); // Only depend on state, not quizSession or loadQuestion to prevent loops

  // Timer countdown
  useEffect(() => {
    if (state !== "SHOWING_QUESTION" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit as wrong
          if (state === "SHOWING_QUESTION" && question && !selectedOption) {
            handleSubmit(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeLeft, question, selectedOption, handleSubmit]);

  // Keyboard shortcuts
  useHotkeys({
    onOptionSelect: (index: number) => {
      if (state === "SHOWING_QUESTION" && question) {
        const optionId = question.options[index]?.id;
        if (optionId) {
          setSelectedOption(optionId);
          handleSubmit(optionId);
        }
      }
    },
    onNext: () => {
      // Allow manual skip with N key if needed
      if (state === "SHOWING_EXPLANATION" || state === "CORRECT") {
        handleNext();
      }
    },
  });

  // Show welcome screen
  if (state === "WELCOME") {
    return <WelcomeScreen onStart={handleStart} />;
  }

  // Show scorecard
  if (state === "COMPLETED" && quizSession) {
    const questState = loadState();
    const rank = getRank(questState.xp);
    return (
      <Scorecard
        name={quizSession.name}
        topic={quizSession.topic}
        correct={quizSession.correct}
        wrong={quizSession.wrong}
        totalXP={questState.xp}
        rank={rank}
      />
    );
  }

  // Show quiz
  return (
    <div className="space-y-6">
      {/* XP Animation */}
      <XPAnimation xpGained={xpGained} trigger={xpAnimationTrigger} />
      
      {/* Progress Dots */}
      <ProgressDots current={currentQuestionIndex} total={TOTAL_QUESTIONS} />

      {/* Timer Bar */}
      {state === "SHOWING_QUESTION" && (
        <TimerBar timeLeft={timeLeft} total={TIMER_SECONDS} />
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {state === "SHOWING_QUESTION" && question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <QuestionCard
              question={question}
              selectedOption={selectedOption}
              onSelect={(optionId) => {
                setSelectedOption(optionId);
                handleSubmit(optionId);
              }}
              disabled={state !== "SHOWING_QUESTION"}
            />
          </motion.div>
        )}

        {/* Result Banner */}
        {(state === "CORRECT" || state === "SHOWING_EXPLANATION" || state === "WRONG_ANSWER") && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <ResultBanner
              correct={state === "CORRECT"}
              explanation={explanation}
              xpGained={xpGained}
              isExplanation={state === "SHOWING_EXPLANATION"}
            />
          </motion.div>
        )}

        {/* Payment Gate */}
        {state === "PAYMENT_REQUIRED" && question && (
          <motion.div
            key="payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PaymentGate
              questionId={question.id}
              sessionId={sessionId}
              onComplete={handlePaymentComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {state === "LOADING_QUESTION" && (
        <div className="text-center text-neutral-400 py-12">
          Loading question...
        </div>
      )}
    </div>
  );
}
