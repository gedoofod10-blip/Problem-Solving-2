import type { Metadata } from "next";
import { LearningApp } from "@/components/learning-app";
export const metadata: Metadata = { title: "التحديات اليومية" };
export default function ChallengesPage() { return <LearningApp view="challenges" />; }
