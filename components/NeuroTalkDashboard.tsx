"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Utensils,
  Bath,
  Sun,
  ActivitySquare,
  Gamepad2,
  Brain,
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  PhoneCall,
  Mic,
  ShieldAlert,
  Smartphone,
  Radio,
  Eye
} from "lucide-react";
import DinoGame from "./DinoGame";
import GameEngine, { GameType } from "./GameEngine";
import ElectrodeGuide from "./ElectrodeGuide";

type LanguageCode = "en-IN" | "hi-IN" | "bn-IN" | "ta-IN" | "te-IN" | "mr-IN" | "gu-IN" | "kn-IN" | "ml-IN" | "pa-IN" | "ur-IN";

type Message = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge: string;
  isEmergency?: boolean;
  speech: Partial<Record<LanguageCode, string>>;
  action?: string;
};

type SerialPortLike = {
  open: (options: { baudRate: number }) => Promise<void>;
  writable: WritableStream<Uint8Array>;
};

type NavigatorWithSerial = Navigator & {
  serial?: {
    requestPort: () => Promise<SerialPortLike>;
  };
};

const AUTO_SELECT_MS = 2000;
const RELAY_COMMAND = "RELAY_ON\n";

const careMessages: Message[] = [
  { label: "Hello", description: "Greetings", icon: Mic, badge: "Social", speech: { "en-IN": "Hello.", "hi-IN": "नमस्ते", "bn-IN": "নমস্কার", "mr-IN": "नमस्कार", "ta-IN": "வணக்கம்" } },
  { label: "Water", description: "Need drinking water", icon: Droplets, badge: "Hydration", speech: { "en-IN": "I need water.", "hi-IN": "मुझे पानी चाहिए।", "bn-IN": "আমার জল দরকার।", "mr-IN": "मला पाणी हवे आहे.", "ta-IN": "எனக்கு தண்ணீர் வேண்டும்." } },
  { label: "Food", description: "Requesting food", icon: Utensils, badge: "Nutrition", speech: { "en-IN": "I am hungry.", "hi-IN": "मुझे भूख लगी है।", "bn-IN": "আমার খিদে পেয়েছে।", "mr-IN": "मला भूक लागली आहे.", "ta-IN": "எனக்கு பசிக்கிறது." } },
  { label: "Toilet", description: "Need restroom assist", icon: Bath, badge: "Hygiene", speech: { "en-IN": "I want to go to the toilet.", "hi-IN": "मुझे शौचालय जाना है।", "bn-IN": "আমি টয়লেটে যেতে চাই।", "mr-IN": "मला वॉशरूमला जायचे आहे.", "ta-IN": "நான் கழிப்பறை செல்ல வேண்டும்." } },
  { label: "Unwell", description: "Please check me", icon: HeartPulse, badge: "Medical", isEmergency: true, speech: { "en-IN": "I am feeling unwell.", "hi-IN": "मेरी तबीयत ठीक नहीं है।", "bn-IN": "আমার শরীর ভালো নেই।", "mr-IN": "माझी तब्येत ठीक नाही.", "ta-IN": "எனக்கு உடல்நிலை சரியில்லை." } },
  { label: "Play Game", description: "Start Dino game", icon: Gamepad2, badge: "Entertainment", action: "game:dino", speech: { "en-IN": "I want to play a game.", "hi-IN": "मैं गेम खेलना चाहता हूँ।", "bn-IN": "আমি গেম খেলতে চাই।", "mr-IN": "मला गेम खेळायचा आहे.", "ta-IN": "நான் கேம் விளையாட வேண்டும்." } },
  { label: "Headache", description: "Head pain", icon: Brain, badge: "Pain Alert", isEmergency: true, speech: { "en-IN": "I am having a headache.", "hi-IN": "मेरे सिर में दर्द है।", "bn-IN": "আমার মাথা ব্যথা করছে।", "mr-IN": "माझे डोकं दुखत आहे.", "ta-IN": "எனக்கு தலைவலி உள்ளது." } },
  { label: "Stomach Pain", description: "Abdominal pain", icon: ActivitySquare, badge: "Pain Alert", isEmergency: true, speech: { "en-IN": "I am having stomach pain.", "hi-IN": "मेरे पेट में दर्द है।", "bn-IN": "আমার পেট ব্যথা করছে।", "mr-IN": "माझ्या पोटात दुखत आहे.", "ta-IN": "எனக்கு வயிற்று வலி உள்ளது." } },
  { label: "Spinal Pain", description: "Back pain", icon: Activity, badge: "Pain Alert", isEmergency: true, speech: { "en-IN": "I am having back pain.", "hi-IN": "मेरी पीठ में दर्द है।", "bn-IN": "আমার পিঠে ব্যথা করছে।", "mr-IN": "माझी पाठ दुखत आहे.", "ta-IN": "எனக்கு முதுகு வலி உள்ளது." } },
  { label: "Body Pain", description: "Pain in body", icon: Stethoscope, badge: "Pain Alert", isEmergency: true, speech: { "en-IN": "I am having body pain.", "hi-IN": "मेरे शरीर में दर्द है।", "bn-IN": "আমার শরীরে ব্যথা করছে।", "mr-IN": "माझे अंग दुखत आहे.", "ta-IN": "எனக்கு உடல் வலி உள்ளது." } },
  { label: "Medicine", description: "Medicine time", icon: Pill, badge: "Medication", speech: { "en-IN": "It is my medicine time.", "hi-IN": "यह मेरी दवा का समय है।", "bn-IN": "আমার ওষুধ খাওয়ার সময় হয়েছে।", "mr-IN": "माझी औषध घेण्याची वेळ झाली आहे.", "ta-IN": "இது என் மருந்து நேரம்." } },
  { label: "Call Caregiver", description: "Relay call", icon: PhoneCall, badge: "Emergency", isEmergency: true, action: "relay", speech: { "en-IN": "Please call the caregiver.", "hi-IN": "कृपया देखभाल करने वाले को बुलाएं।", "bn-IN": "দয়া করে সাহায্যকারীকে ডাকুন।", "mr-IN": "कृपया काळजीवाहूला बोलवा.", "ta-IN": "தயவுசெய்து உதவியாளரை அழைக்கவும்." } }
];

const talkMessages: Message[] = [
  { label: "Hello", description: "Greetings", icon: Mic, badge: "Social", speech: { "en-IN": "Hello.", "hi-IN": "नमस्ते", "bn-IN": "নমস্কার", "mr-IN": "नमस्कार", "ta-IN": "வணக்கம்" } },
  { label: "How are you?", description: "Friendly greeting", icon: Activity, badge: "Social", speech: { "en-IN": "How are you doing today?", "hi-IN": "आप आज कैसे हैं?", "bn-IN": "আপনি আজ কেমন আছেন?", "mr-IN": "तुम्ही आज कसे आहात?", "ta-IN": "நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?" } },
  { label: "What are you doing?", description: "Ask about them", icon: Radio, badge: "Social", speech: { "en-IN": "What are you doing?", "hi-IN": "आप क्या कर रहे हैं?", "bn-IN": "আপনি কি করছেন?", "mr-IN": "तुम्ही काय करत आहात?", "ta-IN": "நீங்கள் என்ன செய்கிறீர்கள்?" } },
  { label: "Happy to see you", description: "Share affection", icon: HeartPulse, badge: "Emotion", speech: { "en-IN": "I am very happy to see you.", "hi-IN": "मुझे आपको देखकर बहुत खुशी हुई।", "bn-IN": "আমি আপনাকে দেখে খুব আনন্দিত।", "mr-IN": "मला तुम्हाला पाहून खूप आनंद झाला.", "ta-IN": "உங்களை பார்த்ததில் மிகவும் மகிழ்ச்சி." } },
  { label: "Sit with me", description: "Request company", icon: Stethoscope, badge: "Social", speech: { "en-IN": "Please sit with me for some time.", "hi-IN": "कृपया कुछ देर मेरे साथ बैठें।", "bn-IN": "দয়া করে কিছুক্ষণ আমার সাথে বসুন।", "mr-IN": "कृपया थोडा वेळ माझ्यासोबत बसा.", "ta-IN": "தயவுசெய்து என்னுடன் சிறிது நேரம் உட்காரவும்." } },
  { label: "Yes", description: "Affirmative", icon: Mic, badge: "Response", speech: { "en-IN": "Yes.", "hi-IN": "हाँ।", "bn-IN": "হ্যাঁ।", "mr-IN": "होय.", "ta-IN": "ஆம்." } },
  { label: "No", description: "Negative", icon: Mic, badge: "Response", speech: { "en-IN": "No.", "hi-IN": "नहीं।", "bn-IN": "না।", "mr-IN": "नाही.", "ta-IN": "இல்லை." } },
  { label: "Thank you", description: "Express gratitude", icon: ActivitySquare, badge: "Polite", speech: { "en-IN": "Thank you very much.", "hi-IN": "आपका बहुत-बहुत धन्यवाद।", "bn-IN": "আপনাকে অনেক ধন্যবাদ।", "mr-IN": "खूप खूप धन्यवाद.", "ta-IN": "மிக்க நன்றி." } },
  { label: "I love you", description: "Express love", icon: HeartPulse, badge: "Emotion", speech: { "en-IN": "I love you.", "hi-IN": "मैं तुमसे प्यार करता हूँ।", "bn-IN": "আমি তোমাকে ভালোবাসি।", "mr-IN": "माझे तुझ्यावर प्रेम आहे.", "ta-IN": "நான் உன்னை காதலிக்கிறேன்." } },
  { label: "I'm tired", description: "Express fatigue", icon: Brain, badge: "Status", speech: { "en-IN": "I am feeling tired.", "hi-IN": "मैं थका हुआ महसूस कर रहा हूँ।", "bn-IN": "আমি ক্লান্ত বোধ করছি।", "mr-IN": "मला थकल्यासारखे वाटत आहे.", "ta-IN": "நான் சோர்வாக உணர்கிறேன்." } },
  { label: "Maybe", description: "Uncertain", icon: Mic, badge: "Response", speech: { "en-IN": "Maybe.", "hi-IN": "शायद।", "bn-IN": "হয়তো।", "mr-IN": "कदाचित.", "ta-IN": "ஒருவேளை." } },
  { label: "I don't know", description: "Uncertain", icon: Mic, badge: "Response", speech: { "en-IN": "I don't know.", "hi-IN": "मुझे नहीं पता।", "bn-IN": "আমি জানি না।", "mr-IN": "मला माहित नाही.", "ta-IN": "எனக்குத் தெரியாது." } },
  { label: "Please wait", description: "Ask to wait", icon: Mic, badge: "Request", speech: { "en-IN": "Please wait a moment.", "hi-IN": "कृपया एक पल प्रतीक्षा करें।", "bn-IN": "দয়া করে একটু অপেক্ষা করুন।", "mr-IN": "कृपया थोडा वेळ थांबा.", "ta-IN": "தயவுசெய்து காத்திருக்கவும்." } },
  { label: "Tell me a story", description: "Request story", icon: Mic, badge: "Social", speech: { "en-IN": "Can you tell me a story?", "hi-IN": "क्या आप मुझे एक कहानी सुना सकते हैं?", "bn-IN": "আপনি কি আমাকে একটি গল্প বলতে পারেন?", "mr-IN": "तुम्ही मला एक गोष्ट सांगू शकता का?", "ta-IN": "எனக்கு ஒரு கதை சொல்ல முடியுமா?" } },
  { label: "Good night", description: "Say good night", icon: Sun, badge: "Social", speech: { "en-IN": "Good night. Sleep well.", "hi-IN": "शुभ रात्रि। अच्छे से सोएं।", "bn-IN": "শুভ রাত্রি। ভালো করে ঘুমান।", "mr-IN": "शुभ रात्री. शांत झोपा.", "ta-IN": "இனிய இரவு. நன்றாக தூங்குங்கள்." } }
];

const gameMessages: Message[] = [
  { label: "Dino Run", description: "Classic Dino game", icon: Gamepad2, badge: "Game", action: "game:dino", speech: { "en-IN": "I want to play Dino run." } },
  { label: "Flappy Bird", description: "Flappy Bird clone", icon: Gamepad2, badge: "Game", action: "game:flappy", speech: { "en-IN": "I want to play Flappy Bird." } },
  { label: "Geometry Jump", description: "Jumping game", icon: Gamepad2, badge: "Game", action: "game:jump", speech: { "en-IN": "I want to play Geometry Jump." } },
  { label: "Space Shooter", description: "Shooter game", icon: Gamepad2, badge: "Game", action: "game:shooter", speech: { "en-IN": "I want to play Space Shooter." } },
  { label: "Basketball", description: "Timing game", icon: Gamepad2, badge: "Game", action: "game:basket", speech: { "en-IN": "I want to play Basketball." } },
  { label: "Rocket Landing", description: "Landing game", icon: Gamepad2, badge: "Game", action: "game:rocket", speech: { "en-IN": "I want to play Rocket Landing." } },
  { label: "Cyber Tunnel", description: "Tunnel runner", icon: Gamepad2, badge: "Game", action: "game:tunnel", speech: { "en-IN": "I want to play Cyber Tunnel." } },
  { label: "Aim Challenge", description: "Timing game", icon: Gamepad2, badge: "Game", action: "game:aim", speech: { "en-IN": "I want to play Aim Challenge." } }
];

const EogWaveform = () => {
  return (
    <div className="relative h-12 w-full overflow-hidden opacity-80 mt-2">
      <motion.svg
        viewBox="0 0 500 50"
        className="absolute inset-0 h-full w-[200%]"
        initial={{ x: 0 }}
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,25 C20,25 30,10 40,25 C50,40 60,25 70,25 C80,25 90,5 100,25 C110,45 120,25 130,25 C140,25 150,15 160,25 C170,35 180,25 190,25 C200,25 210,5 220,25 C230,45 240,25 250,25 C270,25 280,10 290,25 C300,40 310,25 320,25 C330,25 340,5 350,25 C360,45 370,25 380,25 C390,25 400,15 410,25 C420,35 430,25 440,25 C450,25 460,5 470,25 C480,45 490,25 500,25"
          fill="none"
          stroke="url(#wave-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};

export default function NeuroTalkDashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"care" | "talk" | "games">("care");
  const [status, setStatus] = useState("Standby");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [arduinoState, setArduinoState] = useState("Not Connected");
  const [relayState, setRelayState] = useState("Relay Disconnected");
  const [progress, setProgress] = useState(0);
  const [activeGame, setActiveGame] = useState<GameType | "dino" | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en-IN");

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const appRef = useRef<HTMLElement | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const board = mode === "care" ? careMessages : mode === "talk" ? talkMessages : gameMessages;
  const activeMessage = board[activeIndex];

  const speak = useCallback((message: Message) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = message.speech[language] || message.speech["en-IN"];
      const utterance = new SpeechSynthesisUtterance(textToSpeak as string);
      utterance.lang = language;
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find an exact lang match
      let selectedVoice = voices.find(v => v.lang === language || v.lang.replace('_', '-') === language);
      
      // Fallback: Try to find by name (specifically for Chrome's Google cloud voices)
      if (!selectedVoice) {
        const langPrefix = language.split('-')[0];
        selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
      }
      if (!selectedVoice && language === "bn-IN") {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("bengali") || v.name.includes("বাংলা"));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const activateMessage = useCallback(
    async (index: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setProgress(100);
      const message = board[index];
      setActiveIndex(index);
      setSpeakingIndex(index);
      setStatus("Speaking");
      
      speak(message);
      
      window.setTimeout(() => {
        setSpeakingIndex(null);
        setProgress(0);
        if (message.action && message.action.startsWith("game:")) {
          setActiveGame(message.action.split(":")[1] as GameType | "dino");
        }
      }, 1500);

      if (message.action === "relay" && writerRef.current) {
        await writerRef.current.write(new TextEncoder().encode(RELAY_COMMAND));
      }
    },
    [board, speak]
  );

  const scheduleSelect = useCallback(
    (index: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      
      setProgress(0);
      let startTime = Date.now();
      
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min((elapsed / AUTO_SELECT_MS) * 100, 100);
        setProgress(p);
      }, 50);

      timerRef.current = window.setTimeout(() => activateMessage(index), AUTO_SELECT_MS);
    },
    [activateMessage]
  );

  const moveNext = useCallback(() => {
    setActiveIndex((current) => {
      const next = (current + 1) % board.length;
      setStatus("Blink detected");
      scheduleSelect(next);
      return next;
    });
  }, [board.length, scheduleSelect]);

  const connectEOGArduino = async () => {
    const serialNavigator = navigator as NavigatorWithSerial;
    if (!serialNavigator.serial) {
      setArduinoState("Unsupported");
      return;
    }
    try {
      const port = await serialNavigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setArduinoState("EOG Arduino Ready");
      setStatus("Listening for Blinks...");
      
      const reader = port.readable.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              if (line.trim().toUpperCase() === "BLINK") {
                moveNext();
              }
            }
          }
        } catch (e) {
          console.error("Serial error:", e);
          setArduinoState("Not Connected");
        }
      })();
    } catch {
      setArduinoState("Connection Failed");
    }
  };

  const connectRelay = async () => {
    const serialNavigator = navigator as NavigatorWithSerial;
    if (!serialNavigator.serial) {
      setRelayState("Unsupported");
      return;
    }
    try {
      const port = await serialNavigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      writerRef.current = port.writable.getWriter();
      setRelayState("Relay Connected");
    } catch {
      setRelayState("Relay Failed");
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || activeGame !== null) return;
      event.preventDefault();
      moveNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [moveNext, activeGame]);

  return (
    <main 
      ref={appRef} 
      tabIndex={-1} 
      className="fixed inset-0 w-full h-screen text-slate-800 overflow-hidden font-sans outline-none"
      style={{ background: "linear-gradient(135deg, #F8FBFF 0%, #EEF5FF 50%, #F5FAFF 100%)" }}
    >
      <div className="mx-auto flex h-full w-full flex-col gap-4 px-6 lg:px-12 py-6">
        
        {/* Premium Header Segment */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between shrink-0 mb-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-1.5">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/90 p-3 rounded-[20px] shadow-[0_8px_30px_rgba(15,76,129,0.12)] border border-white backdrop-blur-md"
              >
                <Stethoscope className="text-blue-600 h-8 w-8" />
              </motion.div>
              <motion.h1 
                className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#0F4C81] via-[#3B82F6] to-[#00C2FF] drop-shadow-sm"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                ParaTalk
              </motion.h1>
            </div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 ml-[72px]">
              EOG Based System
            </h2>
          </div>

          {/* Premium Apple-style Segmented Controls & Language Selector */}
          <div className="flex flex-wrap items-center gap-5 z-20">
            
            {/* Language Dropdown */}
            <div className="flex p-1.5 rounded-[20px] bg-white/80 shadow-[0_8px_30px_rgba(15,76,129,0.08)] border border-white backdrop-blur-2xl">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="px-4 py-2 bg-transparent text-[15px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="bn-IN">Bengali (বাংলা)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
              </select>
            </div>

            <ElectrodeGuide />

            <div className="flex p-1.5 rounded-[20px] bg-white/80 shadow-[0_8px_30px_rgba(15,76,129,0.08)] border border-white backdrop-blur-2xl">
              <button 
                onClick={() => { setMode("care"); setActiveIndex(0); setProgress(0); }}
                className={`relative px-6 py-3 text-[15px] font-bold rounded-2xl transition-colors z-10 ${mode === "care" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                {mode === "care" && <motion.div layoutId="modeTab" className="absolute inset-0 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 z-[-1]" />}
                Care Mode
              </button>
              <button 
                onClick={() => { setMode("talk"); setActiveIndex(0); setProgress(0); }}
                className={`relative px-6 py-3 text-[15px] font-bold rounded-2xl transition-colors z-10 ${mode === "talk" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                {mode === "talk" && <motion.div layoutId="modeTab" className="absolute inset-0 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 z-[-1]" />}
                Normal Talk
              </button>
              <button 
                onClick={() => { setMode("games"); setActiveIndex(0); setProgress(0); }}
                className={`relative px-6 py-3 text-[15px] font-bold rounded-2xl transition-colors z-10 ${mode === "games" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                {mode === "games" && <motion.div layoutId="modeTab" className="absolute inset-0 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 z-[-1]" />}
                Games
              </button>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-[20px] bg-white/80 shadow-[0_8px_30px_rgba(15,76,129,0.08)] border border-white backdrop-blur-2xl">
              <button 
                onClick={connectEOGArduino}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[14px] font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <Eye className={`h-5 w-5 ${arduinoState === 'EOG Arduino Ready' ? 'text-emerald-500 drop-shadow-md' : 'text-slate-400'}`} />
                {arduinoState === 'EOG Arduino Ready' ? 'EOG Arduino Ready' : 'Connect EOG Arduino'}
              </button>
              <div className="w-[2px] h-6 bg-slate-200/60 mx-1 rounded-full" />
              <button 
                onClick={connectRelay}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[14px] font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <Smartphone className={`h-5 w-5 ${relayState === 'Relay Connected' ? 'text-blue-500 drop-shadow-md' : 'text-slate-400'}`} />
                {relayState === 'Relay Connected' ? 'Relay Connected' : 'Connect Relay'}
              </button>
              <div className="w-[2px] h-6 bg-slate-200/60 mx-1 rounded-full" />
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[14px] font-bold text-slate-600 bg-white/50">
                <Mic className="h-5 w-5 text-blue-500 drop-shadow-md" />
                Voice Active
              </div>
            </div>
          </div>
        </header>

        {/* Premium Hero Card */}
        <section className="relative w-full rounded-[32px] p-[2px] overflow-hidden shrink-0">
          {/* Animated Gradient Border Layer */}
          <motion.div 
            className="absolute inset-0 z-0 bg-gradient-to-r from-[#0F4C81] via-[#00C2FF] to-[#4ADE80]"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          />
          
          {/* Inner Glass Card */}
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 rounded-[30px] p-5 md:p-6 md:px-8"
               style={{ 
                 background: "rgba(15, 76, 129, 0.85)", 
                 backdropFilter: "blur(40px)",
                 boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)"
               }}>
            
            {/* Floating Avatar */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative shrink-0 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/20 shadow-[0_0_40px_rgba(0,194,255,0.3)]"
            >
              <div className="text-5xl">🙂</div>
              <div className="absolute -bottom-3 bg-[#4ADE80] text-[#064E3B] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-[#4ADE80]/50">
                Ready
              </div>
            </motion.div>

            {/* Selection Text */}
            <div className="flex-1 text-white">
              <p className="text-sm font-semibold text-white/60 uppercase tracking-[0.2em] mb-2">Current Selection</p>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-md">
                {activeMessage.label}
              </h2>
            </div>

            {/* Live Status */}
            <div className="flex flex-col items-end w-full md:w-auto">
              <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-sm font-bold text-white/90">Confidence: 98%</span>
              </div>
              <p className="text-xs font-medium text-white/50 mt-2 mr-2">{status}</p>
              <EogWaveform />
            </div>
          </div>
        </section>

        {/* Connect Relay Button (Utility) - Hidden as it's now in the header */}

        {/* Communication Grid */}
        <section 
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 flex-1 min-h-0 pb-2"
          style={{ gridTemplateRows: `repeat(${Math.ceil(board.length / 4)}, minmax(0, 1fr))` }}
        >
          {board.map((message, index) => {
            const isActive = index === activeIndex;
            const isSpeaking = index === speakingIndex;
            const Icon = message.icon;
            
            // Determine styling based on emergency status
            const defaultBg = message.isEmergency 
              ? "linear-gradient(135deg, rgba(255,245,245,0.85), rgba(255,232,232,0.85))"
              : "rgba(255,255,255,0.85)";
            
            const borderColor = message.isEmergency ? "rgba(255,180,180,0.6)" : "rgba(255,255,255,0.8)";
            const textAccent = message.isEmergency ? "text-red-600" : "text-blue-600";
            const badgeBg = message.isEmergency ? "bg-red-100/90 text-red-700 border-red-200" : "bg-blue-100/90 text-blue-800 border-blue-300";

            return (
              <motion.button
                key={message.label}
                type="button"
                whileHover={{ 
                  y: -6, 
                  scale: 1.02,
                  boxShadow: message.isEmergency 
                    ? "0 20px 40px rgba(220,38,38,0.15), 0 0 45px rgba(220,38,38,0.3)" 
                    : "0 20px 40px rgba(59,130,246,0.15), 0 0 45px rgba(59,130,246,0.3)",
                  transition: { duration: 0.3, ease: "easeOut" } 
                }}
                onClick={() => activateMessage(index)}
                className="relative flex flex-col justify-between p-3 lg:p-4 text-left outline-none h-full overflow-hidden shrink-0"
                style={{ 
                  background: defaultBg,
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "28px",
                  boxShadow: isActive 
                    ? "0 0 0 2px #3B82F6, 0 0 40px rgba(59,130,246,0.35)"
                    : "0 10px 40px rgba(15,76,129,0.06)",
                }}
              >
                {/* Active Pulse Animation Layer */}
                {isActive && (
                  <motion.div 
                    className="absolute inset-0 rounded-[28px] border-[3px] border-blue-500"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}

                {/* Top Section */}
                <div className="flex items-start justify-between w-full relative z-10">
                  <motion.div 
                    animate={isActive ? { scale: 1.15, color: "#3B82F6" } : { scale: 1 }}
                    className={`p-3 rounded-[16px] bg-white shadow-md border border-white/60 ${textAccent}`}
                  >
                    <Icon strokeWidth={2.5} className="h-7 w-7 lg:h-8 lg:w-8" />
                  </motion.div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeBg}`}>
                    {message.badge}
                  </span>
                </div>

                <div className="mt-2 relative z-10 w-full shrink-0">
                  <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {message.label}
                  </h3>
                  <p className="text-[11px] lg:text-xs font-medium text-slate-500 mt-0.5 truncate">
                    {message.description}
                  </p>
                </div>

                {/* Progress / Countdown Indicator */}
                {isActive && (
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Speaking in</p>
                      <p className="text-xs font-black text-slate-900">{((AUTO_SELECT_MS - (progress/100 * AUTO_SELECT_MS)) / 1000).toFixed(1)}s</p>
                    </div>
                    <div className="relative h-8 w-8">
                      <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                        <circle cx="18" cy="18" r="15" stroke="rgba(59,130,246,0.15)" strokeWidth="4" fill="none" />
                        <circle cx="18" cy="18" r="15" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="94" strokeDashoffset={94 - (94 * progress) / 100} />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Speaking Ripple */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 bg-blue-400/20 rounded-[28px] pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </section>

      </div>

      <AnimatePresence>
        {activeGame === "dino" && <DinoGame onClose={() => setActiveGame(null)} />}
        {activeGame && activeGame !== "dino" && (
          <GameEngine game={activeGame as GameType} onClose={() => setActiveGame(null)} />
        )}
      </AnimatePresence>

      {/* Debuggers Squad Branding */}
      <div className="absolute bottom-4 right-6 flex items-center gap-3 z-40 opacity-80 hover:opacity-100 transition-opacity">
        <span className="text-sm font-bold text-slate-500 tracking-wide">Made by</span>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/50">
          <svg viewBox="0 0 100 100" className="h-6 w-6 drop-shadow-md">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="100%" stopColor="#0057FF" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF007A" />
                <stop offset="100%" stopColor="#7000FF" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB800" />
                <stop offset="100%" stopColor="#FF003D" />
              </linearGradient>
            </defs>
            <path d="M 40 20 L 10 50 L 40 80" fill="none" stroke="url(#grad1)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 60 15 L 40 85" fill="none" stroke="url(#grad2)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 65 20 L 95 50 L 65 80" fill="none" stroke="url(#grad3)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#FF007A] to-[#7000FF]">
            Debuggers Squad
          </span>
        </div>
      </div>
    </main>
  );
}
