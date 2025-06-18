
import React from "react";
import { motion } from "framer-motion";

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Everything you need to land your dream job
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-4">AI Resume Builder</h3>
            <p className="text-muted-foreground">
              Tailored, job-specific resumes in seconds. Our AI analyzes job descriptions and optimizes your resume for ATS systems.
            </p>
          </motion.div>
          
          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">🗂️</div>
            <h3 className="text-xl font-semibold mb-4">Smart Job Tracker</h3>
            <p className="text-muted-foreground">
              Stay on top of every application with our intelligent tracking system. Never miss a follow-up again.
            </p>
          </motion.div>
          
          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-4">Interview Prep</h3>
            <p className="text-muted-foreground">
              Get ready with AI-generated questions and tips tailored to your target role and company.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
