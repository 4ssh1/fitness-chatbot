import { FaGithub } from "react-icons/fa"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-naija-dark text-white py-12 border-t-8 border-naija-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-heading tracking-wider text-naija-yellow">
              GbeBody AI
            </span>
            <Image src="/favicon.png" alt="GbeBody AI favicon" width={28} height={28} className='size-10' />
          </div>

          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-naija-magenta transition-colors">
              About
            </a>
            <a href="#" className="hover:text-naija-magenta transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-naija-magenta transition-colors">
              Terms
            </a>
          </div>
          <div className="flex gap-4 text-2xl">
            <a
              href="#"
              className="hover:scale-110 transition-transform"
              aria-label="GitHub"
            >
              <FaGithub />
            </a>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400 font-medium border-t border-gray-800 pt-8">
          <p>
            © {new Date().getFullYear()} GbeBody AI. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
