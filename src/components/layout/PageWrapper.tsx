import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper = ({ children }: PageWrapperProps) => (
  <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-900 to-slate-950">
    {children}
  </div>
);

export default PageWrapper;
