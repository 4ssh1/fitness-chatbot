'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function Hero() {
  const router = useRouter()
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }
  const itemVariants = {
    hidden: {
      y: 50,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  }
  return (
    <section className="relative bg-naija-purple pt-32 pb-40 md:pt-48 md:pb-56 clip-diagonal-bottom overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-naija-magenta rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-40 right-10 w-48 h-48 bg-naija-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-block">
            <span className="bg-naija-yellow text-naija-dark font-bold px-4 py-2 rounded-full text-sm md:text-base uppercase tracking-wider border-2 border-naija-dark box-shadow-bold transform -rotate-2 inline-block">
              Body no be firewood 💪
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-heading text-white mb-8 leading-tight text-shadow-bold"
          >
            No More Guesswork.
            <br />
            <span className="text-naija-yellow">Just Gains.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Meet your AI gym buddy tailored for Nigerians. Because fitness should feel like
            home.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button className="w-full sm:w-auto bg-naija-magenta hover:bg-naija-yellow text-white hover:text-naija-dark font-heading text-xl py-5 px-10 rounded-full transition-all duration-300 transform hover:-translate-y-2 border-4 border-naija-dark box-shadow-bold hover:box-shadow-bold-hover" onClick={() => router.push('/get-started')}>
              Start Your Glow-Up
            </button>
            <p className="text-white/80 font-medium text-lg">
              Free to start. No credit card needed.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
