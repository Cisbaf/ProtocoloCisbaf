import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Inspector from "@/components/Inspector";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("loginToken");

  if (!session?.value) {
    redirect("/login");
  }

  return <Inspector />;
}
