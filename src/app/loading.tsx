import { BiBot } from 'react-icons/bi';

function Loading() {
  return (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-orange-500 flex items-center justify-center">
                <BiBot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
  )
}

export default Loading