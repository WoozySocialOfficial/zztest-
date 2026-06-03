import { redirect } from "next/navigation";

export default function Home() {
  // Auth gating lives in /app; unauthenticated users get sent to /login there.
  redirect("/app");
}
