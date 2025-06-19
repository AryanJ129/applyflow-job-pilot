
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  description,
  ctaText,
  ctaLink,
  bgColor
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white/70 border border-[#e6e6e6] backdrop-blur-md rounded-xl shadow-md p-6 hover:scale-[1.02] transition-transform duration-200 cursor-pointer group"
      onClick={() => navigate(ctaLink)}
    >
      <div className={`w-16 h-16 ${bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-[hsl(222.2_84%_4.9%)] mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {description}
      </p>
      
      <button
        className="bg-[#1f1f1f] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#2a2a2a] transition-all w-full sm:w-auto"
        onClick={(e) => {
          e.stopPropagation();
          navigate(ctaLink);
        }}
      >
        {ctaText}
      </button>
    </div>
  );
};

export default DashboardCard;
