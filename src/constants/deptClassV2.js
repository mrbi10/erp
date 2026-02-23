import { BASE_URL } from "./API";

export const DEPT_MAP = {};
export const CLASS_MAP = {};
export const yearoptions = [];

export const loadDeptClass = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/deptclass/meta`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  Object.keys(DEPT_MAP).forEach(k => delete DEPT_MAP[k]);
  Object.keys(CLASS_MAP).forEach(k => delete CLASS_MAP[k]);
  yearoptions.length = 0;

  Object.assign(DEPT_MAP, data.DEPT_MAP || {});
  Object.assign(CLASS_MAP, data.CLASS_MAP || {});
  yearoptions.push(...(data.yearoptions || []));
};

console.log("DEPT_MAP", DEPT_MAP);
console.log("CLASS_MAP", CLASS_MAP);
console.log("yearoptions", yearoptions);