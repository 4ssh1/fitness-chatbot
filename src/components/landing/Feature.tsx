'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const features = [
  {
    icon: '🍛',
    title: 'Naija Meal Plans',
    description:
      'Custom meal plans with foods you actually eat. Amala, beans, plantain; we got you.',
    bgColor: 'bg-naija-purple',
    textColor: 'text-white',
  },
  {
    icon: '💪',
    title: 'Workout Guides',
    description:
      'Programs that work whether you dey gym or  house. No wahala.',
    bgColor: 'bg-naija-magenta',
    textColor: 'text-white',
  },
  {
    icon: '🤖',
    title: 'AI Chat Buddy',
    description:
      'Ask anything gym related. We answer am sharp sharp.',
    bgColor: 'bg-naija-yellow',
    textColor: 'text-naija-dark',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description:
      'Watch your body transform. Track weight, meals, and workouts all in one place.',
    bgColor: 'bg-white',
    textColor: 'text-naija-dark',
    border: 'border-4 border-naija-dark',
  },
]
export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  })
  return (
    <section className="py-24 bg-naija-light relative z-0" ref={ref}>
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
            Wetin You Go Get
          </motion.h2>
          <div className="w-24 h-2 bg-naija-magenta mx-auto transform -rotate-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 50,
              }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                    }
                  : {
                      opacity: 0,
                      y: 50,
                    }
              }
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              className={`${feature.bgColor} ${feature.textColor} ${feature.border || ''} rounded-3xl p-8 md:p-10 border-4 border-naija-dark box-shadow-bold transform transition-transform duration-300 hover:-translate-y-2 hover:rotate-1`}
            >
              <div className="text-6xl mb-6 bg-white/20 w-24 h-24 rounded-full flex items-center justify-center border-2 border-current">
                {feature.icon}
              </div>
              <h3 className="text-3xl font-heading mb-4 leading-tight">
                {feature.title}
              </h3>
              <p className="text-lg font-medium opacity-90 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
