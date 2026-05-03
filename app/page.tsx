'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit2, Check } from 'lucide-react';

export default function Home() {
  const [initialTime, setInitialTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  
  const [teamA, setTeamA] = useState({ name: 'TIME A', score: 0, isEditing: false });
  const [teamB, setTeamB] = useState({ name: 'TIME B', score: 0, isEditing: false });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playAlarm = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      const duration = 2;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
      
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.5);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 2.0);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio context error:', e);
    }
  };

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          if (err.name !== 'NotAllowedError') {
            console.error(`${err.name}, ${err.message}`);
          }
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && (isRunning || isWakeLockActive)) {
        await requestWakeLock();
      }
    };

    if (isRunning || isWakeLockActive) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isRunning, isWakeLockActive]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setTimeLeft(initialTime);
    setIsRunning(true);
  };

  const setDuration = (seconds: number) => {
    setIsRunning(false);
    setInitialTime(seconds);
    setTimeLeft(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      setTeamA((prev) => ({ ...prev, score: Math.max(0, prev.score + delta) }));
    } else {
      setTeamB((prev) => ({ ...prev, score: Math.max(0, prev.score + delta) }));
    }
  };

  const toggleEdit = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamA((prev) => ({ ...prev, isEditing: !prev.isEditing }));
    } else {
      setTeamB((prev) => ({ ...prev, isEditing: !prev.isEditing }));
    }
  };

  const handleNameChange = (team: 'A' | 'B', name: string) => {
    if (team === 'A') {
      setTeamA((prev) => ({ ...prev, name }));
    } else {
      setTeamB((prev) => ({ ...prev, name }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden border-8 border-sky-500/30">
      {/* Header Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-sky-900/50 bg-slate-950 z-20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-60">Mordendo a Língua</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsWakeLockActive(!isWakeLockActive)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all text-xs md:text-sm font-bold uppercase tracking-wider ${
              isWakeLockActive 
              ? 'bg-sky-500/20 border-sky-500 text-sky-400' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isWakeLockActive ? 'bg-sky-500 animate-pulse' : 'bg-slate-700'}`} />
            Manter tela acesa
          </button>
        </div>
      </nav>

      {/* Main Control Area */}
      <div className="flex-1 flex flex-col z-10">
        
        {/* Timer Block - Geometric Center */}
        <div className="flex flex-col items-center justify-center py-6 md:py-12 px-4">
          <div className="text-slate-500 text-[10px] tracking-[0.4em] uppercase mb-1">controlador de tempo</div>
          
          {/* Duration Selectors */}
          <div className="flex gap-2 mb-4">
            {[60, 120, 180, 300].map((sec) => (
              <button
                key={sec}
                onClick={() => setDuration(sec)}
                className={`px-3 py-1 text-[10px] font-bold border rounded-sm transition-all ${
                  initialTime === sec 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                  : 'border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {sec / 60}:00
              </button>
            ))}
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-7xl md:text-[140px] font-mono font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-colors duration-500 ${timeLeft === 0 ? 'text-rose-500' : 'text-emerald-400'}`}
          >
            {formatTime(timeLeft)}
          </motion.div>
          
          {/* Timer Controls */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button 
              onClick={toggleTimer}
              className={`px-8 py-3 font-bold rounded-sm flex items-center gap-2 transition-all active:scale-95 ${
                isRunning 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              {isRunning ? 'PAUSAR' : 'INICIAR'}
            </button>
            
            <button 
              onClick={resetTimer}
              className="px-8 py-3 border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold rounded-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              RESETAR
            </button>
          </div>
        </div>

      {/* Scoreboard Grid */}
      <div className="grid grid-cols-2 flex-1 border-t border-sky-900/50">
        <AnimatePresence>
          {timeLeft === 0 && !isRunning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-rose-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <motion.h2 
                initial={{ y: 20, scale: 0.8 }}
                animate={{ y: 0, scale: 1 }}
                className="text-4xl md:text-6xl font-black text-rose-100 mb-4 tracking-tighter"
              >
                O TEMPO ACABOU!
              </motion.h2>
              <button 
                onClick={resetTimer}
                className="px-10 py-4 bg-rose-500 hover:bg-rose-400 text-rose-950 font-black rounded-sm transition-all active:scale-95 shadow-xl shadow-rose-500/20"
              >
                REINICIAR PARTIDA
              </button>
            </motion.div>
          )}
        </AnimatePresence>
          {/* Team A */}
          <TeamPanel 
            team={teamA} 
            side="left"
            isLast={false}
            onUpdateScore={(d: number) => updateScore('A', d)} 
            onNameChange={(n: string) => handleNameChange('A', n)}
          />

          {/* Team B */}
          <TeamPanel 
            team={teamB} 
            side="right"
            isLast={true}
            onUpdateScore={(d: number) => updateScore('B', d)} 
            onNameChange={(n: string) => handleNameChange('B', n)}
          />
        </div>
      </div>

      {/* Footer Details */}
      <footer className="flex justify-between px-6 md:px-12 py-4 bg-slate-900 text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 border-t border-sky-900/50">
        <div>Sessão ativa: {isRunning ? 'EM OPERAÇÃO' : 'INATIVO'}</div>
        <div className="flex gap-4 md:gap-8">
          <span>Regras: Padrão</span>
        </div>
      </footer>
    </main>

  );
}

function TeamPanel({ team, side, isLast, onUpdateScore, onNameChange }: any) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 md:p-12 bg-slate-900/20 ${!isLast ? 'border-r' : ''} border-sky-900/50 relative transition-all duration-500 hover:bg-slate-900/40 group overflow-hidden`}>
      <div className={`absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} w-px h-full bg-emerald-500/10 group-hover:bg-emerald-500/30 transition-colors pointer-events-none`} />
      
      <input 
        type="text" 
        value={team.name} 
        onChange={(e) => onNameChange(e.target.value)}
        className="bg-transparent border-b-2 border-transparent focus:border-emerald-500 text-center text-sm md:text-3xl font-light tracking-widest text-slate-300 uppercase outline-none mb-4 md:mb-6 w-full cursor-pointer hover:bg-slate-800/30 transition-all py-1 md:py-2 rounded-t-sm" 
      />
      
      <motion.div 
        key={team.score}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-6xl md:text-[180px] font-black leading-none text-white tabular-nums tracking-tighter"
      >
        {team.score.toString().padStart(2, '0')}
      </motion.div>
      
      <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 mt-4 md:mt-8 w-full max-w-[120px] md:max-w-none md:flex md:justify-center">
        <button 
          onClick={() => onUpdateScore(1)}
          className="px-2 py-2 md:w-16 md:h-16 rounded-lg md:rounded-full bg-slate-100 flex items-center justify-center text-sm md:text-2xl font-bold hover:bg-white text-slate-950 transition-all active:scale-90 shadow-lg shadow-white/5"
        >
          +1
        </button>
        <button 
          onClick={() => onUpdateScore(2)}
          className="px-2 py-2 md:w-16 md:h-16 rounded-lg md:rounded-full bg-slate-100 flex items-center justify-center text-sm md:text-2xl font-bold hover:bg-white text-slate-950 transition-all active:scale-90 shadow-lg shadow-white/5"
        >
          +2
        </button>
        <button 
          onClick={() => onUpdateScore(3)}
          className="px-2 py-2 md:w-16 md:h-16 rounded-lg md:rounded-full bg-slate-100 flex items-center justify-center text-sm md:text-2xl font-bold hover:bg-white text-slate-950 transition-all active:scale-90 shadow-lg shadow-white/5"
        >
          +3
        </button>
        <button 
          onClick={() => onUpdateScore(4)}
          className="px-2 py-2 md:w-16 md:h-16 rounded-lg md:rounded-full bg-slate-100 flex items-center justify-center text-sm md:text-2xl font-bold hover:bg-white text-slate-950 transition-all active:scale-90 shadow-lg shadow-white/5"
        >
          +4
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => onUpdateScore(-1)}
          className="px-4 py-1 text-[10px] md:text-xs border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded transition-all active:scale-95 uppercase tracking-widest"
        >
          -1
        </button>
        <button 
          onClick={() => onUpdateScore(-4)}
          className="px-4 py-1 text-[10px] md:text-xs border border-rose-900/50 text-rose-500/50 hover:text-rose-400 hover:bg-rose-900/20 rounded transition-all active:scale-95 uppercase tracking-widest"
        >
          -4
        </button>
      </div>
    </div>
  );
}
