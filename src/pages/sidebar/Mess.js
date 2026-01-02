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
  FaPlusCircle
} from "react-icons/fa";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

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

// Helper function for currency formatting
const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Custom Flatpickr Component (Styled)
const StyledFlatpickr = ({ placeholder, value, onChange, options = {} }) => (
  <div className="relative">
    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
    <Flatpickr
      options={{ dateFormat: "Y-m-d", ...options }}
      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);


export default function MessDashboard() {
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

  const token = localStorage.getItem("token");
  const today = new Date();


  // Memoized today's date string for API and initial date
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

      setTodayCount({
        jain,
        nonJain: present - jain,
      });
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

      // Set next start date, and use it as default 'from' date
      const nextStartDate = nextStartRes.data.next_start;
      setNextStart(nextStartDate);
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

  // --- Handlers ---

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
          created_by: "admin", // Assuming admin is the logged-in user
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Saved!", "Today's mess count has been recorded.", "success");
      setManualCount({ jain: "", nonJain: "" }); // Clear manual input after save
      fetchHistoryAndPayments();
    } catch (error) {
      Swal.fire("Error", "Failed to save mess count.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateBill = async () => {
    if (!range.from || !range.to || !price || isNaN(Number(price)) || Number(price) <= 0) {
      Swal.fire("Missing Data", "Please select valid Start/End dates and a Plate Price.", "warning");
      return;
    }

    if (new Date(range.from) >= new Date(range.to)) {
      Swal.fire("Invalid Range", "Start date must be before the end date.", "warning");
      return;
    }

    setIsCalculating(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/mess/range?from=${range.from}&to=${range.to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const totals = res.data;
      const totalAmount = totals.total_plates * Number(price);

      setBill({
        total_plates: totals.total_plates,
        total_amount: totalAmount,
        startDate: range.from,
        endDate: range.to,
        platePrice: Number(price)
      });

      Swal.fire("Success", `Calculated ${totals.total_plates} plates for ${formatCurrency(totalAmount)}.`, "info");
    } catch (error) {
      Swal.fire("Error", "Failed to calculate bill range. Check API or date range.", "error");
      setBill(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSavePayment = async () => {
    if (!bill) return;

    const confirm = await Swal.fire({
      title: "Confirm Payment Save?",
      text: `Recording payment for ${bill.total_plates} plates, totaling ${formatCurrency(bill.total_amount)}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Record Payment",
      confirmButtonColor: "#10b981", // green-600
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

      Swal.fire("Payment Saved!", "The payment record has been successfully created.", "success");
      setBill(null); // Clear the bill calculation
      setPrice("");
      fetchHistoryAndPayments();
    } catch (error) {
      Swal.fire("Error", "Failed to save payment record.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const totalToday = todayCount.jain + todayCount.nonJain;
  const recentHistory = history.slice(0, 5);
  const recentPayments = paymentHistory.slice(0, 5);
  const [analysisRange, setAnalysisRange] = useState({ from: "", to: "" });
  const [analysisData, setAnalysisData] = useState({
    totalJain: 0,
    totalNonJain: 0,
    totalPlates: 0,
    totalPaid: 0,
  });


  const filteredHistory = useMemo(() => {
    if (!analysisRange.from || !analysisRange.to) return [];

    return history.filter(h => {
      const d = new Date(h.date);
      return d >= new Date(analysisRange.from) &&
        d <= new Date(analysisRange.to);
    });
  }, [analysisRange, history]);

  const filteredPayments = useMemo(() => {
    if (!analysisRange.from || !analysisRange.to) return [];

    return paymentHistory.filter(p => {
      const d = new Date(p.paid_on);
      return d >= new Date(analysisRange.from) &&
        d <= new Date(analysisRange.to);
    });
  }, [analysisRange, paymentHistory]);

  useEffect(() => {
    const totalJain = filteredHistory.reduce((s, r) => s + r.jain_count, 0);
    const totalNonJain = filteredHistory.reduce((s, r) => s + r.non_jain_count, 0);
    const totalPaid = filteredPayments.reduce((s, r) => s + r.total_amount, 0);

    setAnalysisData({
      totalJain,
      totalNonJain,
      totalPlates: totalJain + totalNonJain,
      totalPaid,
    });
  }, [filteredHistory, filteredPayments]);


  return (
    <div className="p-6 lg:p-10 bg-[#F8FAFC] min-h-screen font-sans text-slate-800 max-w-7xl mx-auto">

      {/* --- HEADER --- */}
      <h1 className="text-4xl font-extrabold mb-8 flex items-center tracking-tight">
        <span className="p-3 bg-indigo-100 rounded-xl text-indigo-600 mr-4"><FaUtensils /></span>
        Mess Management Dashboard
      </h1>

      {/* --- TODAY'S COUNT & MANUAL OVERRIDE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* 1. Today's Count */}
        <div className="p-8 rounded-2xl bg-white shadow-xl border border-gray-100 lg:col-span-2">
          <h2 className="text-2xl font-bold mb-5 text-gray-700">Attendance Overview on {formatDate(todayDate)}</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
              <p className="text-sm text-green-700 font-semibold">Jain Plates (Auto)</p>
              <div className="text-4xl font-extrabold text-green-800 mt-1">{todayCount.jain}</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-700 font-semibold">Non-Jain Plates (Auto)</p>
              <div className="text-4xl font-extrabold text-blue-800 mt-1">{todayCount.nonJain}</div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-200">
              <p className="text-sm text-indigo-700 font-semibold">Total Plates</p>
              <div className="text-4xl font-extrabold text-indigo-800 mt-1">{totalToday}</div>
            </div>
          </div>
        </div>

        {/* 2. Manual Override */}
        <div className="p-8 rounded-2xl bg-white shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
            <FaCheck className="mr-2 text-indigo-500" /> Manual Override
          </h2>

          <input
            type="number"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-3 focus:ring-indigo-300 focus:border-indigo-400 text-sm font-medium"
            value={manualCount.jain !== "" ? manualCount.jain : todayCount.jain}
            onChange={(e) =>
              setManualCount({ ...manualCount, jain: e.target.value })
            }
            min="0"
          />

          <input
            type="number"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:ring-indigo-300 focus:border-indigo-400 text-sm font-medium"
            value={manualCount.nonJain !== "" ? manualCount.nonJain : todayCount.nonJain}
            onChange={(e) =>
              setManualCount({ ...manualCount, nonJain: e.target.value })
            }
            min="0"
          />

          <button
            onClick={handleSaveToday}
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            {isSaving ? "Saving..." : "Save Today's Count"}
          </button>
        </div>
      </div>

      {/* --- BILLING & PAYMENT --- */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-10">
        <h2 className="text-2xl font-bold mb-5 text-gray-700 flex items-center">
          <FaRupeeSign className="mr-3 text-purple-600" /> Mess Billing & Reconciliation
        </h2>

        <p className="text-md text-gray-600 mb-5 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
          Next unpaid period starts from:{" "}
          <span className="font-bold text-yellow-800">
            {nextStart ? new Date(nextStart).toLocaleDateString() : todayDate}
          </span>
          . Please select a range ending on or after this date.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">

          {/* Date Pickers */}
          <StyledFlatpickr
            placeholder="Start Date"
            options={{ maxDate: todayDate }}
            value={range.from || nextStart || todayDate}
            onChange={(d) =>
              setRange({ ...range, from: formatLocalDate(d[0]) })
            }
          />

          <StyledFlatpickr
            placeholder="End Date (Inclusive)"
            options={{ maxDate: todayDate }}
            value={range.to}
            onChange={(d) =>
              setRange({ ...range, to: formatLocalDate(d[0]) })
            }
          />

          {/* Price Input */}
          <div className="relative">
            <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="number"
              placeholder="Price per Plate"
              className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-sm font-medium"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculateBill}
            disabled={isCalculating || !range.from || !range.to || !price}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:bg-purple-300"
          >
            {isCalculating ? <FaSpinner className="animate-spin" /> : <FaRupeeSign />}
            {isCalculating ? "Calculating..." : "Calculate Bill"}
          </button>
        </div>

        {/* Bill Results and Payment Button */}
        {bill && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 mt-4 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-purple-800 font-semibold">
                Billing Period: {bill.startDate} to {bill.endDate} (@ {formatCurrency(bill.platePrice)}/plate)
              </p>
              <p className="text-xl font-bold text-purple-900 mt-1">
                Total Plates: <span className="text-2xl">{bill.total_plates}</span>
              </p>
              <p className="text-3xl font-extrabold text-purple-900 mt-1">
                Total Amount: {formatCurrency(bill.total_amount)}
              </p>
            </div>
            <button
              onClick={handleSavePayment}
              disabled={isPaying}
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-green-700 transition-colors disabled:bg-green-400"
            >
              {isPaying ? <FaSpinner className="animate-spin" /> : <FaPlusCircle />}
              {isPaying ? "Saving Payment..." : "Record Payment"}
            </button>
          </motion.div>
        )}
      </div>

      {/* --- RECENT HISTORY & PAYMENT HISTORY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 1. Recent Mess History */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-5 text-gray-700 flex items-center">
            <FaHistory className="mr-3 text-indigo-600" /> Recent Daily Counts
          </h2>

          {loadingHistory ? (
            <div className="p-10 text-center"><FaSpinner className="animate-spin text-3xl text-indigo-500 mx-auto" /></div>
          ) : (
            <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 sticky top-0 border-b">
                  <tr>
                    {["Date", "Jain", "Non-Jain", "Total"].map(h => (
                      <th key={h} className="p-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.length === 0 ? (
                    <tr><td colSpan="4" className="p-3 text-center text-gray-500">No recent records found.</td></tr>
                  ) : (
                    recentHistory.map((h, i) => (
                      <tr key={i} className="border-b hover:bg-indigo-50/30 transition-colors">
                        <td className="p-3 font-medium">  {formatDate(h.date)}</td>
                        <td className="p-3 text-green-700">{h.jain_count}</td>
                        <td className="p-3 text-blue-700">{h.non_jain_count}</td>
                        <td className="p-3 font-bold text-gray-800">{h.jain_count + h.non_jain_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Payment History */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-5 text-gray-700 flex items-center">
            <FaHistory className="mr-3 text-green-600" /> Payment Records
          </h2>

          {loadingHistory ? (
            <div className="p-10 text-center"><FaSpinner className="animate-spin text-3xl text-green-500 mx-auto" /></div>
          ) : (
            <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 sticky top-0 border-b">
                  <tr>
                    {["Period", "Plates", "Rate", "Amount", "Paid On"].map(h => (
                      <th key={h} className="p-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-3 text-center text-gray-500">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b hover:bg-green-50/30 transition-colors
                   md:table-row block md:border-0 mb-4 md:mb-0"
                      >
                        {/* Period */}
                        <td className="p-3 text-xs font-medium block md:table-cell">
                          <span className="md:hidden text-gray-500 font-semibold block mb-1">
                            Period
                          </span>
                          {formatDate(p.from_date)}
                          <span className="text-gray-400 mx-1">to</span>
                          {formatDate(p.to_date)}
                        </td>

                        {/* Plates */}
                        <td className="p-3 block md:table-cell">
                          <span className="md:hidden text-gray-500 font-semibold block mb-1">
                            Plates
                          </span>
                          {p.total_plates}
                        </td>

                        {/* Rate */}
                        <td className="p-3 text-gray-700 block md:table-cell">
                          <span className="md:hidden text-gray-500 font-semibold block mb-1">
                            Rate
                          </span>
                          {formatCurrency(p.price_per_plate)}
                        </td>

                        {/* Amount */}
                        <td className="p-3 font-bold text-green-800 block md:table-cell">
                          <span className="md:hidden text-gray-500 font-semibold block mb-1">
                            Amount
                          </span>
                          {formatCurrency(p.total_amount)}
                        </td>

                        {/* Paid On */}
                        <td className="p-3 text-xs block md:table-cell">
                          <span className="md:hidden text-gray-500 font-semibold block mb-1">
                            Paid On
                          </span>
                          {formatDate(p.paid_on)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

        {/* --- DETAILED ANALYSIS --- */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
            <FaHistory className="mr-3 text-purple-600" />
            Detailed Mess Analysis
          </h2>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StyledFlatpickr
              placeholder="From Date"
              value={analysisRange.from}
              options={{ maxDate: todayDate }}
              onChange={(d) =>
                setAnalysisRange({ ...analysisRange, from: formatLocalDate(d[0]) })
              }
            />

            <StyledFlatpickr
              placeholder="To Date"
              value={analysisRange.to}
              options={{ maxDate: todayDate }}
              onChange={(d) =>
                setAnalysisRange({ ...analysisRange, to: formatLocalDate(d[0]) })
              }
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="p-4 bg-green-50 rounded-xl border">
              <p className="text-sm text-green-700 font-semibold">Total Jain</p>
              <p className="text-3xl font-extrabold text-green-800">{analysisData.totalJain}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border">
              <p className="text-sm text-blue-700 font-semibold">Total Non-Jain</p>
              <p className="text-3xl font-extrabold text-blue-800">{analysisData.totalNonJain}</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border">
              <p className="text-sm text-indigo-700 font-semibold">Total Plates</p>
              <p className="text-3xl font-extrabold text-indigo-800">{analysisData.totalPlates}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border">
              <p className="text-sm text-purple-700 font-semibold">Total Paid</p>
              <p className="text-3xl font-extrabold text-purple-800">
                {formatCurrency(analysisData.totalPaid)}
              </p>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Count Details */}
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Daily Plate Breakdown</h3>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Jain</th>
                      <th className="p-2">Non-Jain</th>
                      <th className="p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((h, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{formatDate(h.date)}</td>
                        <td className="p-2">{h.jain_count}</td>
                        <td className="p-2">{h.non_jain_count}</td>
                        <td className="p-2 font-semibold">
                          {h.jain_count + h.non_jain_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Payment Details</h3>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="p-2">Period</th>
                      <th className="p-2">Plates</th>
                      <th className="p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          {formatDate(p.from_date)} – {formatDate(p.to_date)}
                        </td>
                        <td className="p-2">{p.total_plates}</td>
                        <td className="p-2 font-semibold text-green-700">
                          {formatCurrency(p.total_amount)}
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