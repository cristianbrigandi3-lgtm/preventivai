import "./globals.css";
import CookieBanner from "@/components/cookie-banner";
export const metadata = { title: "PreventivAI", description: "Crea preventivi professionali in pochi minuti." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="it"><body>{children}<CookieBanner /></body></html>;
}
