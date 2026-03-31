import './chat.css'
import { Metadata } from 'next'
    
export const metadata: Metadata = {
  title: "GbeBody AI",
  description: "Chat with your personal fitness assistant"
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="chat-root">
      {children}
    </div>
  )
}