
import React from "react";
import GlassNavbar from "./GlassNavbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import FeatureSteps from "./FeatureSteps";
import CtaSection from "./CtaSection";
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
      <GlassNavbar />
      <HeroSection />
      <FeaturesSection />
      
      {/* How It Works Section */}
      <FeatureSteps 
        features={features}
        title="See How It Works"
        autoPlayInterval={4000}
      />

      <CtaSection />

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
