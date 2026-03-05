import { BASE_URL } from "./API";

/* keep same exported names */
export const DEPT_MAP = {};
export const CLASS_MAP = {};
export const yearoptions = [];

/* prevent multiple fetches */
let loaded = false;

export const loadDeptClass = async () => {
  if (loaded) return;

  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/deptclass/meta`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  /* clear existing values (important for hot reload etc.) */
  Object.keys(DEPT_MAP).forEach(k => delete DEPT_MAP[k]);
  Object.keys(CLASS_MAP).forEach(k => delete CLASS_MAP[k]);
  yearoptions.splice(0);

  /* fill objects so references stay the same */
  Object.assign(DEPT_MAP, data.DEPT_MAP || {});
  Object.assign(CLASS_MAP, data.CLASS_MAP || {});
  yearoptions.push(...(data.yearoptions || []));

  loaded = true;
};