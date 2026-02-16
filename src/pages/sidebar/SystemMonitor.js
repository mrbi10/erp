import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { 
  FaServer, 
  FaMemory, 
  FaHdd, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaDatabase,
  FaNetworkWired,
  FaSync
} from "react-icons/fa";
import { motion } from "framer-motion";

const API = "https://api.mnmjec.in";

// --- SUB-COMPONENTS ---

const StatusBadge = ({ status }) => {
  const styles = {
    UP: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DOWN: "bg-rose-100 text-rose-700 border-rose-200",
    SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FAILED: "bg-rose-100 text-rose-700 border-rose-200",
    WARNING: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING: "bg-slate-100 text-slate-600 border-slate-200"
  };

  const config = styles[status] || styles.PENDING;
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 w-fit ${config}`}>
      {["UP", "SUCCESS"].includes(status) && <FaCheckCircle />}
      {["DOWN", "FAILED"].includes(status) && <FaTimesCircle />}
      {status === "WARNING" && <FaExclamationTriangle />}
      {status}
    </span>
  );
};

const MetricCard = ({ title, value, unit, icon: Icon, threshold = 85, color }) => {
  const numValue = parseFloat(value);
  const isDanger = numValue > threshold;
  
  // Dynamic color logic
  const activeColor = isDanger ? "text-rose-600" : color || "text-slate-700";
  const barColor = isDanger ? "bg-rose-500" : color ? color.replace("text-", "bg-").replace("-600", "-500") : "bg-indigo-500";

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className={`text-3xl font-extrabold ${activeColor}`}>
              {value}
            </h3>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-slate-50 ${activeColor}`}>
          <Icon className="text-xl" />
        </div>
      </div>
      
      {/* Progress Bar for Percentages */}
      {unit === "%" && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(numValue, 100)}%` }}
            transition={{ duration: 1 }}
            className={`h-full rounded-full ${barColor}`} 
          />
        </div>
      )}
      
      {isDanger && unit === "%" && (
        <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1">
          <FaExclamationTriangle /> High Usage Detected
        </p>
      )}
    </div>
  );
};

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>
);

// --- MAIN COMPONENT ---

export default function SystemMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/systemmonitor/health?days=1`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      // Downsample data if too large for chart performance
      const rawData = res.data; 
      const formatted = rawData.map(item => ({
        fullTime: new Date(item.created_at),
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: Number(item.cpu_usage_percent),
        memory: Number(item.memory_usage_percent),
        disk: Number(item.disk_usage_percent)
      }));

      setHistory(formatted);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/systemmonitor/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setData(res.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Monitor fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchHistory();

    const interval = setInterval(() => {
      fetchDashboard();
      fetchHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8"><SkeletonLoader /></div>;
  if (!data) return <div className="p-8 text-center text-slate-500">System Offline or Unreachable</div>;

  const { health, services, backups } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              System Health Monitor
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Real-time infrastructure telemetry</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
             <FaSync className="animate-spin-slow" />
             Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="CPU Load"
            value={health?.cpu_usage_percent || 0}
            unit="%"
            icon={FaServer}
            color="text-indigo-600"
          />
          <MetricCard
            title="Memory Usage"
            value={health?.memory_usage_percent || 0}
            unit="%"
            icon={FaMemory}
            color="text-violet-600"
          />
          <MetricCard
            title="Storage"
            value={health?.disk_usage_percent || 0}
            unit="%"
            icon={FaHdd}
            threshold={90}
            color="text-cyan-600"
          />
          <MetricCard
            title="System Uptime"
            value={Math.floor((health?.uptime_seconds || 0) / 3600)}
            unit="Hours"
            icon={FaClock}
            color="text-emerald-600"
            threshold={999999} // Never red
          />
        </div>

        {/* MAIN CHART */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <FaNetworkWired className="text-slate-400" /> Performance History
             </h2>
             <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">24 Hours</span>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 12, fill: '#94a3b8'}} 
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                />
                <YAxis 
                    domain={[0, 100]} 
                    tick={{fontSize: 12, fill: '#94a3b8'}} 
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                />
                <Legend iconType="circle" />
                
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="CPU Load" />
                <Area type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" name="Memory" />
                {/* Disk often flatline, keep as line to reduce noise */}
                <Line type="step" dataKey="disk" stroke="#f43f5e" strokeWidth={2} dot={false} name="Disk Usage" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM SECTION: SERVICES & BACKUPS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Services Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <FaServer className="text-indigo-500" /> Active Services
               </h3>
               <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">{services.length} Total</span>
            </div>
            <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="p-4">Service Name</th>
                      <th className="p-4">Latency</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-700">{s.service_name}</td>
                        <td className="p-4 text-slate-500 font-mono">{s.response_time_ms}ms</td>
                        <td className="p-4 flex justify-end">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>

          {/* Backups Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <FaDatabase className="text-indigo-500" /> Database Backups
               </h3>
            </div>
             <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="p-4">Filename</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backups.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-600 truncate max-w-[150px]" title={b.file_name}>
                          {b.file_name.split('_').pop()} {/* Simplified name display */}
                        </td>
                        <td className="p-4 text-slate-600">{b.file_size_mb} MB</td>
                        <td className="p-4 text-slate-400">{b.duration_seconds}s</td>
                        <td className="p-4 flex justify-end">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}