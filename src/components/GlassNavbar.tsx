
import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const GlassNavbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 dark:bg-black/20 border border-border px-8 py-3 rounded-full shadow-lg transition-all">
      <div className="flex items-center space-x-10 whitespace-nowrap">
        <span className="text-lg font-bold text-foreground">ApplyFlow</span>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/onboarding" className="text-sm text-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform">
            Resume Builder
          </Link>
          <Link to="/ats" className="text-sm text-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform">
            ATS Tracker
          </Link>
          <a href="#job-tracker" className="text-sm text-foreground hover:text-primary transition-all duration-300 hover:scale-110 transform">
            Job Tracker
          </a>
          <Link to="/login" className="group flex items-center gap-2 text-sm text-foreground hover:text-primary transition-all duration-300 border border-border rounded-full px-4 py-2 hover:scale-105 hover:border-primary">
            <span className="group-hover:scale-105 transition-transform duration-300">Get Started</span>
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ArrowRight className="h-3 w-3 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default GlassNavbar;
