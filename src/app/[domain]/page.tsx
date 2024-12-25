import Navigation from "@/components/site/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Home from "@/app/site/page";
import React from "react";

const page = () => {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <main className="h-full">
        <Navigation />
        <Home />
      </main>
    </ClerkProvider>
  );
};

export default page;
