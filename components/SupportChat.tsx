
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse, generateSpeech } from '../services/geminiService';
import { Message } from '../types';
import { Send, User, Bot, Sparkles, Volume2, Loader2 } from 'lucide-react';

const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm the WEA AI assistant. How can I help you build your next digital solution today?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodePCM = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handlePlaySpeech = async (text: string, messageId: string) => {
    if (speakingId === messageId) return;

    setSpeakingId(messageId);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodePCM(audioBytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setSpeakingId(null);
        source.start();
      } else {
        setSpeakingId(null);
      }
    } catch (error) {
      console.error("Audio Playback Error:", error);
      setSpeakingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await getChatbotResponse(input);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto h-[700px] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
      <header className="p-6 bg-gray-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold">WEA Inquiry Service</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              AI Agent Online
            </p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-lg h-fit ${m.sender === 'user' ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'}`}>
                {m.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed relative group ${
                m.sender === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-none shadow-md' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
              }`}>
                {m.sender === 'ai' && (
                  <button 
                    onClick={() => handlePlaySpeech(m.text, m.id)}
                    className={`absolute -right-10 top-0 p-2 rounded-full transition-all ${
                      speakingId === m.id ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400 hover:text-blue-600 border border-gray-100'
                    } group-hover:opacity-100 opacity-0 md:opacity-0 transition-opacity`}
                    title="Read Aloud"
                  >
                    {speakingId === m.id ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                  </button>
                )}
                {m.text}
                <div className={`text-[10px] mt-2 opacity-50 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="p-2 rounded-lg h-fit bg-blue-600 text-white animate-pulse">
                <Bot size={18} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your inquiry here..."
            className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-4 uppercase font-bold tracking-widest">
          Powered by WEA-Ops Logic Engine • Tap Volume for TTS
        </p>
      </div>
    </div>
  );
};

export default SupportChat;
