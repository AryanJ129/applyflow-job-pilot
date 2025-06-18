
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 bg-gradient-to-b from-[hsl(222.2,84%,4.9%)] to-[hsl(0,0%,70%)] dark:from-[hsl(210,40%,98%)] dark:to-[hsl(222.2,84%,20%)] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Build ATS-Ready Resumes.{" "}
          Track Every Job.{" "}
          All in One.
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          AI-powered resume builder and job tracker designed for serious job seekers.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/login">
            <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
              Start Building
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
