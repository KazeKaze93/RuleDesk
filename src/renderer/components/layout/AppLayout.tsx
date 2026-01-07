import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PanicButton } from "./PanicButton";
import { ViewerDialog } from "@/features/viewer/ViewerDialog";

export const AppLayout = () => {
  return (
    <div className="flex overflow-hidden w-full h-screen bg-background text-foreground">
      {/* Left Rail */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <GlobalTopBar />

        {/* Scrollable Content */}
        <main className="overflow-auto flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>

      {/* ViewerDialog must always be rendered - it manages visibility internally via Dialog */}
      <ViewerDialog />
      <PanicButton />
    </div>
  );
};
