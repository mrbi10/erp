import { useEffect, useRef, useState } from "react";
import {
  AppstoreOutlined,
  IdcardOutlined,
  BookOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  NotificationOutlined,
  CoffeeOutlined,
  UserOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarRangeIcon } from "lucide-react";
import { FaComment, FaUserGraduate } from "react-icons/fa";
import { BASE_URL } from "../constants/API";

const iconMap = {
  AppstoreOutlined: <AppstoreOutlined />,
  IdcardOutlined: <IdcardOutlined />,
  BookOutlined: <BookOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  TeamOutlined: <TeamOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  CustomerServiceOutlined: <CustomerServiceOutlined />,
  NotificationOutlined: <NotificationOutlined />,
  CoffeeOutlined: <CoffeeOutlined />,
  UserOutlined: <UserOutlined />,
  CreditCardOutlined: <CreditCardOutlined />,
  CalendarRangeIcon: <CalendarRangeIcon />,
  FaComment: <FaComment />,
  FaUserGraduate: <FaUserGraduate />
};

export default function Sidebar({ open, onClose }) {

  const sidebarRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const [links, setLinks] = useState([]);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    async function loadMenus() {
      try {

        const token = localStorage.getItem("token");

        const res = await fetch(`${BASE_URL}/menu/my-menu`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        const formatted = data.menus.map(menu => ({
          key: menu.route,
          label: menu.menu_name,
          icon: iconMap[menu.icon] || <AppstoreOutlined />
        }));

        setLinks(formatted);

      } catch (err) {
        console.error("Sidebar menu load failed:", err);
      }
    }

    loadMenus();
  }, []);

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

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={onClose}
        />
      )}

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
        <div
          className="h-16 flex items-center px-4 border-b border-slate-700 text-lg font-bold"
          style={{ whiteSpace: "nowrap" }}
        >
          {(!isMobile && open) || isMobile ? "MNMJEC ERP" : ""}
        </div>

        <nav className="mt-3 flex flex-col">
          {links.map((item) => {

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
                <span className="text-xl">{item.icon}</span>

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