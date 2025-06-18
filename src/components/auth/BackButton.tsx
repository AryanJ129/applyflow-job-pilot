
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/')}
      className="absolute top-6 left-6 backdrop-blur-md bg-white/70 border border-[hsl(214.3_31.8%_91.4%)] rounded-full p-3 hover:bg-white/80 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ArrowLeft className="w-5 h-5 text-[hsl(222.2_84%_4.9%)]" />
    </motion.button>
  );
};

export default BackButton;
