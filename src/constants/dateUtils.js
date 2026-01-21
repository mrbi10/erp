// src/utils/dateUtils.js

/* ---------- Core ---------- */

export function now() {
  return new Date();
}

const pad = (n) => String(n).padStart(2, "0");

/* ---------- Conversions ---------- */

/**
 * Local Date → MySQL UTC datetime
 * Output: YYYY-MM-DD HH:mm:ss
 */
export function toMysqlDatetime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;

  return (
    date.getUTCFullYear() +
    "-" +
    pad(date.getUTCMonth() + 1) +
    "-" +
    pad(date.getUTCDate()) +
    " " +
    pad(date.getUTCHours()) +
    ":" +
    pad(date.getUTCMinutes()) +
    ":" +
    pad(date.getUTCSeconds())
  );
}

/**
 * Parse MySQL UTC datetime → Date
 * Accepts: "YYYY-MM-DD HH:mm:ss"
 */
export function parseUTC(value) {
  if (!value) return null;

  if (value.includes("T")) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse datetime-local input → Date (local)
 * Input: YYYY-MM-DDTHH:mm
 */
export function parseLocalDateTime(value) {
  if (!value) return null;

  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;

  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  return new Date(y, m - 1, d, hh, mm, 0);
}

/* ---------- Formatting ---------- */

/**
 * Date → datetime-local input value
 * Output: YYYY-MM-DDTHH:mm
 */
export function toLocalDateTimeInput(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

/**
 * Date → IST display string
 */
export function formatIST(date) {
  if (!(date instanceof Date)) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ---------- Helpers ---------- */

export function addMinutes(date, minutes) {
  if (!(date instanceof Date)) return null;
  return new Date(date.getTime() + minutes * 60000);
}

export function addHours(date, hours) {
  if (!(date instanceof Date)) return null;
  return new Date(date.getTime() + hours * 60 * 60000);
}


export function formatSubmittedAt(value) {
  if (!value) return "-";

  // "2026-01-21T12:39:58.000Z"
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return "-";

  const [hh, mm] = timePart.split(":");

  const [yyyy, mmDate, dd] = datePart.split("-");

  const date = `${dd} ${new Date(`${yyyy}-${mmDate}-01`).toLocaleString("en-IN", {
    month: "short",
  })} ${yyyy}`;

  return `${date}, ${hh}:${mm}`;
}
