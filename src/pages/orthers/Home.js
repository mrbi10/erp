import React from "react";
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

// Static “Quick Access” blocks
const portalAreas = [
  { title: "Student Dashboard", icon: AcademicCapIcon },
  { title: "Faculty Management", icon: UserGroupIcon },
  { title: "Admin & HOD Services", icon: ChartBarIcon },
  { title: "Academic Calendar", icon: CalendarDaysIcon },
];

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen leading-relaxed overflow-auto">

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-blue-50 to-white opacity-60" />

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm"
        >
          MNMJEC ERP Portal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="max-w-3xl mt-6 text-lg sm:text-xl text-gray-700"
        >
          A unified digital platform supporting academic workflows, administration,
          attendance, faculty management, examinations, and campus operations.
          Designed for clarity, reliability, and institutional excellence.
        </motion.p>
      </section>

      {/* METRICS */}
      <section className="max-w-6xl mx-auto px-6 mt-10 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { label: "Students", value: "4500+" },
            { label: "Faculty Members", value: "300+" },
            { label: "Courses & Programs", value: "15+" },
            { label: "Years of Legacy", value: "30+" }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center border shadow-sm hover:shadow-md transition"
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
          Quick Access
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {portalAreas.map((area, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-center"
            >
              <area.icon className="w-12 h-12 mb-4 text-blue-600" />
              <p className="font-semibold text-center text-lg text-gray-800">
                {area.title}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VISION | MISSION */}
      <section className="bg-white py-20 px-6 border-t">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-3xl font-bold text-blue-700 mb-4">Vision</h3>
            <p className="text-gray-700 text-lg">
              To develop competent professionals with sound technical knowledge,
              ethical values, and commitment to societal growth, empowering
              future innovators and leaders.
            </p>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-blue-700 mb-4">Mission</h3>
            <p className="text-gray-700 text-lg">
              Providing quality education, state-of-the-art laboratories,
              industry-driven training, and a learning environment that nurtures
              creativity, research, and excellence.
            </p>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-blue-700 text-center mb-12">
          Departments at MNMJEC
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            "Computer Science and Engineering",
            "Computer Science and Business Systems",
            "Information Technology",
            "Electrical and Electronics Engineering",
            "Electronics and Communication Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Artificial Intelligence & Data Science",
            "Science and Humanities"
          ].map((dept, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-md transition"
            >
              <p className="font-semibold text-lg text-gray-800">{dept}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FACILITIES */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-6 border-t">
        <h2 className="text-4xl font-bold text-center text-blue-700 mb-12">
          Campus Facilities
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          {[
            { label: "Modern Laboratories", icon: RectangleGroupIcon },
            { label: "Central Library & Digital Resources", icon: BookOpenIcon },
            { label: "Wi-Fi Enabled Campus", icon: GlobeAsiaAustraliaIcon },
            { label: "Dedicated Research Centers", icon: BuildingOffice2Icon },
            { label: "Smart Classrooms", icon: AcademicCapIcon },
            { label: "Innovation & Entrepreneurship Cell", icon: ChartBarIcon },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-8 rounded-2xl border shadow-sm flex flex-col items-center hover:shadow-md transition"
            >
              <f.icon className="w-12 h-12 text-blue-600 mb-4" />
              <p className="font-semibold text-gray-800 text-center">{f.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-blue-700 mb-8">About MNMJEC</h2>

        <div className="space-y-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            Mohamed Sathak AJ College of Engineering (MNMJEC) is an institution
            focused on academic excellence, professional ethics, and holistic
            development. Through industry collaborations, experienced faculty,
            dedicated research centers, and modern facilities, the institution
            equips students with the knowledge and skills required to succeed in
            a rapidly evolving world.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed">
            The MNMJEC ERP Portal serves as a unified backbone for all academic and
            administrative operations. Attendance, assessments, faculty workflows,
            departmental operations, records, and institutional processes are
            streamlined into a single digital ecosystem—improving transparency,
            reducing manual effort, and enhancing efficiency across the campus.
          </p>
        </div>
      </section>




    </div>
  );
}
