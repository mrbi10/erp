import React, { useEffect, useRef } from "react";
import {
  WalletOutlined,
  AppstoreOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  SettingFilledus,
  FileDoneOutlined,
  BookOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  UserAddOutlined,
  NotificationOutlined,
  CoffeeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { CalculatorIcon, Calendar1Icon, CalendarRangeIcon, CookingPotIcon, Megaphone, Mic, Mic2Icon, Speaker, SpeakerIcon } from "lucide-react";
import { FaSpeakerDeck, FaBookOpen, FaComment, FaUserGraduate } from "react-icons/fa";
import { MdInsertComment } from "react-icons/md";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { Calendar } from "antd";

export default function Sidebar({ role, open, onClose }) {
  const sidebarRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    function handleClickOutside(e) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose();
      }
    }

    if (open && isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const links = [
    {
      key: '/dashboard',
      label: 'Dashboard',
      icon: <AppstoreOutlined />,
      roles: ['Staff', 'student', 'CA', 'HOD', 'Principal'],
    },
    {
      key: '/attendance',
      label: 'Attendance',
      icon: <CalendarRangeIcon />,
      roles: ['Staff', 'student', 'CA', 'Principal', 'HOD'],
    },
    {
      key: '/mess',
      label: 'Mess',
      icon: <CoffeeOutlined />,
      roles: ['Principal'],
    },
    {
      key: '/marks',
      label: 'Marks',
      icon: <BarChartOutlined />,
      roles: ['Staff', 'Principal', 'student', 'CA', 'HOD'],
    },
    {
      key: '/managesubjects',
      label: 'Manage Subjects',
      icon: <BookOutlined />,
      roles: ['Staff', 'Principal', 'DeptAdmin', 'CA', 'HOD'],
    },
    {
      key: '/placementtraining',
      label: 'Placement Training',
      icon: <FaUserGraduate />,
      roles: ['CA', 'student', 'trainer', 'HOD', 'Principal'],
    },

    {
      key: '/announcement',
      label: 'Announcement',
      icon: <NotificationOutlined />,
      roles: ['CA', 'student', 'HOD', 'Principal'],
    },
    {
      key: '/students',
      label: 'Students',
      icon: <TeamOutlined />,
      roles: ['CA', 'HOD', 'Principal'],
    },
    {
      key: '/faculty',
      label: 'Faculty',
      icon: <IdcardOutlined />,
      roles: ['HOD', 'DeptAdmin', 'Principal'],
    },
    {
      key: '/lateentries',
      label: 'Late Arrival',
      icon: <ClockCircleOutlined />,
      roles: ['CA', 'HOD', 'Principal'],
    },
    {
      key: '/attendancelogs',
      label: 'Attendance Logs',
      icon: <BarChartOutlined />,
      roles: ['CA', 'HOD', 'Principal'],
    },
    {
      key: '/staffaccess',
      label: 'Staff Access',
      icon: <SafetyCertificateOutlined />,
      roles: ['Principal', 'DeptAdmin', 'HOD'],
    },
    {
      key: '/SecurityLateEntry',
      label: 'Security Entry',
      icon: <SafetyCertificateOutlined />,
      roles: ['Security'],
    },
    {
      key: '/feedback',
      label: 'Feedback',
      icon: <FaComment />,
      roles: ['CA', 'student', 'DeptAdmin', 'HOD', 'Principal'],
    },
    {
      key: '/support',
      label: 'Support',
      icon: <CustomerServiceOutlined />,
      roles: ['Staff', 'student', 'DeptAdmin', 'CA', 'HOD', 'Principal', 'Admin'],
    },
    {
      key: '/profilehub',
      label: 'Profile Hub',
      icon: <UserOutlined />,
      roles: ['Staff', 'Principal', 'student', 'CA', 'HOD'],
    },
    {
      key: '/system-monitor',
      label: 'System Monitor',
      icon: <BarChartOutlined />,
      roles: ['Admin']
    }
    // {
    //   key: '/timetable',
    //   label: 'Time Table',
    //   icon: <CalendarRangeIcon />,
    //   roles: ['CA','HOD', 'Principal'],
    // },
    //  {
    //   key: '/StudentTimetable',
    //   label: 'Time Table',
    //   icon: <CalendarRangeIcon />,
    //   roles: ['student'],
    // },

    // {
    //   key: '/fees',
    //   label: 'Fees',
    //   icon: <WalletOutlined />,
    //   roles: ['Staff', 'Principal', 'F&A', 'student', 'CA', 'HOD'],
    // },


    // {
    //   key: '/reports',
    //   label: 'Reports',
    //   icon: <BarChartOutlined />,
    //   roles: ['CA', 'HOD', 'Principal'],
    // },

  ];


  const menuItems = links.filter((i) => i.roles.includes(role));

  return (
    <>
      {/* BACKDROP (MOBILE ONLY) */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`
  fixed top-0 left-0 h-full bg-slate-900 text-white z-40
  transition-all duration-300 overflow-y-auto overflow-x-hidden scrollbar-hide
          ${isMobile ? (open ? "w-64" : "w-0") : open ? "w-64" : "w-16"}
        `}
        onMouseLeave={() => {
          if (!isMobile) onClose();
        }}
      >
        {/* Header */}
        <div
          className="h-16 flex items-center px-4 border-b border-slate-700 text-lg font-bold"
          style={{ whiteSpace: "nowrap" }}
        >
          {(!isMobile && open) || isMobile ? "MNMJEC ERP" : ""}
        </div>

        {/* Menu */}
        <nav className="mt-3 flex flex-col">
          {menuItems.map((item) => {
            const active = location.pathname === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  navigate(item.key);
                  if (isMobile) onClose();
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 text-left
                  hover:bg-slate-700 transition
                  ${active ? "bg-slate-800" : ""}
                `}
              >
                {/* Icon always visible */}
                <span className="text-xl">{item.icon}</span>

                {/* Label visible only when expanded */}
                {((open && !isMobile) || isMobile) && (
                  <span className="text-base">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
