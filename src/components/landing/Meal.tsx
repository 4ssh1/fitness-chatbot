'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const meals = [
  {
    icon: '🥩',
    name: 'Lean Suya Wrap',
    calories: '420',
    protein: '35g',
    carbs: '28g',
    fat: '18g',
    description:
      'Spiced beef suya in a whole wheat wrap with fresh vegetables and suya pepper sauce',
    accentColor: 'bg-naija-magenta',
  },
  {
    icon: '🍚',
    name: 'Ofada Rice Power Bowl',
    calories: '550',
    protein: '40g',
    carbs: '55g',
    fat: '15g',
    description:
      'Local ofada rice with grilled chicken, steamed vegetables, and light ofada sauce',
    accentColor: 'bg-naija-yellow',
  },
  {
    icon: '🥞',
    name: 'Plantain Protein Pancakes',
    calories: '380',
    protein: '30g',
    carbs: '42g',
    fat: '10g',
    description:
      'Ripe plantain pancakes with Greek yogurt, honey, and groundnut crumble',
    accentColor: 'bg-naija-purple',
  },
]
export function MealShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  })
  return (
    <section
      className="md:py-32 py-50 bg-naija-purple clip-diagonal-both relative z-10"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
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
            }}
            className="text-5xl md:text-6xl font-heading text-white mb-6 text-shadow-bold"
          >
            Chop Well, Train Well
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
              duration: 0.5,
              delay: 0.2,
            }}
            className="text-lg text-naija-yellow font-medium max-w-2xl mx-auto"
          >
            Sample meals from your AI-powered plan
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {meals.map((meal, index) => (
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
                duration: 0.5,
                delay: index * 0.2,
              }}
              className="bg-white rounded-3xl overflow-hidden border-4 border-naija-dark box-shadow-bold flex flex-col transform transition-transform duration-300 hover:-translate-y-3"
            >
              <div
                className={`h-4 ${meal.accentColor} w-full border-b-4 border-naija-dark`}
              ></div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="text-6xl mb-6 bg-naija-light w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-naija-dark transform -rotate-3">
                  {meal.icon}
                </div>
                <h3 className="text-2xl font-heading text-naija-dark mb-4">
                  {meal.name}
                </h3>
                <p className="text-gray-600 mb-8 flex-1 font-medium">
                  {meal.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-naija-light p-3 rounded-xl border-2 border-naija-dark">
                    <span className="font-bold text-naija-dark">Calories</span>
                    <span className="bg-naija-yellow text-naija-dark px-3 py-1 rounded-full font-bold text-sm border border-naija-dark">
                      {meal.calories} kcal
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-1 bg-naija-purple text-white text-center py-2 rounded-lg font-bold text-sm border-2 border-naija-dark">
                      {meal.protein} P
                    </span>
                    <span className="flex-1 bg-naija-magenta text-white text-center py-2 rounded-lg font-bold text-sm border-2 border-naija-dark">
                      {meal.carbs} C
                    </span>
                    <span className="flex-1 bg-naija-yellow text-naija-dark text-center py-2 rounded-lg font-bold text-sm border-2 border-naija-dark">
                      {meal.fat} F
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
