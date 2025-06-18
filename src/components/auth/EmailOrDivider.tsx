
import React from 'react';

const EmailOrDivider = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[hsl(214.3_31.8%_91.4%)]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white/70 px-2 text-[hsl(215.4_16.3%_46.9%)]">Or</span>
      </div>
    </div>
  );
};

export default EmailOrDivider;
