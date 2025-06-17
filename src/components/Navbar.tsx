
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-foreground">ApplyFlow</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#resume-builder" className="text-foreground hover:text-primary transition-colors">
              Resume Builder
            </a>
            <a href="#job-tracker" className="text-foreground hover:text-primary transition-colors">
              Job Tracker
            </a>
            <a href="#login" className="text-foreground hover:text-primary transition-colors">
              Login
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#resume-builder" className="block px-3 py-2 text-foreground hover:text-primary">
              Resume Builder
            </a>
            <a href="#job-tracker" className="block px-3 py-2 text-foreground hover:text-primary">
              Job Tracker
            </a>
            <a href="#login" className="block px-3 py-2 text-foreground hover:text-primary">
              Login
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
