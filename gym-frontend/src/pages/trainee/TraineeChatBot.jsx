import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { Send, Loader2, MessageCircle, User, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function TraineeChatBot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your Fitness Assistant 💪 here to help you reach your goals.\n\nI can help you with:\n- **Exercises** and proper form\n- **Nutrition** and diet plans\n- Calculating **calories** and macros\n- Info about **supplements**\n\nAsk me anything about fitness!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scroll = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scroll() }, [messages])

  const send = async e => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const r = await api.post('/chatbot/ask', { message: userMsg })
      setMessages(m => [...m, { role: 'bot', text: r.data.response }])
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, a connection error occurred. Please try again 🙏' }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setMessages([{
    role: 'bot', text: 'Chat cleared! 🔄 Start a new question 💪'
  }])

  const suggestions = [
    'What is the best chest exercise?',
    'How do I calculate calories for weight loss?',
    'What is the difference between cardio and lifting?',
    'What are the best protein supplements?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gym-text flex items-center gap-2">
            <MessageCircle size={28} className="text-gym-primary" />
            Fitness Assistant
          </h1>
          <p className="text-gym-muted text-sm">Your personal fitness guide — specialized in gym & nutrition</p>
        </div>
        <button onClick={reset} className="btn-secondary py-2 px-3 text-sm">
          <RotateCcw size={15} />Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'bot' ? 'bg-gym-primary/20 text-gym-primary' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {msg.role === 'bot' ? <MessageCircle size={18} /> : <User size={18} />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'bot'
                ? 'bg-gym-card border border-gym-border text-gym-text'
                : 'bg-gym-primary text-white rounded-tr-sm'
            }`}>
              {msg.role === 'bot' ? (
                <div className="prose prose-sm prose-invert max-w-none text-gym-text leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gym-primary/20 flex items-center justify-center">
              <MessageCircle size={18} className="text-gym-primary" />
            </div>
            <div className="bg-gym-card border border-gym-border rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-gym-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="text-xs bg-gym-card border border-gym-border rounded-full px-3 py-1.5 text-gym-muted hover:text-gym-primary hover:border-gym-primary/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-3">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about exercises or nutrition..."
          disabled={loading}
        />
        <button type="submit" className="btn-primary px-4" disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
