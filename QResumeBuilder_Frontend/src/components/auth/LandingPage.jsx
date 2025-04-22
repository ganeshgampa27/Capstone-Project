import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../common/Header';


const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
    <Header/>
    <div className="bg-gradient-to-br from-gray-900 to-indigo-900 min-h-screen flex items-center justify-center p-6 text-white">
      <motion.div
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={containerVariants}
        className="max-w-5xl mx-auto"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={{ scale: [0.9, 1], opacity: [0, 1] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-xl md:text-4xl">
  Build Your Dream Resume
</span>
          </motion.h1>
          <motion.p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Create professional resumes that stand out and get you noticed by top employers
          </motion.p>
        </motion.div>
        <motion.div 
          variants={itemVariants}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-blue-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-10 w-10">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Professional Templates</h3>
            <p className="text-sm text-gray-300">
              Choose from dozens of ATS-friendly templates designed by professionals
            </p>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-purple-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-10 w-10">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Instant Generation</h3>
            <p className="text-sm text-gray-300">
              Create a complete resume in minutes with our custom-based templates
            </p>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-green-400 text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-10 w-10">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Expert Content</h3>
            <p className="text-sm text-gray-300">
              Get tailored content suggestions based on your industry and experience level
            </p>
          </motion.div>
        </motion.div>
        <motion.div 
          variants={itemVariants}
          className="relative mx-auto w-full max-w-4xl h-96 mb-16"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-2xl"
            animate={{ 
              rotate: [0, 2, 0, -2, 0],
              scale: [1, 1.01, 1],
            }}
            transition={{ 
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <div className="h-full w-full bg-gray-800 m-1 rounded-lg p-6 overflow-hidden">
              <div className="flex h-full">
                <div className="w-1/3 pr-4">
                  <div className="bg-gray-700 rounded-full h-32 w-32 mb-4"></div>
                  <div className="bg-gray-700 h-4 rounded mb-3 w-3/4"></div>
                  <div className="bg-gray-700 h-3 rounded mb-6 w-5/6"></div>
                  
                  <div className="bg-gray-700 h-5 rounded mb-2 w-1/2"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-5/6"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-4/6"></div>
                  <div className="bg-gray-700 h-3 rounded mb-6 w-5/6"></div>
                  
                  <div className="bg-gray-700 h-5 rounded mb-2 w-2/3"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-5/6"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-3/4"></div>
                </div>
                
                <div className="w-2/3 pl-4">
                  <div className="bg-gray-700 h-6 rounded mb-6 w-1/2"></div>
                  
                  <div className="flex justify-between mb-1">
                    <div className="bg-gray-700 h-4 rounded w-1/3"></div>
                    <div className="bg-gray-700 h-4 rounded w-1/4"></div>
                  </div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-full"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-5/6"></div>
                  <div className="bg-gray-700 h-3 rounded mb-6 w-4/5"></div>
                  
                  <div className="flex justify-between mb-1">
                    <div className="bg-gray-700 h-4 rounded w-1/3"></div>
                    <div className="bg-gray-700 h-4 rounded w-1/4"></div>
                  </div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-full"></div>
                  <div className="bg-gray-700 h-3 rounded mb-1 w-4/5"></div>
                  <div className="bg-gray-700 h-3 rounded mb-6 w-5/6"></div>
                  
                  <div className="bg-gray-700 h-5 rounded mb-3 w-1/4"></div>
                  <div className="flex space-x-2 mb-1">
                    <div className="bg-gray-700 h-3 rounded w-1/4"></div>
                    <div className="bg-gray-700 h-3 rounded w-1/4"></div>
                    <div className="bg-gray-700 h-3 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        <motion.div 
          variants={itemVariants}
          className="text-center mb-12"
        >
          <motion.h2 
            className="text-3xl font-bold mb-6"
            animate={{ 
              backgroundPositionX: ["0%", "100%"],
              backgroundPositionY: "0%",
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
              backgroundSize: "200% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Dream Career Starts With The Perfect Resume
          </motion.h2>
          <p className="text-base text-gray-300 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully landed their dream jobs with our resume builder
          </p>
        </motion.div>
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-500/10 blur-3xl"
              style={{
                width: `${Math.random() * 30 + 10}rem`,
                height: `${Math.random() * 30 + 10}rem`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 40 - 20],
                y: [0, Math.random() * 40 - 20],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
   
    </>
  );

};

export default LandingPage;