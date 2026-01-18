import { BottomNav } from "@/components/bottom-nav";
import { Topbar } from "@/components/topbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
