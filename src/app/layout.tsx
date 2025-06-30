import { Toaster } from "@/shared/ui/sonner";
import "../index.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster />
    </div>
  );
}
