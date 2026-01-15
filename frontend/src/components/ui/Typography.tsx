import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export const Heading = ({ children, className = "" }: TypographyProps) => (
  <h3 className={`typography-heading ${className}`}>
    {children}
  </h3>
);

export const Subheading = ({ children, className = "" }: TypographyProps) => (
  <p className={`typography-subheading ${className}`}>
    {children}
  </p>
);

export const StationName = ({ children, className = "" }: TypographyProps) => (
  <h4 className={`station-name ${className}`}>
    {children}
  </h4>
);

export const Metadata = ({ children, className = "" }: TypographyProps) => (
  <p className={`metadata ${className}`}>
    {children}
  </p>
);

export const SectionTitle = ({ children, className = "" }: TypographyProps) => (
  <h2 className={`section-title ${className}`}>
    {children}
  </h2>
);
