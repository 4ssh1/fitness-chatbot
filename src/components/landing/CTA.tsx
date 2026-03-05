'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function FinalCTA() {
  const ref = useRef(null)
  const router = useRouter()
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  })
  return (
    <section
      className="py-32 bg-linear-to-br from-naija-purple to-naija-magenta clip-diagonal-top relative z-10"
      ref={ref}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  y: 30,
                }
          }
          transition={{
            duration: 0.6,
          }}
          className="text-5xl md:text-7xl font-heading text-white mb-8 text-shadow-bold"
        >
          Your Body Deserves Better
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={
            isInView
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                }
          }
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="text-xl md:text-2xl text-white/90 font-medium mb-6 leading-relaxed"
        >
          No more copying oyinbo diet plans wey no work for us. GbeBody AI
          understands Nigerian food, Nigerian bodies, Nigerian goals.
        </motion.p>

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={
            isInView
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                }
          }
          transition={{
            duration: 0.6,
            delay: 0.3,
          }}
          className="text-2xl md:text-3xl font-heading text-naija-yellow mb-12 transform -rotate-2 inline-block"
        >
          Make we start this journey together! 🎉
        </motion.p>

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  scale: 1,
                }
              : {
                  opacity: 0,
                  scale: 0.9,
                }
          }
          transition={{
            duration: 0.6,
            delay: 0.4,
          }}
          className="flex flex-col items-center"
        >
          <button className="bg-naija-yellow hover:bg-white text-naija-dark font-heading text-2xl py-6 px-12 rounded-full transition-all duration-300 transform hover:scale-105 border-4 border-naija-dark box-shadow-bold hover:box-shadow-bold-hover mb-8 w-full sm:w-auto" onClick={()=> router.push('/get-started')}>
            Join GbeBody AI - It's Free!
          </button>

          <div className="flex items-center gap-3 bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm border border-white/10">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-naija-light border-2 border-naija-purple flex items-center justify-center text-lg"
                >
                  {['👨🏾', '👩🏾', '🧑🏾', '👱🏾'][i - 1]}
                </div>
              ))}
            </div>
            <p className="text-white font-medium">
              Join us
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
