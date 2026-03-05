'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const programs = [
  {
    icon: '🔥',
    title: 'Burn & Tone',
    duration: '4 weeks • 5x/week',
    description:
      'High-intensity program to shed fat and build lean muscle. No equipment needed for home version.',
    gradient: 'from-naija-magenta to-naija-purple',
  },
  {
    icon: '🏋️',
    title: 'Strength Builder',
    duration: '8 weeks • 4x/week',
    description:
      'Progressive overload program for serious gains. Gym-based with compound movements.',
    gradient: 'from-naija-purple to-naija-magenta',
  },
  {
    icon: '🏃',
    title: 'Cardio & Core',
    duration: '6 weeks • 3x/week',
    description:
      'Heart-pumping cardio mixed with core strengthening. Perfect for beginners.',
    gradient: 'from-naija-yellow to-naija-magenta',
  },
]
export function WorkoutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  })
  return (
    <section className="py-24 bg-white relative z-0" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    y: 20,
                  }
            }
            transition={{
              duration: 0.6,
            }}
            className="text-5xl md:text-6xl font-heading text-naija-dark mb-6"
          >
            Train Like a Champion
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
            className="text-xl text-gray-600 font-medium max-w-2xl mx-auto"
          >
            Programs designed for real results
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <motion.div
              key={index}
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
                duration: 0.5,
                delay: index * 0.2,
              }}
              className="relative group"
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${program.gradient} rounded-3xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300 border-4 border-naija-dark`}
              ></div>
              <div className="relative bg-white rounded-3xl p-8 border-4 border-naija-dark h-full flex flex-col transform -rotate-1 group-hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl mb-6">{program.icon}</div>
                <h3 className="text-2xl font-heading text-naija-dark mb-2">
                  {program.title}
                </h3>
                <div className="inline-block bg-naija-light px-3 py-1 rounded-full text-sm font-bold text-naija-dark border-2 border-naija-dark mb-6 self-start">
                  {program.duration}
                </div>
                <p className="text-gray-600 font-medium flex-1">
                  {program.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
