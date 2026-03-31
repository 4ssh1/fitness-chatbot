'use client'

import React, { useState } from 'react'
import { BiSend } from 'react-icons/bi'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}
const suggestionChips = [
  'What should I eat after gym?',
  'Give me a workout plan',
  'How many calories in jollof rice?',
  'Bulk meal prep ideas',
]
export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }
  const handleChipClick = (chip: string) => {
    onSendMessage(chip)
  }
  return (
    <div className="border-t-2 border-naija-dark bg-white p-4">
      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestionChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={disabled}
            className="text-sm font-medium px-4 py-2 bg-naija-light text-naija-dark border-2 border-naija-dark rounded-full hover:bg-naija-yellow hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything about fitness, nutrition, workouts..."
          disabled={disabled}
          className="flex-1 px-5 py-3 border-2 border-naija-dark rounded-full font-medium focus:outline-none focus:border-naija-magenta focus:ring-2 focus:ring-naija-magenta/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-naija-magenta hover:bg-naija-purple text-white p-4 rounded-full border-2 border-naija-dark box-shadow-bold hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          aria-label="Send message"
        >
          <BiSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
