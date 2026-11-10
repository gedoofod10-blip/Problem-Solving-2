import type { Metadata } from "next";
import { LearningApp } from "@/components/learning-app";
export const metadata: Metadata = { title: "إنجازاتي" };
export default function AchievementsPage() { return <LearningApp view="achievements" />; }
