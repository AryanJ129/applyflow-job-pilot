
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname === '/ats') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <motion.button
      onClick={handleBack}
      className="absolute top-6 left-6 bg-white/70 backdrop-blur-md border border-[#e6e6e6] rounded-full p-3 hover:bg-white/80 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </motion.button>
  );
};

export default BackButton;
