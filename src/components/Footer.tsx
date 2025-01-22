import React from "react";

export const Footer = () => {
  return (
    <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Identity Newsroom. All rights reserved.</p>
    </footer>
  );
};