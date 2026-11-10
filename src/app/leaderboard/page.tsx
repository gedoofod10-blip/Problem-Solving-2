import type { Metadata } from "next";
import { LearningApp } from "@/components/learning-app";
export const metadata: Metadata = { title: "لوحة الشرف" };
export default function LeaderboardPage() { return <LearningApp view="leaderboard" />; }
