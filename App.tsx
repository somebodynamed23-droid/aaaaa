
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Play, Pause, RotateCcw, Wind, Zap, FlaskConical } from 'lucide-react';
import { SimParameters, Telemetry, HistoryPoint } from './types';
import { getYieldFactor } from './constants';
import { TowerVisualizer } from './components/TowerVisualizer';

const INITIAL_PARAMS: SimParameters = {
  boxVolume: 0.15, // 150 Liters
  fanFlowRate: 20, // 20 L/min
  captureEfficiency: 0.85, // 85% efficiency
  initialPPM: 420,
  tempCelsius: 22,
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimParameters>(INITIAL_PARAMS);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    timeElapsed: 0,
    currentPPM: INITIAL_PARAMS.initialPPM,
    yieldNa2CO3: 0,
    co2Captured: 0,
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTelemetry({
      timeElapsed: 0,
      currentPPM: params.initialPPM,
      yieldNa2CO3: 0,
      co2Captured: 0,
    });
    setHistory([]);
  };

  const runSimulationStep = useCallback(() => {
    setTelemetry(prev => {
      const nextTime = prev.timeElapsed + 1;
      const flowRatePerSecM3 = (params.fanFlowRate / 1000) / 60;
      const fractionProcessed = (params.captureEfficiency * flowRatePerSecM3) / params.boxVolume;
      
      const newPPM = prev.currentPPM * (1 - fractionProcessed);
      const ppmDelta = prev.currentPPM - newPPM;
      
      const yieldFactor = getYieldFactor(params.boxVolume, params.tempCelsius + 273.15);
      const newYield = prev.yieldNa2CO3 + (ppmDelta * yieldFactor);
      
      if (nextTime % 2 === 0 || history.length === 0) {
        setHistory(h => [...h, { 
          time: formatTime(nextTime), 
          ppm: Number(newPPM.toFixed(2)), 
          yield: Number(newYield.toFixed(2)) 
        }].slice(-100));
      }

      return {
        timeElapsed: nextTime,
        currentPPM: newPPM,
        yieldNa2CO3: newYield,
        co2Captured: prev.co2Captured + ppmDelta,
      };
    });
  }, [params, history.length]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(runSimulationStep, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, runSimulationStep]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-sky-400">
            <FlaskConical className="w-8 h-8" />
            DAC Sequestration Rig
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-widest font-semibold">
            Real-Time Carbon Scrubber Simulation
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-8 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg ${
              isActive 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/20' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/20'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isActive ? 'STOP SYSTEM' : 'START SYSTEM'}
          </button>
          <button 
            onClick={handleReset}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors border border-slate-600 text-slate-300"
            title="Reset Simulation"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Dashboard Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 text-center sm:text-left">Live Stopwatch</div>
              <div className="text-4xl font-black mono text-sky-400 tabular-nums text-center sm:text-left">{formatTime(telemetry.timeElapsed)}</div>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl ring-1 ring-emerald-500/10">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 text-center sm:text-left">Current PPM Monitor</div>
              <div className="text-4xl font-black mono text-emerald-400 tabular-nums text-center sm:text-left">{telemetry.currentPPM.toFixed(1)}</div>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 text-center sm:text-left">Na2CO3 Yield (mg)</div>
              <div className="text-4xl font-black mono text-amber-400 tabular-nums text-center sm:text-left">{telemetry.yieldNa2CO3.toFixed(2)}</div>
            </div>
          </div>

          {/* Tower Visualizer */}
          <TowerVisualizer isActive={isActive} ppm={telemetry.currentPPM} />
          
          {/* PPM Levels Monitor */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 h-80 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                <Wind className="w-3 h-3 text-emerald-400" /> PPM Levels Monitor
              </h3>
              <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                ZOOM: {isActive ? 'ACTIVE TRACKING' : 'IDLE'}
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-500/5 to-transparent h-20 bottom-0" />
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                <XAxis dataKey="time" hide />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke="#475569" 
                  fontSize={10} 
                  axisLine={false}
                  tickLine={false}
                  tickCount={6}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#10b981', fontSize: '13px', fontWeight: '800' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ppm" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPpm)" 
                  isAnimationActive={false} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl flex-1">
            <h2 className="text-sm font-black mb-8 flex items-center gap-2 uppercase tracking-widest text-slate-400 border-b border-slate-700/50 pb-4">
              <Zap className="w-4 h-4 text-sky-400" /> Rig Configuration
            </h2>
            
            <div className="space-y-12">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Enclosure Volume</label>
                  <span className="text-sky-400 font-bold text-sm mono">{params.boxVolume.toFixed(2)} m³</span>
                </div>
                <input 
                  type="range" min="0.05" max="0.4" step="0.01" 
                  value={params.boxVolume} 
                  onChange={(e) => setParams(p => ({ ...p, boxVolume: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fan Throughput</label>
                  <span className="text-sky-400 font-bold text-sm mono">{params.fanFlowRate} L/min</span>
                </div>
                <input 
                  type="range" min="5" max="60" step="1" 
                  value={params.fanFlowRate} 
                  onChange={(e) => setParams(p => ({ ...p, fanFlowRate: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Capture Efficiency</label>
                  <span className="text-sky-400 font-bold text-sm mono">{(params.captureEfficiency * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.01" 
                  value={params.captureEfficiency} 
                  onChange={(e) => setParams(p => ({ ...p, captureEfficiency: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                />
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-700/50 text-center">
               <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Chemical Reaction</div>
               <div className="text-sm font-bold mono text-emerald-400 bg-slate-900/40 py-5 px-3 rounded-2xl border border-slate-700/30 shadow-inner">
                 2NaOH + CO₂ → Na₂CO₃ + H₂O
               </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-8 border-t border-slate-800 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] pb-8">
        Closed-Loop Sequestration Rig &bull; Engineering Simulation 
      </footer>
    </div>
  );
};

export default App;
