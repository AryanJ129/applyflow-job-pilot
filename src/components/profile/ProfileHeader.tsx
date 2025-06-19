
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="text-[#1f1f1f] border-[#1f1f1f] hover:bg-[#1f1f1f] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div></div> {/* Spacer for centering */}
      </div>
      <h1 className="text-3xl font-bold text-[hsl(222.2_84%_4.9%)] mb-2">
        Profile Settings
      </h1>
      <p className="text-muted-foreground">
        Manage your personal information and career details
      </p>
    </div>
  );
};

export default ProfileHeader;
