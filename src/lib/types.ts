export type QuestionType = "mcq" | "boolean" | "text";
export type Difficulty = "سهل" | "متوسط" | "متقدم";

export interface Question {
  id: number;
  chapterId: number;
  chapter: string;
  stage: number;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  code?: string;
  xp: number;
}

export type PublicQuestion = Omit<Question, "correctAnswer" | "acceptedAnswers" | "explanation">;

export interface ProgressData {
  displayName: string;
  xp: number;
  completedQuestionIds: string[];
  completedStages: string[];
  unlockedStages: string[];
  totalAttempts: number;
  correctAttempts: number;
  streak: number;
  bestStreak: number;
  activityDates: string[];
  dailyCompletions: string[];
  updatedAt: string;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  xpAwarded: number;
  progress: ProgressData;
}

export interface Settings {
  name: string;
  sound: boolean;
  reducedMotion: boolean;
}

export const EMPTY_PROGRESS: ProgressData = {
  displayName: "مستكشف جديد",
  xp: 0,
  completedQuestionIds: [],
  completedStages: [],
  unlockedStages: ["1-1"],
  totalAttempts: 0,
  correctAttempts: 0,
  streak: 0,
  bestStreak: 0,
  activityDates: [],
  dailyCompletions: [],
  updatedAt: "",
};

export const DEFAULT_SETTINGS: Settings = { name: "مستكشف جديد", sound: false, reducedMotion: false };
