'use client'

import { useRef } from 'react'
import styles from './Feature.module.css'
import { motion, useInView } from 'framer-motion'

const features = [
  {
    title: 'Naija Meal Plans',
    description:
      'Custom meal plans with foods you actually eat. Amala, beans, plantain; we got you.',
    bgColor: 'bg-naija-purple',
    textColor: 'text-white',
  },
  {
    title: 'Workout Guides',
    description:
      'Programs that work whether you dey gym or  house. No wahala.',
    bgColor: 'bg-naija-magenta',
    textColor: 'text-white',
  },
  {
    title: 'AI Chat Buddy',
    description:
      'Ask anything gym related. We answer am sharp sharp.',
    bgColor: 'bg-naija-yellow',
    textColor: 'text-naija-dark',
  },
  {
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
            className="text-3xl md:text-6xl font-heading text-naija-dark mb-6"
          >
            Wetin You Go Get
          </motion.h2>
          <div className="w-24 h-2 bg-naija-magenta mx-auto transform -rotate-2"></div>
        </div>

        <div className={`${styles.featuresScroll} flex gap-4 lg:gap-12 overflow-x-auto pb-4`}>
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
              className={`${feature.bgColor} ${feature.textColor} ${feature.border || ''} min-w-[300px] md:min-w-[500px] max-w-xs shrink-0 rounded-3xl p-4 md:p-10 border-4 border-naija-dark box-shadow-bold transform transition-transform duration-300 hover:-translate-y-2 hover:rotate-1`}
            >
              <h3 className="text-lg md:text-3xl font-heading mb-4 leading-tight">
                {feature.title}
              </h3>
              <p className="text-sm md:text-lg font-medium opacity-90 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
