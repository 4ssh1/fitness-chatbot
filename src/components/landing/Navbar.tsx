'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return (
    <motion.nav
      initial={{
        y: -100,
      }}
      animate={{
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-naija-purple shadow-xl py-4' : 'bg-transparent py-6'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-3xl font-heading text-white tracking-wider">
            GbeBody AI
          </span>
          <Image src="/favicon.png" alt="GbeBody AI favicon" width={28} height={28} className='size-6 md:size-10'/>
        </div>

        <button className="bg-naija-magenta hover:bg-naija-yellow hover:text-naija-dark text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 transform hover:scale-105 box-shadow-bold border-2 border-naija-dark" onClick={()=> router.push('/get-started')}>
          Get Started
        </button>
      </div>
    </motion.nav>
  )
}
