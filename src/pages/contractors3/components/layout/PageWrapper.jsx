
import React from "react";

export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#080808] text-white selection:bg-white/20">
      <main className="mx-auto w-full max-w-[1200px] px-6 lg:px-12">
        {children}
      </main>
    </div>
  );
}