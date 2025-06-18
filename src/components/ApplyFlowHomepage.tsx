"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import FeatureSteps from "./FeatureSteps";
import TestimonialsSection from "./TestimonialsSection";
import Footer from "./Footer";

const ApplyFlowHomepage = () => {
  const features = [
    {
      step: "Step 1",
      title: "Fill in your experience",
      content: "Add your work history, education, and skills to create a comprehensive profile.",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
    },
    {
      step: "Step 2", 
      title: "Use AI to generate resume sections",
      content: "Our AI analyzes job descriptions and tailors your resume for maximum ATS compatibility.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
    },
    {
      step: "Step 3",
      title: "Track jobs and schedule interviews",
      content: "Monitor application status, set reminders, and prepare for interviews with AI-generated questions.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const testimonials = [
    {
      quote: "Got 3 interviews in a week using ApplyFlow! The AI resume builder is incredible.",
      name: "Riya S.",
      designation: "Software Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=150&h=150&auto=format&fit=crop&crop=face"
    },
    {
      quote: "ApplyFlow helped me land my dream job. The job tracker kept me organized throughout my search.",
      name: "Amit P.",
      designation: "Product Manager", 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop&crop=face"
    },
    {
      quote: "The interview prep feature gave me confidence. I felt prepared for every question.",
      name: "Sarah M.",
      designation: "Marketing Specialist",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop&crop=face"
    },
    {
      quote: "The AI suggestions for resume optimization are spot-on. Increased my response rate by 300%.",
      name: "Michael Chen",
      designation: "Data Scientist",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop&crop=face"
    },
    {
      quote: "Finally, a job tracker that actually helps me stay organized. The reminders are a lifesaver.",
      name: "Jessica Liu",
      designation: "UX Designer",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Glass Navbar */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 dark:bg-black/20 border border-border px-6 py-3 rounded-full shadow-lg transition-all">
        <div className="flex items-center space-x-8">
          <span className="text-lg font-bold text-foreground">ApplyFlow</span>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#resume-builder" className="text-sm text-foreground hover:text-primary transition-colors">
              Resume Builder
            </a>
            <a href="#job-tracker" className="text-sm text-foreground hover:text-primary transition-colors">
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

      {/* Hero Section */}
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

      {/* Features Section */}
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

      {/* How It Works Section */}
      <FeatureSteps 
        features={features}
        title="See How It Works"
        autoPlayInterval={4000}
      />

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link to="/login">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                Try It Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection
        title="Loved by Job Seekers"
        description="Join thousands of professionals who have accelerated their job search with ApplyFlow"
        testimonials={testimonials}
        className="bg-muted/30"
      />

      <Footer />
    </div>
  );
};

export default ApplyFlowHomepage;
