import React from "react";
import { motion } from "framer-motion";
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

// DATA
const portalAreas = [
  { title: "Student Dashboard", icon: AcademicCapIcon,  },
  { title: "Faculty Management", icon: UserGroupIcon,  },
  { title: "Admin & HOD Services", icon: ChartBarIcon, },
  { title: "Academic Calendar", icon: CalendarDaysIcon, }
];

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen overflow-auto">

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-50 opacity-60" />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm"
        >
          MNMJEC ERP Portal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-2xl mt-6 text-lg text-gray-700 leading-relaxed"
        >
          Your unified digital system for academic management, administration, attendance, and institutional workflows — designed for clarity and speed.
        </motion.p>
      </section>

      {/* METRICS */}
      <section className="max-w-6xl mx-auto px-6 mt-10 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[{ label: 'Students', value: '4500+' }, { label: 'Faculty', value: '300+' }, { label: 'Programs', value: '15+' }, { label: 'Years', value: '30+' }].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center border shadow-sm hover:shadow-md transition"
            >
              <p className="text-3xl font-bold text-blue-700">{s.value}</p>
              <p className="mt-1 text-gray-600 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-blue-700">Quick Access</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {portalAreas.map((area, i) => (
            <Link key={i} to={area.link}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-center"
              >
                <area.icon className="w-12 h-12 mb-4 text-blue-600" />
                <p className="font-semibold text-center text-lg text-gray-800">{area.title}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
     
    </div>
  );
}
