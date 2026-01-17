import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLElement>) => void;
}

export const Container = ({ children, className = "" }: LayoutProps) => (
  <main className={`app-container ${className}`}>
    {children}
  </main>
);

export const ScrollArea = ({ children, className = "", onScroll }: LayoutProps) => (
  <section onScroll={onScroll} className={`scroll-area no-scrollbar ${className}`}>
    {children}
  </section>
);
