
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-[hsl(0_0%_100%)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(222.2_84%_4.9%)]"></div>
    </div>
  );
};

export default LoadingSpinner;
