import type { Metadata } from "next";
import { ReviewWorkspace } from "@/components/review-engine/ReviewWorkspace";

export const metadata: Metadata = { title: "Réviser" };

export default function ReviewPage() {
  return <ReviewWorkspace />;
}
