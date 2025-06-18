
import React from 'react';
import { motion } from 'framer-motion';

const Resume = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div 
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Resume Builder
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to your AI-powered resume builder! This page will be built next.
        </p>
      </motion.div>
    </div>
  );
};

export default Resume;
