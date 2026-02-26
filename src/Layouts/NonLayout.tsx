import React, { ReactNode } from "react";

interface NonLayoutProps {
  children: ReactNode;
}

const NonLayout = ({ children }: NonLayoutProps) => {
  return <React.Fragment>{children}</React.Fragment>;
};

export default NonLayout;
