
import React from 'react';
import { FileText, BarChart3, FolderOpen, User } from 'lucide-react';
import DashboardCard from './DashboardCard';

const DashboardCards: React.FC = () => {
  const dashboardCards = [
    {
      icon: <FileText className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Build Resume",
      description: "Tailor your resume for any job role",
      ctaText: "Open Resume Builder",
      ctaLink: "/resume",
      bgColor: "bg-blue-50"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Check Resume Score",
      description: "See how your resume performs against hiring algorithms",
      ctaText: "Try ATS Checker",
      ctaLink: "/ats",
      bgColor: "bg-green-50"
    },
    {
      icon: <FolderOpen className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Track Applications",
      description: "Log and manage where you've applied",
      ctaText: "Go to Tracker",
      ctaLink: "/tracker",
      bgColor: "bg-purple-50"
    },
    {
      icon: <User className="h-8 w-8 text-[#1f1f1f]" />,
      title: "Update Profile",
      description: "Make changes to your personal information or career goals",
      ctaText: "Edit Profile",
      ctaLink: "/profile",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {dashboardCards.map((card, index) => (
        <DashboardCard
          key={index}
          icon={card.icon}
          title={card.title}
          description={card.description}
          ctaText={card.ctaText}
          ctaLink={card.ctaLink}
          bgColor={card.bgColor}
        />
      ))}
    </div>
  );
};

export default DashboardCards;
