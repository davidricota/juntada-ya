import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-card py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} juntadaYa!</p>
      </div>
    </footer>
  );
};

export default Footer;
