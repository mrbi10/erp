import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import {
  FaUserTie,
  FaLayerGroup,
  FaPaperPlane,
  FaSpinner
} from "react-icons/fa";

export default function ManageStaffClassAccess({ user }) {

  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    class_id: "",
    access_type: "teaching"
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const init = async () => {
      try {
        const [staffRes, classRes] = await Promise.all([
          axios.get(`${BASE_URL}/faculty`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/class`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStaff(staffRes.data || []);
        setClasses(classRes.data || []);
      } catch {
        Swal.fire("Error", "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      await axios.post(
        `${BASE_URL}/staffClassAccess`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success", "Staff assigned successfully", "success");
      setForm({ user_id: "", class_id: "", access_type: "teaching" });

    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Operation failed",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow border border-slate-200">

        <div className="p-5 border-b bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
          <FaLayerGroup className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">
            Assign Staff to Class
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Staff
            </label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose staff</option>
              {staff.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Class
            </label>
            <select
              name="class_id"
              value={form.class_id}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose class</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Access Type
            </label>
            <select
              name="access_type"
              value={form.access_type}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="teaching">Teaching</option>
              <option value="ca">Class Advisor</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-70"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Assign Staff
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
