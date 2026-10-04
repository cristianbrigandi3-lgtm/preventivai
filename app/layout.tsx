import "./globals.css";
export const metadata = { title: "PreventivAI", description: "Crea preventivi professionali in pochi minuti." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="it"><body>{children}</body></html>;
}
