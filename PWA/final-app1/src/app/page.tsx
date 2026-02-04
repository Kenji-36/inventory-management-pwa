import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <DashboardContent userName={session.user.name || "ユーザー"} />
      </div>
    </AppLayout>
  );
}
