
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountSecuritySectionProps {
  email: string;
  onLogout: () => void;
}

const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  email,
  onLogout,
}) => {
  const { toast } = useToast();

  const handleChangePassword = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Password change functionality will be available soon.",
    });
  };

  return (
    <>
      {/* Account & Security Section */}
      <div className="rounded-xl border border-[#e6e6e6] bg-white/70 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-4">
          Account & Security
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
              Email Address
            </Label>
            <Input
              value={email}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>
          
          <div>
            <Label className="text-[hsl(222.2_84%_4.9%)] font-medium">
              Password
            </Label>
            <div className="mt-1">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleChangePassword}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-8 border-t border-[#e6e6e6]">
        <Button
          onClick={onLogout}
          variant="outline"
          className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] rounded-full w-full py-3 font-semibold border-[#1f1f1f]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );
};

export default AccountSecuritySection;
