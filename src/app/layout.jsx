import "../index.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Sazed Creations",
  description: "Portfolio website for Sazedul Islam, backend software engineer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
