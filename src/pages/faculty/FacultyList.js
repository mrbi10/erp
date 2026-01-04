import React, { useEffect, useState, useMemo } from "react";
import { BASE_URL } from "../../constants/API";
import Swal from "sweetalert2";
import Select from "react-select";
import { FaUserTie, FaChalkboardTeacher, FaUserTag } from "react-icons/fa";


  const DEPT_MAP = {
    1: "CSE",
    2: "IT",
    3: "ADS",
    4: "CSBS",
    5: "ECE",
    6: "EEE",
    7: "MECH",
    8: "CIVIL",
  };

const getOrdinalSuffix = (n) => {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const romanMap = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
};

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchFaculty = async (currentPage = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/faculty?page=${currentPage}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setFaculty(data.users);
        setTotalPages(data.totalPages || 1);
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to load faculty data",
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Something went wrong while fetching faculty data",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty(page);
  }, [page]);

  useEffect(() => {
    let data = faculty;

    if (deptFilter !== "All") {
      data = data.filter((f) => String(DEPT_MAP[f.dept_id]) === deptFilter);
    }

    if (roleFilter !== "All") {
      data = data.filter((f) => f.role === roleFilter);
    }

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.name.toLowerCase().includes(s) ||
          f.email.toLowerCase().includes(s)
      );
    }

    setFilteredFaculty(data);
  }, [deptFilter, roleFilter, search, faculty]);

  const departments = useMemo(() => {
    const unique = [...new Set(faculty.map((f) => DEPT_MAP[f.dept_id]).filter(Boolean))];
    return unique.sort((a, b) => a - b);
  }, [faculty]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading Faculty List...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 mb-3 md:mb-0">
          Faculty List
        </h1>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Department Filter */}
          <div className="min-w-[200px]">
            <Select
              value={
                deptFilter === "All"
                  ? { value: "All", label: "All Departments" }
                  : { value: deptFilter, label: `Dept ${deptFilter}` }
              }
              onChange={(option) => setDeptFilter(option.value)}
              options={[
                { value: "All", label: "All Departments" },
                ...departments.map((dept) => ({
                  value: dept,
                  label: `Dept ${dept}`,
                })),
              ]}
              className="text-gray-700 text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  borderColor: "#d1d5db",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#3b82f6" },
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#3b82f6"
                    : state.isFocused
                      ? "#eff6ff"
                      : "white",
                  color: state.isSelected ? "white" : "#374151",
                }),
              }}
            />
          </div>

          {/* Role Filter */}
          <div className="min-w-[200px]">
            <Select
              value={
                roleFilter === "All"
                  ? { value: "All", label: "All Roles" }
                  : { value: roleFilter, label: roleFilter }
              }
              onChange={(option) => setRoleFilter(option.value)}
              options={[
                { value: "All", label: "All Roles" },
                { value: "CA", label: "CA" },
                { value: "Staff", label: "Staff" },
              ]}
              className="text-gray-700 text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  borderColor: "#d1d5db",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#3b82f6" },
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#3b82f6"
                    : state.isFocused
                      ? "#eff6ff"
                      : "white",
                  color: state.isSelected ? "white" : "#374151",
                }),
              }}
            />
          </div>

          {/* Search Box */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="border rounded-md px-3 py-2 bg-white text-gray-700 shadow-sm w-60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg transition-all">
        <table className="min-w-full border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 border text-left">S.No</th>
              <th className="px-4 py-3 border text-left">Name</th>
              <th className="px-4 py-3 border text-left">Role</th>
              <th className="px-4 py-3 border text-left">Dept</th>
              {filteredFaculty.some((f) => f.role === "CA") && (
                <th className="px-4 py-3 border text-left">CA Class</th>
              )}
              <th className="px-4 py-3 border text-left">Teaching Classes</th>
              <th className="px-4 py-3 border text-left">Email</th>
            </tr>
          </thead>

          <tbody>
            {filteredFaculty.length > 0 ? (
              filteredFaculty.map((f, index) => (
                <tr key={f.id} className="hover:bg-blue-50 transition duration-150">
                  <td className="px-4 py-3 border text-center font-medium text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3 border font-semibold text-gray-800 flex items-center gap-2">
                    <FaChalkboardTeacher className="text-blue-500" />
                    {f.name}
                  </td>

                  <td className="px-4 py-3 border">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${f.role === "CA"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                        }`}
                    >
                      {f.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 border text-gray-700 text-center">
                    {DEPT_MAP[f.dept_id] || "-"}
                  </td>

                  {filteredFaculty.some((u) => u.role === "CA") && (
                    <td className="px-4 py-3 border text-center text-gray-700">
                      {f.ca_class
                        ? `${f.ca_class}${getOrdinalSuffix(f.ca_class)} Year` || f.ca_class
                        : "—"}
                    </td>
                  )}

                  <td className="px-4 py-3 border text-center text-gray-700">
                    {f.teaching_classes
                      ? f.teaching_classes
                        .split(",")
                        .map((y) => `${y.trim()}${getOrdinalSuffix(y.trim())} Year`|| y.trim())
                        .join(", ")
                      : "—"}
                  </td>

                  <td className="px-4 py-3 border text-blue-600 font-medium">
                    <a href={`mailto:${f.email}`} className="hover:underline">
                      {f.email}
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 font-medium"
                >
                  No faculty found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 transition"
        >
          Prev
        </button>

        <span className="text-gray-700 font-medium">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FacultyList;
