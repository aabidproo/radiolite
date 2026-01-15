import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: LayoutProps) => (
  <main className={`app-container ${className}`}>
    {children}
  </main>
);

export const ScrollArea = ({ children, className = "" }: LayoutProps) => (
  <section className={`scroll-area no-scrollbar ${className}`}>
    {children}
  </section>
);
