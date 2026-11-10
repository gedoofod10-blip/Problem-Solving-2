import questionData from "@/data/questions.json";
import type { Question } from "@/lib/types";

// This module is imported only by server code. Answer keys never enter client components.
export const questions = questionData as Question[];
