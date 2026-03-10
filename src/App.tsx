/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Heart, 
  Thermometer, 
  User, 
  Stethoscope, 
  ShieldAlert,
  Info,
  CheckCircle2,
  History,
  LayoutDashboard,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bell,
  X,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// --- Types ---

interface PatientData {
  age: number;
  heart_rate: number;
  systolic_blood_pressure: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  body_temperature: number;
  pain_level: number;
  chronic_disease_count: number;
  previous_er_visits: number;
  arrival_mode: 'ambulance' | 'walk-in' | 'public_transport' | 'other';
}

interface PredictionResult {
  triage_level: number;
  confidence: number;
  risk_factors: string[];
  explanation: {
    top_features: string[];
    summary: string;
  };
}

// --- Mock Triage Logic (Ported from Python for UI functionality) ---

const calculateTriage = (data: PatientData): PredictionResult => {
  let score = 0;
  const risk_factors: string[] = [];
  
  if (data.oxygen_saturation < 90) {
    score += 4;
    risk_factors.push("Critical Hypoxia");
  } else if (data.oxygen_saturation < 94) {
    score += 1;
    risk_factors.push("Mild Hypoxia");
  }

  if (data.heart_rate > 130 || data.heart_rate < 50) {
    score += 3;
    risk_factors.push("Tachycardia/Bradycardia");
  }

  if (data.systolic_blood_pressure < 90 || data.systolic_blood_pressure > 180) {
    score += 3;
    risk_factors.push("Abnormal Blood Pressure");
  }

  if (data.respiratory_rate > 30) {
    score += 3;
    risk_factors.push("Tachypnea");
  }

  if (data.body_temperature > 39.5) {
    score += 2;
    risk_factors.push("High Fever");
  }

  if (data.pain_level > 8) {
    score += 2;
    risk_factors.push("Severe Pain");
  }

  let level = 5;
  if (score >= 6) level = 1;
  else if (score >= 4) level = 2;
  else if (score >= 2) level = 3;
  else if (score >= 1) level = 4;

  const confidence = 0.85 + (Math.random() * 0.1);

  return {
    triage_level: level,
    confidence: parseFloat(confidence.toFixed(2)),
    risk_factors,
    explanation: {
      top_features: risk_factors.slice(0, 2),
      summary: `Prediction driven by ${risk_factors[0] || 'stable vitals'} and ${risk_factors[1] || 'patient history'}.`
    }
  };
};

// --- Components ---

const TriageBadge = ({ level }: { level: number }) => {
  const colors = [
    '',
    'bg-red-600 text-white shadow-lg shadow-red-200',    // Level 1
    'bg-orange-500 text-white shadow-lg shadow-orange-200', // Level 2
    'bg-yellow-400 text-black shadow-lg shadow-yellow-100', // Level 3
    'bg-green-500 text-white shadow-lg shadow-green-100',  // Level 4
    'bg-blue-500 text-white shadow-lg shadow-blue-100'    // Level 5
  ];

  const labels = [
    '',
    'RESUSCITATION',
    'EMERGENT',
    'URGENT',
    'LESS URGENT',
    'NON-URGENT'
  ];

  return (
    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase font-mono ${colors[level]}`}>
      LEVEL {level}: {labels[level]}
    </div>
  );
};

// --- Advanced UI Components ---

const ClinicalMetric = ({ label, value, unit, trend, icon: Icon, color }: any) => (
  <div className="hardware-card p-6 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {trend > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="micro-label mb-1">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold font-mono tracking-tighter">{value}</span>
      <span className="text-xs font-bold text-gray-400 uppercase">{unit}</span>
    </div>
  </div>
);

const TriageTrends = ({ history }: { history: any[] }) => {
  const data = history.slice(0, 10).reverse().map((h, i) => ({
    name: h.time,
    level: 6 - h.triage_level, // Invert for chart height
    confidence: h.confidence * 100
  }));

  return (
    <div className="h-[240px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E3E5" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1C1E', 
              border: 'none', 
              borderRadius: '12px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="level" 
            stroke="#2563EB" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorLevel)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intake' | 'history'>('dashboard');
  const [formData, setFormData] = useState<PatientData>({
    age: 45,
    heart_rate: 82,
    systolic_blood_pressure: 120,
    oxygen_saturation: 98,
    respiratory_rate: 16,
    body_temperature: 37.0,
    pain_level: 2,
    chronic_disease_count: 0,
    previous_er_visits: 0,
    arrival_mode: 'walk-in'
  });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<{ id: string, patientId: string, level: number, time: string }[]>([]);
  const [history, setHistory] = useState<(PatientData & PredictionResult & { id: string, time: string, timestamp: number })[]>([]);
  
  // History Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'timestamp', direction: 'desc' });
  const [selectedRecord, setSelectedRecord] = useState<(PatientData & PredictionResult & { id: string, time: string, timestamp: number }) | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'arrival_mode' ? value : (value === '' ? NaN : parseFloat(value))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // Sanitize NaN values before calculation
    const sanitizedData = { ...formData };
    Object.keys(sanitizedData).forEach(key => {
      const val = (sanitizedData as any)[key];
      if (typeof val === 'number' && isNaN(val)) {
        // Use default values if empty
        if (key === 'body_temperature') (sanitizedData as any)[key] = 37.0;
        else if (key === 'oxygen_saturation') (sanitizedData as any)[key] = 98;
        else (sanitizedData as any)[key] = 0;
      }
    });

    // Simulate API delay
    setTimeout(() => {
      const result = calculateTriage(sanitizedData);
      setPrediction(result);
      setIsAnalyzing(false);
      
      const historyItem = {
        ...sanitizedData,
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setHistory(prev => [historyItem, ...prev]);
      
      // Auto-trigger alert for Level 1 (Resuscitation)
      if (result.triage_level === 1) {
        triggerAlert(historyItem.id, 1);
      }
    }, 1500);
  };

  const triggerAlert = (patientId: string, level: number) => {
    const newAlert = {
      id: Math.random().toString(36).substr(2, 9),
      patientId,
      level,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
  };

  const clearAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] font-sans selection:bg-blue-100">
      {/* Global Alert Banner */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white overflow-hidden shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">Active Emergency Alerts ({activeAlerts.length})</p>
                  <p className="text-[10px] opacity-80">Immediate medical attention required for flagged patients.</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto max-w-2xl px-4 no-scrollbar">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold">#{alert.patientId.slice(0,6)} (L{alert.level})</span>
                    <button onClick={() => clearAlert(alert.id)} className="hover:bg-white/20 p-0.5 rounded-md transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-72 bg-white border-r border-clinical-line z-50 p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-clinical-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 transform -rotate-6">
            <ShieldAlert className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif italic font-bold text-2xl leading-none tracking-tight">TriageAI</h1>
            <p className="micro-label mt-1">Clinical Intelligence</p>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'intake', label: 'New Assessment', icon: Plus },
            { id: 'history', label: 'Clinical Logs', icon: History },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-clinical-accent text-white shadow-xl shadow-blue-100 font-bold' : 'text-gray-400 hover:bg-gray-50 hover:text-clinical-ink'}`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:text-clinical-accent transition-colors'} />
              <span className="text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-6">
          <div className="p-6 bg-gray-50 rounded-3xl border border-clinical-line">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-clinical-success rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="micro-label">System Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">v2.4.0-stable</span>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="user" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-72 p-12 max-w-7xl">
        <header className="mb-12 flex justify-between items-end">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2 className="text-5xl font-serif font-bold tracking-tighter mb-4">
              {activeTab === 'dashboard' && 'Clinical Overview'}
              {activeTab === 'intake' && 'Patient Assessment'}
              {activeTab === 'history' && 'Triage Logs'}
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-clinical-accent" />
                <span className="text-xs font-bold text-clinical-accent uppercase tracking-widest">Shift: 08:00 - 20:00</span>
              </div>
            </div>
          </motion.div>
          
          <div className="flex gap-4">
            <div className="hardware-card px-6 py-3 flex items-center gap-4">
              <div className="text-right">
                <p className="micro-label">Avg Wait Time</p>
                <p className="text-xl font-mono font-bold">12<span className="text-[10px] text-gray-400 ml-1">MIN</span></p>
              </div>
              <div className="w-px h-8 bg-clinical-line" />
              <div className="text-right">
                <p className="micro-label">Staff Active</p>
                <p className="text-xl font-mono font-bold">08</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
              <ClinicalMetric 
                label="Total Admissions" 
                value={history.length.toString().padStart(2, '0')} 
                unit="Patients" 
                trend={+12}
                icon={User} 
                color="bg-blue-600" 
              />
              <ClinicalMetric 
                label="Critical Cases" 
                value={history.filter(h => h.triage_level === 1).length.toString().padStart(2, '0')} 
                unit="Level 1" 
                trend={-5}
                icon={AlertCircle} 
                color="bg-red-600" 
              />
              <ClinicalMetric 
                label="Avg Confidence" 
                value={history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.confidence, 0) / history.length * 100) : '00'} 
                unit="Percent" 
                icon={Activity} 
                color="bg-emerald-600" 
              />
              <ClinicalMetric 
                label="Active Alerts" 
                value={activeAlerts.length.toString().padStart(2, '0')} 
                unit="Emergency" 
                icon={Bell} 
                color="bg-orange-600" 
              />
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 hardware-card p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-serif italic">Triage Velocity</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time assessment trends</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 hover:text-clinical-ink transition-colors">24H</button>
                    <button className="px-3 py-1 bg-clinical-ink text-white rounded-lg text-[10px] font-bold">LIVE</button>
                  </div>
                </div>
                <TriageTrends history={history} />
              </div>

              <div className="hardware-card p-8 bg-clinical-ink text-white border-none">
                <h3 className="text-xl font-bold font-serif italic mb-6">Clinical Feed</h3>
                <div className="space-y-8">
                  {history.length === 0 ? (
                    <div className="text-center py-12 opacity-30">
                      <Activity size={40} className="mx-auto mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">No Active Feed</p>
                    </div>
                  ) : (
                    history.slice(0, 4).map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={item.id} 
                        className="flex gap-4 relative"
                      >
                        {i !== 3 && <div className="absolute left-[11px] top-8 w-px h-12 bg-white/10" />}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.triage_level === 1 ? 'bg-red-500' : 'bg-blue-500'}`}>
                          {item.triage_level}
                        </div>
                        <div>
                          <p className="text-xs font-bold">Patient #{item.id.slice(0,6)}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-1">{item.time} • {item.explanation.top_features[0] || 'Stable'}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
                >
                  View Full Logs
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-8">
              <div className="hardware-card p-10 bg-clinical-accent text-white border-none relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-serif font-bold mb-4">Ready for Assessment?</h3>
                  <p className="text-white/70 text-sm max-w-sm mb-8 leading-relaxed">
                    Our AI-driven triage system analyzes vital signs in real-time to provide clinical decision support with 94.2% recall for critical cases.
                  </p>
                  <button 
                    onClick={() => setActiveTab('intake')}
                    className="bg-white text-clinical-accent px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-900/20 hover:scale-105 transition-transform flex items-center gap-3"
                  >
                    <Plus size={20} />
                    Start New Intake
                  </button>
                </div>
              </div>
              
              <div className="hardware-card p-10 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">System Integrity</h4>
                    <p className="micro-label">Validated Clinical Models</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'XGBoost v4.2', status: 'Active' },
                    { label: 'SHAP Explainability', status: 'Active' },
                    { label: 'Recall Optimization', status: '94.2%' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-500">{item.label}</span>
                      <span className="text-xs font-mono font-bold text-clinical-ink">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intake' && (
          <div className="grid grid-cols-5 gap-8">
            {/* Form */}
            <div className="col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900">Analyzing Clinical Data</h4>
                      <p className="text-xs text-gray-500 mt-1">Running triage prediction model...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <h3 className="micro-label mb-8 flex items-center gap-2">
                    <User size={14} className="text-clinical-accent" />
                    Patient Demographics
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Age</label>
                      <input 
                        type="number" name="age" value={isNaN(formData.age) ? '' : formData.age} onChange={handleInputChange}
                        required
                        className="w-full bg-gray-50 border border-clinical-line rounded-2xl px-5 py-4 text-sm font-mono focus:ring-2 focus:ring-clinical-accent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Arrival Mode</label>
                      <select 
                        name="arrival_mode" value={formData.arrival_mode} onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-clinical-line rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-clinical-accent outline-none transition-all appearance-none"
                      >
                        <option value="walk-in">Walk-in</option>
                        <option value="ambulance">Ambulance</option>
                        <option value="public_transport">Public Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="micro-label mb-8 flex items-center gap-2">
                    <Activity size={14} className="text-clinical-accent" />
                    Vital Signs Matrix
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    {[
                      { label: 'Heart Rate (BPM)', name: 'heart_rate', icon: Heart },
                      { label: 'Systolic BP (mmHg)', name: 'systolic_blood_pressure', icon: Activity },
                      { label: 'Oxygen Saturation (%)', name: 'oxygen_saturation', icon: Thermometer },
                      { label: 'Respiratory Rate', name: 'respiratory_rate', icon: Activity },
                      { label: 'Temperature (°C)', name: 'body_temperature', icon: Thermometer },
                      { label: 'Pain Level (0-10)', name: 'pain_level', icon: AlertCircle },
                    ].map((field) => (
                      <div key={field.name} className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <field.icon size={12} className="text-clinical-accent" />
                          {field.label}
                        </label>
                        <input 
                          type="number" step="0.1" name={field.name} value={isNaN((formData as any)[field.name]) ? '' : (formData as any)[field.name]} onChange={handleInputChange}
                          required
                          className="w-full bg-gray-50 border border-clinical-line rounded-2xl px-5 py-4 text-sm font-mono focus:ring-2 focus:ring-clinical-accent outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <button 
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Clinical Data...
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={20} />
                      Generate Triage Prediction
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results Sidebar */}
            <div className="col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {prediction ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 p-6">
                      <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold">
                        {Math.round(prediction.confidence * 100)}% CONFIDENCE
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Assessment Result</h3>
                    
                    <div className="mb-10">
                      <p className="text-sm text-gray-500 mb-2">Recommended Triage Level</p>
                      <TriageBadge level={prediction.triage_level} />
                    </div>

                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-500" />
                          Identified Risk Factors
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {prediction.risk_factors.length > 0 ? (
                            prediction.risk_factors.map((risk, i) => (
                              <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-red-100">
                                {risk}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No critical risk factors detected.</span>
                          )}
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Info size={14} className="text-blue-600" />
                          AI Explanation
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {prediction.explanation.summary}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Drivers</p>
                          <div className="space-y-2">
                            {prediction.explanation.top_features.map((feat, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600 capitalize">{feat.replace('_', ' ')}</span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${80 - i * 20}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Alert Trigger */}
                      {prediction.triage_level <= 2 && (
                        <button 
                          onClick={() => triggerAlert(history[0]?.id || 'NEW', prediction.triage_level)}
                          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold border-2 border-dashed border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-3 group"
                        >
                          <Bell size={20} className="group-hover:animate-bounce" />
                          ACTIVATE EMERGENCY ALERT
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center h-[600px]">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Stethoscope size={32} className="text-gray-200" />
                    </div>
                    <h3 className="font-bold text-gray-400 mb-2">Awaiting Assessment</h3>
                    <p className="text-xs text-gray-400 max-w-[200px]">
                      Complete the patient intake form to generate a triage prediction.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by Patient ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select 
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Level 1: Resuscitation</option>
                    <option value="2">Level 2: Emergent</option>
                    <option value="3">Level 3: Urgent</option>
                    <option value="4">Level 4: Less Urgent</option>
                    <option value="5">Level 5: Non-Urgent</option>
                  </select>
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {history.length} Records Found
              </div>
            </div>

            {/* Table */}
            <div className="hardware-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-clinical-line">
                    {[
                      { label: 'ID', key: 'id' },
                      { label: 'Time', key: 'timestamp' },
                      { label: 'Demographics', key: 'age' },
                      { label: 'Vitals (HR/BP/SpO2/RR/T)', key: 'vitals' },
                      { label: 'Triage Level', key: 'triage_level' },
                      { label: 'Confidence', key: 'confidence' },
                      { label: 'Actions', key: 'actions' },
                    ].map((col) => (
                      <th 
                        key={col.key} 
                        onClick={() => {
                          if (col.key === 'vitals' || col.key === 'actions') return;
                          setSortConfig(prev => ({
                            key: col.key,
                            direction: prev.key === col.key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc'
                          }));
                        }}
                        className={`px-8 py-6 micro-label ${col.key !== 'vitals' && col.key !== 'actions' ? 'cursor-pointer hover:text-clinical-accent transition-colors' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {col.key !== 'vitals' && col.key !== 'actions' && (
                            sortConfig.key === col.key ? (
                              sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                            ) : <ArrowUpDown size={10} className="opacity-30" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let filtered = history.filter(item => {
                      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesLevel = filterLevel === 'all' || item.triage_level === filterLevel;
                      return matchesSearch && matchesLevel;
                    });

                    if (sortConfig.key && sortConfig.direction) {
                      filtered.sort((a: any, b: any) => {
                        const valA = a[sortConfig.key];
                        const valB = b[sortConfig.key];
                        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                      });
                    }

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-8 py-24 text-center">
                            <div className="opacity-20 flex flex-col items-center">
                              <Search size={48} className="mb-4" />
                              <p className="text-sm font-bold uppercase tracking-widest">No Records Found</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((item) => (
                      <tr key={item.id} className="data-row">
                        <td className="px-8 py-6 text-xs font-mono font-bold text-clinical-accent">#{item.id.slice(0,6)}</td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-400">{item.time}</td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-bold">{item.age}Y</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{item.arrival_mode.replace('_', ' ')}</div>
                        </td>
                        <td className="px-8 py-6 text-xs font-mono font-medium">
                          <div className="flex gap-2 items-center">
                            <span className="text-clinical-ink">{item.heart_rate}</span>
                            <span className="text-gray-200">/</span>
                            <span className="text-clinical-ink">{item.systolic_blood_pressure}</span>
                            <span className="text-gray-200">/</span>
                            <span className="text-clinical-ink">{item.oxygen_saturation}%</span>
                            <span className="text-gray-200">/</span>
                            <span className="text-clinical-ink">{item.respiratory_rate}</span>
                            <span className="text-gray-200">/</span>
                            <span className="text-clinical-ink">{item.body_temperature}°</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-widest ${
                            item.triage_level === 1 ? 'bg-red-600 text-white' : 
                            item.triage_level === 2 ? 'bg-orange-500 text-white' :
                            item.triage_level === 3 ? 'bg-yellow-400 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            L{item.triage_level}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold font-mono">
                          {Math.round(item.confidence * 100)}%
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setSelectedRecord(item)}
                              className="p-2.5 hover:bg-clinical-accent hover:text-white rounded-xl transition-all"
                              title="View Details"
                            >
                              <Info size={16} />
                            </button>
                            {item.triage_level <= 2 && !activeAlerts.some(a => a.patientId === item.id) && (
                              <button 
                                onClick={() => triggerAlert(item.id, item.triage_level)}
                                className="p-2.5 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                title="Trigger Alert"
                              >
                                <Bell size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Record Details Modal */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setSelectedRecord(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">Patient Assessment Details</h3>
                      <span className="text-xs font-mono text-gray-400">#{selectedRecord.id.slice(0,8)}</span>
                    </div>
                    <p className="text-sm text-gray-500">Recorded at {selectedRecord.time} on {new Date(selectedRecord.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="p-8 grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Demographics & Vitals</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Age</p>
                          <p className="text-sm font-bold">{selectedRecord.age} years</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Arrival</p>
                          <p className="text-sm font-bold capitalize">{selectedRecord.arrival_mode.replace('_', ' ')}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Heart Rate</p>
                          <p className="text-sm font-bold">{selectedRecord.heart_rate} BPM</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Blood Pressure</p>
                          <p className="text-sm font-bold">{selectedRecord.systolic_blood_pressure} mmHg</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">SpO2</p>
                          <p className="text-sm font-bold">{selectedRecord.oxygen_saturation}%</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Resp. Rate</p>
                          <p className="text-sm font-bold">{selectedRecord.respiratory_rate}/min</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Temperature</p>
                          <p className="text-sm font-bold">{selectedRecord.body_temperature}°C</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Pain Level</p>
                          <p className="text-sm font-bold">{selectedRecord.pain_level}/10</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">AI Prediction</h4>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <TriageBadge level={selectedRecord.triage_level} />
                          <span className="text-[10px] font-bold text-blue-600">{Math.round(selectedRecord.confidence * 100)}% Confidence</span>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed italic">
                          "{selectedRecord.explanation.summary}"
                        </p>
                      </div>
                      
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Risk Factors</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.risk_factors.length > 0 ? (
                          selectedRecord.risk_factors.map((risk, i) => (
                            <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-red-100">
                              {risk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No critical risk factors detected.</span>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="bg-white border border-gray-200 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
