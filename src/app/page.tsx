import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Feature'
import { MealShowcase } from '@/components/landing/Meal'
import { WorkoutSection } from '@/components/landing/Workout'
import { FinalCTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'

function App() {
  return (
    <div className="min-h-screen bg-naija-light selection:bg-naija-magenta selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <MealShowcase />
        <WorkoutSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default App;
