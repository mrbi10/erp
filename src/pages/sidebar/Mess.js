import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants/API";
import {
  FaUtensils,
  FaCheck,
  FaHistory,
  FaRupeeSign,
  FaCalendarAlt,
  FaSpinner,
  FaPlusCircle,
  FaChartPie,
  FaUserTie,
  FaUser,
  FaUsers,
  FaMoneyBillWave,
  FaCalculator
} from "react-icons/fa";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";


// --- Utils ---
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatCurrency = (amount) => {
  const num = parseInt(amount, 10);

  if (isNaN(num)) return "₹0";

  return `₹${num.toLocaleString("en-IN")}`;
};


// --- Styled Components ---

const StyledFlatpickr = ({ placeholder, value, onChange, options = {} }) => (
  <div className="relative w-full">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FaCalendarAlt className="text-gray-400 text-sm" />
    </div>
    <Flatpickr
      options={{ dateFormat: "Y-m-d", ...options }}
      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-gray-700 placeholder-gray-400 shadow-sm"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

// Insight Pill (Matches previous theme)
const InsightPill = ({ label, count, icon: Icon, color }) => (
  <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow flex-1 min-w-[200px]">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-gray-800">{count}</p>
    </div>
  </div>
);

// Overview Card
const StatCard = ({ title, value, subtext, colorClass, icon: Icon }) => (
  <div className={`p-6 rounded-2xl border ${colorClass} relative overflow-hidden`}>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-bold uppercase tracking-wide opacity-80">{title}</p>
        <Icon className="text-2xl opacity-50" />
      </div>
      <div className="text-3xl font-extrabold">{value}</div>
      {subtext && <p className="text-xs mt-1 font-medium opacity-70">{subtext}</p>}
    </div>
    {/* Decorative Circle */}
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white opacity-20 pointer-events-none"></div>
  </div>
);

export default function MessDashboard() {
  // --- State ---
  const [todayCount, setTodayCount] = useState({ jain: 0, nonJain: 0 });
  const [manualCount, setManualCount] = useState({ jain: "", nonJain: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState([]);

  // Billing State
  const [range, setRange] = useState({ from: "", to: "" });
  const [price, setPrice] = useState("");
  const [bill, setBill] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Payment History State
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [nextStart, setNextStart] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAudit, setShowAudit] = useState(false);


  // Analysis State
  const [analysisRange, setAnalysisRange] = useState({ from: "", to: "" });
  const [analysisData, setAnalysisData] = useState({
    totalJain: 0,
    totalNonJain: 0,
    totalPlates: 0,
    totalPaid: 0,
  });

  const token = localStorage.getItem("token");

  // Memoized today's date
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  // --- API Calls ---

  const fetchTodayCounts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ov = res.data;
      const jain = Number(ov?.jain_students?.present || 0);
      const present = Number(ov?.present_today || 0);
      setTodayCount({ jain, nonJain: present - jain });
    } catch (error) {
      console.error("Failed to fetch today's count:", error);
    }
  };

  const fetchHistoryAndPayments = async () => {
    setLoadingHistory(true);
    try {
      const [historyRes, paymentRes, nextStartRes] = await Promise.all([
        axios.get(`${BASE_URL}/mess/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/mess/payment/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/mess/payment/next-start`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setHistory(historyRes.data.records || []);
      setPaymentHistory(paymentRes.data.records || []);

      const nextStartDate = nextStartRes.data.next_start;
      setNextStart(nextStartDate);
      // Only set range from if it hasn't been manually touched, or on first load
      setRange(prev => ({ ...prev, from: nextStartDate || prev.from || todayDate }));

    } catch (error) {
      console.error("Failed to fetch history/payments:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTodayCounts();
    fetchHistoryAndPayments();
  }, []);

  // --- Calculations for Analysis ---

  const filteredHistory = useMemo(() => {
    if (!analysisRange.from || !analysisRange.to) return [];
    return history.filter(h => {
      const d = new Date(h.date);
      return d >= new Date(analysisRange.from) && d <= new Date(analysisRange.to);
    });
  }, [analysisRange, history]);

  const filteredPayments = useMemo(() => {
    if (!analysisRange.from || !analysisRange.to) return [];
    return paymentHistory.filter(p => {
      const start = new Date(analysisRange.from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(analysisRange.to);
      end.setHours(23, 59, 59, 999);
      const d = new Date(p.paid_on);
      return d >= start && d <= end;
    });
  }, [analysisRange, paymentHistory]);

  useEffect(() => {
    const totalJain = filteredHistory.reduce((s, r) => s + r.jain_count, 0);
    const totalNonJain = filteredHistory.reduce((s, r) => s + r.non_jain_count, 0);
    const totalPaid = filteredPayments.reduce((s, r) => s + r.total_amount, 0);
    console.log(totalPaid);

    setAnalysisData({
      totalJain,
      totalNonJain,
      totalPlates: totalJain + totalNonJain,
      totalPaid,
    });
  }, [filteredHistory, filteredPayments]);

  // --- Handlers ---

  const handleViewAudit = async (paymentId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/activity-logs?module=MESS_PAYMENT&ref_id=${paymentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuditLogs(res.data);
      setShowAudit(true);
    } catch {
      Swal.fire("Error", "Failed to load audit trail", "error");
    }
  };

  const handleDeletePayment = async (payment) => {
    const confirm = await Swal.fire({
      title: "Delete Payment?",
      text: "This action is irreversible and will be logged",
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(
        `${BASE_URL}/mess/payment/${payment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Deleted", "Payment removed", "success");
      fetchHistoryAndPayments();
    } catch {
      Swal.fire("Error", "Cannot delete this payment", "error");
    }
  };

  const handleUpdatePayment = async () => {
    const confirm = await Swal.fire({
      title: "Update Payment?",
      text: "This will be logged in audit trail",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Update"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(
        `${BASE_URL}/mess/payment/${editingPayment.id}`,
        { price_per_plate: editingPayment.price_per_plate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Updated", "Payment updated successfully", "success");
      setEditingPayment(null);
      fetchHistoryAndPayments();
    } catch {
      Swal.fire("Error", "Failed to update payment", "error");
    }
  };

  const handleSaveToday = async () => {
    const finalJain = Number(manualCount.jain || todayCount.jain);
    const finalNonJain = Number(manualCount.nonJain || todayCount.nonJain);

    if (finalJain < 0 || finalNonJain < 0 || isNaN(finalJain) || isNaN(finalNonJain)) {
      Swal.fire("Invalid Input", "Counts must be valid non-negative numbers.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Mess Count?",
      text: `Saving: Jain (${finalJain}) + Non-Jain (${finalNonJain}) = ${finalJain + finalNonJain}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      confirmButtonColor: "#4f46e5",
    });

    if (!confirm.isConfirmed) return;

    setIsSaving(true);
    try {
      await axios.post(
        `${BASE_URL}/mess/save`,
        {
          date: todayDate,
          jain_count: finalJain,
          non_jain_count: finalNonJain,
          created_by: "admin",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Saved!", "Today's mess count has been recorded.", "success");
      setManualCount({ jain: "", nonJain: "" });
      fetchHistoryAndPayments();
    } catch (error) {
      Swal.fire("Error", "Failed to save mess count.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateBill = async () => {
    if (!range.from || !range.to || !price || Number(price) <= 0) {
      Swal.fire("Missing Data", "Please select dates and enter a price.", "warning");
      return;
    }

    if (new Date(range.from) > new Date(range.to)) {
      Swal.fire("Invalid Range", "Start date must be before end date.", "warning");
      return;
    }

    setIsCalculating(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/mess/range?from=${range.from}&to=${range.to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const totals = res.data;
      const platePrice = parseInt(price, 10);
      const totalAmount = totals.total_plates * platePrice;

      setBill({
        total_plates: totals.total_plates,
        total_amount: totalAmount,
        startDate: range.from,
        endDate: range.to,
        platePrice
      });

    } catch (error) {
      Swal.fire("Error", "Failed to calculate bill range.", "error");
      setBill(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSavePayment = async () => {
    if (!bill) return;

    const confirm = await Swal.fire({
      title: "Confirm Payment",
      text: `Record payment of ${formatCurrency(bill.total_amount)} for ${bill.total_plates} plates?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Record",
      confirmButtonColor: "#10b981",
    });

    if (!confirm.isConfirmed) return;

    setIsPaying(true);
    try {
      await axios.post(
        `${BASE_URL}/mess/payment`,
        {
          from_date: bill.startDate,
          to_date: bill.endDate,
          total_plates: bill.total_plates,
          price_per_plate: bill.platePrice,
          total_amount: bill.total_amount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Success", "Payment recorded successfully.", "success");
      setBill(null);
      setPrice("");
      fetchHistoryAndPayments();
    } catch (error) {
      Swal.fire("Error", "Failed to save payment.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const recentHistory = history.slice(0, 5);
  const totalToday = todayCount.jain + todayCount.nonJain;

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><FaUtensils className="text-xl" /></span>
              Mess Management
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Daily tracking and financial reconciliation.</p>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 flex items-center gap-2">
            <FaCalendarAlt className="text-indigo-500" /> Today: {formatDate(todayDate)}
          </div>
        </div>

        {/* --- SECTION 1: TODAY'S OPERATIONS --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Today's Stats Card */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-green-50 p-2 rounded-lg text-green-600"><FaChartPie /></div>
              <h2 className="font-bold text-gray-700">Live Attendance Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              <StatCard
                title="Jain Plates"
                value={todayCount.jain}
                subtext="Auto-detected"
                colorClass="bg-emerald-600 text-white border-transparent"
                icon={FaUserTie}
              />
              <StatCard
                title="Non-Jain"
                value={todayCount.nonJain}
                subtext="Auto-detected"
                colorClass="bg-blue-600 text-white border-transparent"
                icon={FaUser}
              />
              <StatCard
                title="Total Count"
                value={totalToday}
                subtext="Total Plates"
                colorClass="bg-slate-800 text-white border-transparent"
                icon={FaUtensils}
              />
            </div>
          </div>

          {/* Manual Entry Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><FaCheck /></div>
              <h2 className="font-bold text-gray-700">Finalize Day Count</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jain Override</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder={todayCount.jain}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  value={manualCount.jain}
                  onChange={(e) => setManualCount({ ...manualCount, jain: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Non-Jain Override</label>
                <input
                  type="number"
                  placeholder={todayCount.nonJain}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  value={manualCount.nonJain}
                  onChange={(e) => setManualCount({ ...manualCount, nonJain: e.target.value })}
                />
              </div>

              <button
                onClick={handleSaveToday}
                disabled={isSaving}
                className="w-full mt-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 active:scale-95"
              >
                {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {isSaving ? "Saving..." : "Submit Daily Count"}
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: BILLING & PAYMENTS --- */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10 opacity-60"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><FaCalculator className="text-xl" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Billing Calculator</h2>
                <p className="text-sm text-gray-500">Calculate and record mess payments.</p>
              </div>
            </div>

            {nextStart && (
              <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-100 text-sm font-medium flex items-center gap-2">
                <FaHistory className="text-amber-500" /> Next unpaid date: <strong>{new Date(nextStart).toLocaleDateString()}</strong>
              </div>
            )}
          </div>

          {/* Calculator Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">From Date</label>
              <StyledFlatpickr
                placeholder="Start Date"
                options={{
                  maxDate: todayDate,
                  clickOpens: false,
                }}
                value={nextStart || range.from}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">To Date</label>
              <StyledFlatpickr
                placeholder="End Date"
                options={{ maxDate: todayDate }}
                value={range.to}
                onChange={(d) => setRange({ ...range, to: formatLocalDate(d[0]) })}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Rate per Plate</label>
              <div className="relative">
                <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  placeholder="Enter amount (₹)"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
             focus:ring-2 focus:ring-purple-100 focus:border-purple-500 
             transition-all font-medium text-sm shadow-sm"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(".")) return;
                    setPrice(val.replace(/\D/g, ""));
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <button
                onClick={handleCalculateBill}
                disabled={isCalculating || !range.from || !range.to || !price}
                className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-70 active:scale-95"
              >
                {isCalculating ? <FaSpinner className="animate-spin" /> : <FaCalculator />}
                Calculate
              </button>
            </div>
          </div>

          {/* Bill Result Animation */}
          <AnimatePresence>
            {bill && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="text-center md:text-left">
                      <p className="text-xs text-purple-600 font-bold uppercase mb-1">Total Plates</p>
                      <p className="text-3xl font-extrabold text-gray-800">{bill.total_plates}</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-xs text-purple-600 font-bold uppercase mb-1">Total Amount</p>
                      <p className="text-3xl font-extrabold text-green-600">{formatCurrency(bill.total_amount)}</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-lg border border-purple-100">
                      Period: {bill.startDate} to {bill.endDate}
                    </div>
                  </div>

                  <button
                    onClick={handleSavePayment}
                    disabled={isPaying}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-2 active:scale-95"
                  >
                    {isPaying ? <FaSpinner className="animate-spin" /> : <FaMoneyBillWave />}
                    Confirm Payment
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- SECTION 3: RECENT HISTORY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Daily Count Log */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FaHistory className="text-gray-400" />
                <h3 className="font-bold text-gray-700">Recent Daily Counts</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[300px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase sticky top-0">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Jain</th>
                    <th className="p-4">Non-Jain</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentHistory.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-400">No records found</td></tr>
                  ) : (
                    recentHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">{formatDate(h.date)}</td>
                        <td className="p-4 text-green-600">{h.jain_count}</td>
                        <td className="p-4 text-blue-600">{h.non_jain_count}</td>
                        <td className="p-4 text-right font-bold text-gray-800">{h.jain_count + h.non_jain_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Log */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-gray-400" />
                <h3 className="font-bold text-gray-700">Recent Payments</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[300px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase sticky top-0">
                  <tr>
                    <th className="p-4">Period</th>
                    <th className="p-4">Plates</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-400">No payments yet</td></tr>
                  ) : (
                    paymentHistory.slice(0, 5).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <span className="block font-medium text-gray-700">{formatDate(p.from_date)}</span>
                          <span className="text-xs text-gray-400">to {formatDate(p.to_date)}</span>
                        </td>
                        <td className="p-4 text-gray-600">{p.total_plates}</td>
                        <td className="p-4 text-right font-bold text-green-600">
                          {formatCurrency(p.total_amount)}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingPayment(p)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() => handleDeletePayment(p)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>

                          <button
                            onClick={() => handleViewAudit(p.id)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- SECTION 4: DETAILED ANALYSIS --- */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-gray-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaChartPie className="text-indigo-500" /> Detailed Analysis
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select a date range to view aggregate data.</p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="w-full md:w-40">
                <StyledFlatpickr
                  placeholder="From Date"
                  value={analysisRange.from}
                  options={{ maxDate: todayDate }}
                  onChange={(d) => setAnalysisRange({ ...analysisRange, from: formatLocalDate(d[0]) })}
                />
              </div>
              <div className="w-full md:w-40">
                <StyledFlatpickr
                  placeholder="To Date"
                  value={analysisRange.to}
                  options={{ maxDate: todayDate }}
                  onChange={(d) => setAnalysisRange({ ...analysisRange, to: formatLocalDate(d[0]) })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <InsightPill label="Total Jain" count={analysisData.totalJain} icon={FaUserTie} color="bg-emerald-50 text-emerald-600" />
            <InsightPill label="Total Non-Jain" count={analysisData.totalNonJain} icon={FaUser} color="bg-blue-50 text-blue-600" />
            <InsightPill label="Total Plates" count={analysisData.totalPlates} icon={FaUtensils} color="bg-indigo-50 text-indigo-600" />
            <InsightPill label="Total Paid" count={formatCurrency(analysisData.totalPaid)} icon={FaRupeeSign} color="bg-purple-50 text-purple-600" />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {editingPayment && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-[400px]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <h3 className="font-bold text-lg mb-4">Edit Payment</h3>

              <label className="text-sm font-semibold">Price per Plate</label>
              <input
                type="number"
                value={editingPayment.price_per_plate}
                onChange={(e) =>
                  setEditingPayment({
                    ...editingPayment,
                    price_per_plate: Number(e.target.value)
                  })
                }
                className="w-full mt-1 p-2 border rounded-lg"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePayment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showAudit && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-auto">
              <h3 className="font-bold text-lg mb-4">Audit Trail</h3>

              {auditLogs.length === 0 ? (
                <p className="text-gray-400">No changes recorded</p>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} className="border-b py-3 text-sm">
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-gray-500 text-xs">
                      {log.created_at} by {log.user_name}
                    </p>
                    <pre className="bg-gray-50 p-2 rounded text-xs mt-1">
                      {JSON.stringify(log.old_data, null, 2)}
                    </pre>
                  </div>
                ))
              )}

              <div className="text-right mt-4">
                <button
                  onClick={() => setShowAudit(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}