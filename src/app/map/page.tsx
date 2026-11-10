import type { Metadata } from "next";
import { LearningApp } from "@/components/learning-app";
export const metadata: Metadata = { title: "خريطة التعلّم" };
export default function MapPage() { return <LearningApp view="map" />; }
