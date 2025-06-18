
import React from 'react';

const EmailOrDivider = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white/70 px-2 text-muted-foreground">Or</span>
      </div>
    </div>
  );
};

export default EmailOrDivider;
