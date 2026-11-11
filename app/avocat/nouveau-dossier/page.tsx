import { redirect } from "next/navigation";

// Ancienne page : les dossiers sont désormais dans /avocat/dossiers
export default function Page() {
  redirect("/avocat/dossiers");
}
