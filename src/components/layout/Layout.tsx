import { Header } from "./Header";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useInactivityLogout();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="container py-8 px-4 sm:px-8">{children}</main>
    </div>
  );
}
