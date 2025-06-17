
import React from "react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  designation: string;
  avatar: string;
}

const TestimonialCard = ({ quote, name, designation, avatar }: TestimonialCardProps) => {
  return (
    <div className="w-80 flex-shrink-0 bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            "{quote}"
          </p>
          <div>
            <p className="font-semibold text-foreground text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{designation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
