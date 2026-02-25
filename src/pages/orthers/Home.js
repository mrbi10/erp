import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  GlobeAsiaAustraliaIcon,
  RectangleGroupIcon,
  BookOpenIcon,
} from "@heroicons/react/24/solid";

const portalAreas = [
  { title: "Student Dashboard", icon: AcademicCapIcon },
  { title: "Faculty Management", icon: UserGroupIcon },
  { title: "Admin & HOD Services", icon: ChartBarIcon },
  { title: "Academic Calendar", icon: CalendarDaysIcon },
];

export default function Home() {

  // Structured Data Injection (React 19 Safe)
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollegeOrUniversity",
      name: "Misrimal Navajee Munoth Jain Engineering College",
      alternateName: "MNMJEC",
      url: window.location.origin,
      sameAs: ["https://mnmjec.ac.in"]
    });

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen leading-relaxed overflow-auto">

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-50 to-white opacity-60" />

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-blue-700"
        >
          MNMJEC ERP Portal 
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="max-w-4xl mt-6 text-lg sm:text-xl text-gray-700"
        >
          The official ERP platform of MNMJEC providing secure student login,
          faculty access, attendance tracking, internal marks management,
          academic calendar updates, placement training coordination,
          examination processing, and institutional administration.
        </motion.p>
      </section>

      {/* METRICS */}
      <section className="max-w-6xl mx-auto px-6 mt-10 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { label: "Students", value: "1000+" },
            { label: "Faculty Members", value: "100+" },
            { label: "Courses & Programs", value: "8+" },
            { label: "Years of Legacy", value: "30+" }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center border shadow-sm"
            >
              <p className="text-3xl font-bold text-blue-700">{s.value}</p>
              <p className="mt-1 text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-blue-700">
          MNMJEC ERP Login Access
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {portalAreas.map((area, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col items-center"
            >
              <area.icon className="w-12 h-12 mb-4 text-blue-600" />
              <p className="font-semibold text-center text-lg text-gray-800">
                {area.title}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SEO CONTENT BLOCK */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          MNMJEC Student and Faculty ERP Portal
        </h2>

        <p className="text-gray-700 text-lg leading-relaxed mb-4">
          The MNMJEC ERP Portal serves as the centralized academic and
          administrative system of Misrimal Navajee Munoth Jain Engineering College.
          It enables student login, faculty login, attendance monitoring,
          internal assessment tracking, academic scheduling, departmental
          coordination, placement training management, and institutional reporting.
        </p>

        <p className="text-gray-700 text-lg leading-relaxed">
          Designed to improve transparency and operational efficiency,
          the MNMJEC ERP integrates digital workflows across departments,
          ensuring secure access and structured academic governance
          for students, faculty members, Heads of Department,
          and administrative authorities.
        </p>
      </section>

    </div>
  );
}