import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, X, Sparkles, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import { ReviveLogo } from './ReviveLogo';
import { Language, AssistantMessage } from '../../types';
import { getTranslation } from '../../locales';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userDistrict: string;
  onSelectAction?: (action: string, payload?: any) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  userDistrict,
  onSelectAction
}) => {
  const t = getTranslation(language);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize initial greeting when modal opens or language changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let initialGreeting = '';
      if (language === 'ta') {
        initialGreeting = `வணக்கம்! நான் உங்கள் 'ரிவைவ்' மருத்துவ வழிகாட்டி. மருந்துகள், மருத்துவமனை படுக்கைகள், இரத்த வங்கி அல்லது அவசர உதவிகள் குறித்து நீங்கள் என்னிடம் கேட்கலாம்.`;
      } else if (language === 'hi') {
        initialGreeting = `नमस्ते! मैं आपका 'रिवाइव' स्वास्थ्य सहायक हूँ। आप मुझसे दवाओं की उपलब्धता, आईसीयू बेड, ब्लड बैंक या रेफरल के बारे में पूछ सकते हैं।`;
      } else {
        initialGreeting = `Hello! I am REVIVE, your healthcare navigation assistant. You can speak or type to check medicine stock, ICU hospital beds, blood units, or medical referrals.`;
      }

      setMessages([
        {
          id: `msg-init`,
          sender: 'assistant',
          text: initialGreeting,
          language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, isLoading]);

  // Web Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        // Language mappings
        const langMap: Record<Language, string> = {
          en: 'en-IN',
          ta: 'ta-IN',
          hi: 'hi-IN'
        };
        recognition.lang = langMap[language] || 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied. Please allow microphone in browser settings.');
          } else if (event.error === 'no-speech') {
            setSpeechError('No speech detected. Please tap the mic and try again.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [language]);

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your query below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        // Update language before starting
        const langMap: Record<Language, string> = {
          en: 'en-IN',
          ta: 'ta-IN',
          hi: 'hi-IN'
        };
        recognitionRef.current.lang = langMap[language] || 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech start error:', err);
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech playback
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop any active speech

      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<Language, string> = {
        en: 'en-IN',
        ta: 'ta-IN',
        hi: 'hi-IN'
      };
      utterance.lang = langMap[language] || 'en-IN';
      utterance.rate = 0.95; // Clear natural pace for rural comprehension

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language,
          district: userDistrict
        })
      });

      if (!response.ok) throw new Error('Query failed');
      const data = await response.json();

      const assistantMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.reply,
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedData: data.referencedData
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(data.reply);
    } catch (err) {
      const fallbackMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: language === 'ta'
          ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறிய தாமதம். அவசர உதவிக்கு 108 அழைக்கவும்.'
          : language === 'hi'
          ? 'क्षमा करें, जानकारी प्राप्त करने में असमर्थ। आपातकालीन सहायता के लिए 108 डायल करें।'
          : 'Could not connect to the healthcare database. For urgent help, please call 108.',
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl h-[92vh] max-h-[720px] bg-[#FEF7F8]/95 dark:bg-[#0D1921]/95 backdrop-blur-2xl rounded-3xl border border-white/70 dark:border-teal-500/20 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Assistant Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#22819A] to-[#1a667b] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <ReviveLogo size="sm" showTagline={false} isDark={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-title" className="font-bold text-base sm:text-lg">
                  {t.askReviveTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-[#FEF7F8]">
                  {language.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#90C2E7] font-medium line-clamp-1">
                {t.askReviveSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (isSpeaking) window.speechSynthesis?.cancel();
                setTtsEnabled(!ttsEnabled);
              }}
              className={`p-2 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                ttsEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-white/50'
              }`}
              title={ttsEnabled ? 'Mute Voice' : 'Enable Voice Audio'}
              aria-label="Toggle voice output"
            >
              {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch(e){}
                }
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Waveform & Speaking/Listening Indicator Banner */}
        {(isListening || isSpeaking || isLoading) && (
          <div className="py-2.5 px-4 bg-[#90C2E7]/20 border-b border-[#90C2E7]/30 flex items-center justify-center gap-3">
            {/* Animated Audio Waveform */}
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
              <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_200ms] h-5" />
              <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_300ms] h-4" />
              <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_150ms] h-5" />
              <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_250ms] h-2" />
            </div>

            <span className="text-xs font-bold text-[#22819A]">
              {isListening && t.voiceListening}
              {isLoading && t.voiceProcessing}
              {isSpeaking && t.voiceSpeaking}
            </span>
          </div>
        )}

        {/* Speech Error Banner if any */}
        {speechError && (
          <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1">{speechError}</span>
            <button onClick={() => setSpeechError(null)} className="text-amber-900 font-bold px-1.5 py-0.5">✕</button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-[#22819A] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#22819A] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Referenced Data Visual Card if any */}
                  {msg.referencedData?.items && msg.referencedData.items.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                      {msg.referencedData.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between gap-2">
                          <span className="font-bold text-[#22819A] truncate">{item.medicineName || item.name || item.bloodBankName}</span>
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                            {item.stockQuantity ? `${item.stockQuantity} units` : item.distanceKm ? `${item.distanceKm} km` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-teal-100' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && ttsEnabled && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="p-1 hover:text-[#22819A] transition"
                        title="Replay Voice"
                        aria-label="Replay audio"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-[#90C2E7] text-[#22819A] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-2xl bg-[#22819A] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22819A] animate-spin" />
                <span>{t.voiceProcessing}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Quick:</span>
          {t.sampleVoicePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#22819A] hover:text-white text-slate-700 text-xs font-semibold whitespace-nowrap border border-slate-200 shadow-sm transition active:scale-95 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar with Prominent Microphone */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Prominent Rural Voice Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl min-h-[50px] min-w-[50px] flex items-center justify-center transition-all duration-200 shadow-md ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse scale-105 shadow-red-500/30'
                  : 'bg-[#22819A] hover:bg-[#1a667b] text-white'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to REVIVE'}
              aria-label="Voice input button"
            >
              {isListening ? <MicOff className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.typeYourQuestion}
              className="flex-1 bg-slate-100 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[48px]"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 min-h-[50px] min-w-[50px] rounded-2xl bg-[#90C2E7] hover:bg-[#7db4db] disabled:opacity-50 text-[#22819A] font-bold flex items-center justify-center shadow transition active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Accessibility Safety Subtext */}
          <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
            {t.safetyWarning}
          </p>
        </div>
      </div>
    </div>
  );
};
