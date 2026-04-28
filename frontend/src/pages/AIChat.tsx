import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'How much have I spent this month?',
  'What are my top expense categories?',
  'Show me my recent transactions',
  'What is my budget status?',
  'How are my invoices looking?',
  'Any overdue invoices?',
  'What can I claim for SARS this year?',
];

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm PocketAI, your financial assistant. Ask me anything about your finances — spending, budgets, invoices, or get SARS tax tips.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    setShowQuick(false);

    // Add user message
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      const res = await axios.post(`${API_URL}/ai/chat`, { message: content, history }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reply = res.data.data?.reply || 'Sorry, I couldn\'t process that.';
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `❌ Error: ${err.response?.data?.error || err.message || 'Failed to get response'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          AI
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">PocketAI Assistant</h2>
          <p className="text-xs text-gray-500">Powered by DeepSeek — Ask anything about your finances</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-200 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-green-600 text-white rounded-br-md'
                : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {showQuick && messages.length <= 1 && (
        <div className="bg-white border-x border-gray-200 px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-700 hover:border-green-300 border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-b-xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Your financial data is queried in real-time. AI responses are generated from your actual transactions.
        </p>
      </form>
    </div>
  );
};

export default AIChat;
