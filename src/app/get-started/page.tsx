'use client'

import { motion } from 'framer-motion'
import { FaGoogle, FaFacebookF } from 'react-icons/fa'
import { IoArrowBack } from 'react-icons/io5'
import { IoArrowForward } from 'react-icons/io5'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
    const router = useRouter()
    const handleBack = () => {
        router.push('/')
    }
  return (
    <div className="min-h-screen bg-naija-light flex flex-col justify-center items-center p-4 selection:bg-naija-magenta selection:text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-naija-magenta rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-naija-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <button
        onClick={handleBack}
        className="absolute top-4 left-8 flex items-center gap-2 text-naija-dark hover:text-naija-magenta transition-colors font-bold z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-naija-dark box-shadow-bold hover:-translate-y-0.5"
      >
        <IoArrowBack className="w-5 h-5" />
        Back to Home
        </button>
      <button
        onClick={()=> router.push('/chat')}
        className="absolute top-4 right-8 flex items-center gap-2 text-naija-dark hover:text-naija-magenta transition-colors font-bold z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-naija-dark box-shadow-bold hover:-translate-y-0.5"
      >
        <IoArrowForward className="w-5 h-5" />
        Use AI
        </button>
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border-4 border-naija-dark box-shadow-bold relative z-10 mt-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-naija-purple mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600 font-medium">
            Ready to Gbe Body? Login to continue.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => signIn('google', { callbackUrl: '/chat' })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-naija-dark font-bold py-3 px-6 rounded-full transition-all duration-300 border-2 border-naija-dark box-shadow-bold hover:-translate-y-0.5"
          >
            <FaGoogle className="md:size-5 size-3" />
            Continue with Google
          </button>
          <button
            onClick={() => signIn('facebook', { callbackUrl: '/chat' })}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1865F2] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 border-2 border-naija-dark box-shadow-bold hover:-translate-y-0.5"
          >
            <FaFacebookF className="md:size-5 size-3" />
            Continue with Facebook
          </button>
        </div>
      </motion.div>
    </div>
  )
}
