import { redirect } from "next/navigation";

// Redirect to sign-in page for initial visit
export default function Home() {
  redirect("/sign-in");
}
