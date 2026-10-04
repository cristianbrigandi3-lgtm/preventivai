import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { Shell } from "@/components/ui";
import NewQuote from "./form";

export default async function Page() {
  if (!(await getUserId())) redirect("/login");
  return <Shell><h1 className="text-2xl font-bold mb-4">Nuovo preventivo</h1><NewQuote /></Shell>;
}
