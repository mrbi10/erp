import React, { useEffect, useState } from "react";
import { FaFilter, FaUsers, FaSearch, FaEye } from "react-icons/fa";
import { BASE_URL } from "../../constants/API";
import { useNavigate } from "react-router-dom";
import Select from "react-select";


export default function FeesList({ user }) {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    dept_id: "",
    year: "",
    jain: "",
    bus: "",
    hostel: "",
    search: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState([]);
  const [filteredYears, setFilteredYears] = useState([]);

  const allowDept = ["Principal", "F&A", "HOD", "Staff", "CA"].includes(user?.role);
  const allowYear = ["Principal", "F&A", "HOD", "CA"].includes(user?.role);

  const token = localStorage.getItem("token");

  // Fetch classes from backend (for year filter)
  const fetchClasses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setClasses(json);
    } catch (err) {
      console.log(err);
    }
  };

 const deptOptions = [
  { value: "1", label: "CSE" },
  { value: "2", label: "IT" },
  { value: "3", label: "ADS" },
  { value: "4", label: "CSBS" },
  { value: "5", label: "ECE" },
  { value: "6", label: "EEE" },
  { value: "7", label: "MECH" },
  { value: "8", label: "CIVIL" },
];

  const yearOptions = filteredYears.map((yr) => ({
    value: yr,
    label: `${yr} Year`
  }));

  const jainOptions = [
    { value: "1", label: "Jain" },
    { value: "0", label: "Non-Jain" },
  ];

  const busOptions = [
    { value: "1", label: "Bus Student" },
    { value: "0", label: "No Bus" },
  ];

  const hostelOptions = [
    { value: "1", label: "Hosteller" },
    { value: "0", label: "Day Scholar" },
  ];


  // Auto-update year options based on dept_id
  useEffect(() => {
    if (!filters.dept_id) {
      setFilteredYears([]);
      return;
    }

    const deptClasses = classes.filter((c) => c.dept_id == filters.dept_id);
    const uniqueYears = [...new Set(deptClasses.map((c) => c.year))];
    setFilteredYears(uniqueYears);
  }, [filters.dept_id, classes]);

  // Build query only with non-empty filters
  const buildQuery = () => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null) q.append(key, value);
    });
    return q.toString();
  };

  // Fetch fees list
  const fetchData = async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const url = `${BASE_URL}/fees/list${query ? "?" + query : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  // On component load → fetch classes + table
  useEffect(() => {
    fetchClasses();
    fetchData();
  }, []);

  // Auto-fetch when filters change (no Apply button needed)
  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 mb-6 rounded-xl shadow-lg border-t-4 border-green-600">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <FaUsers className="text-green-600 mr-3" /> Fees List
        </h1>
        <p className="text-gray-600 mb-4">
          Filter fee details based on your role.
        </p>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {allowDept && (
            <Select
              options={deptOptions}
              placeholder="Department"
              value={deptOptions.find(o => o.value === filters.dept_id) || null}
              onChange={(val) =>
                setFilters({ ...filters, dept_id: val?.value || "", year: "" })
              }
            />
          )}

          {allowYear && (
            <Select
              options={yearOptions}
              placeholder="Year"
              value={yearOptions.find(o => o.value === filters.year) || null}
              onChange={(val) =>
                setFilters({ ...filters, year: val?.value || "" })
              }
            />
          )}

          <Select
            options={jainOptions}
            placeholder="Jain / Non-Jain"
            value={jainOptions.find(o => o.value === filters.jain) || null}
            onChange={(val) =>
              setFilters({ ...filters, jain: val?.value || "" })
            }
          />

          <Select
            options={busOptions}
            placeholder="Bus"
            value={busOptions.find(o => o.value === filters.bus) || null}
            onChange={(val) =>
              setFilters({ ...filters, bus: val?.value || "" })
            }
          />

          <Select
            options={hostelOptions}
            placeholder="Hostel"
            value={hostelOptions.find(o => o.value === filters.hostel) || null}
            onChange={(val) =>
              setFilters({ ...filters, hostel: val?.value || "" })
            }
          />

        </div>


        {/* RESET */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              setFilters({
                dept_id: "",
                year: "",
                jain: "",
                bus: "",
                hostel: "",
                search: "",
              })
            }
            className="px-5 py-3 bg-gray-200 rounded-lg shadow"
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Students</h2>

          <div className="flex items-center gap-3">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              className="p-2 border rounded-lg"
              placeholder="Search by Reg No / Name"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Reg No</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Semester Fee</th>
                  <th className="p-3 border">Hostel Fee</th>
                  <th className="p-3 border">Transport Fee</th>
                  <th className="p-3 border">Action</th>
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-600">
                      No records found
                    </td>
                  </tr>
                ) : (
                  data.map((s, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="p-3 border">{s.reg_no}</td>
                      <td className="p-3 border">{s.name}</td>
                      <td className="p-3 border">₹{s.semester_fee ?? 0}</td>
                      <td className="p-3 border">
                        {s.hostel ? `₹${s.hostel_fee ?? 0}` : "-"}
                      </td>
                      <td className="p-3 border">
                        {s.bus ? `₹${s.transport_fee ?? 0}` : "-"}
                      </td>

                      <td
                        className="p-3 border text-blue-600 cursor-pointer underline flex items-center justify-center"
                        onClick={() =>
                          navigate(`/erp/fees/student/${s.reg_no}`)
                        }
                      >
                        <FaEye className="mr-1" /> View
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
  );
}
