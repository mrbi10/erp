import React, { useState } from "react";
import { Layout, Dropdown, Menu, Badge, Button } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import Login from "./Login";
import logo from "../assests/logo2.png";
import { Link, useLocation, useNavigate } from "react-router-dom";

const { Header } = Layout;

export default function PremiumHeader({
  user,
  onLogin,
  onLogout,
  onHamburgerClick,
}) {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    onLogin(userData);
    setShowLogin(false);
  };

  const handleBackClick = () => navigate(-1);
  const handleLogoutClick = () => onLogout();

  const userMenu = (
    <Menu
      items={[
        {
          key: "logout",
          label: "Logout",
          icon: <LogoutOutlined style={{ color: "red" }} />,
          onClick: handleLogoutClick,
        },
      ]}
    />
  );

  const isMobile = window.innerWidth <= 768;
  const shouldShowLogin =
    showLogin && location.pathname !== "/forgotpassword";

  return (
    <>
      <Header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1c3faa",
          zIndex: 50,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          color: "#fff",
        }}
      >
        {/* LEFT SECTION */}
        <div
          className="header-left"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Back Button */}
          {location.pathname !== "/" && (
            <Button
              type="text"
              onClick={handleBackClick}
              icon={
                <ArrowLeftOutlined style={{ color: "#fff", fontSize: 18 }} />
              }
            />
          )}

          {/* Logo */}
          <Link to="/home">
            <img
              src={logo}
              alt="MNMJEC"
              style={{
                height: 42,
                width: "auto",
                background: "#fff",
                padding: 4,
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
          </Link>

          {/* Title (hide on small screens) */}
          <Link to="/home" style={{ textDecoration: "none" }}>
            <span
              className="header-logo-text"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              MNMJEC
            </span>
          </Link>
          {user && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 22, color: "#fff" }} />}
              onClick={() => {
                onHamburgerClick();
              }}
            />
          )}


        </div>


        {/* RIGHT SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Notification */}

          {/* {user && (

            <Badge dot>
              <BellOutlined
                style={{
                  fontSize: 20,
                  color: "#fff",
                  cursor: "pointer",
                }}
              />
            </Badge>

          )} */}

          {/* User Dropdown */}
          {user ? (
            <Dropdown overlay={userMenu} trigger={["click"]}>
              <Button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                  color: "#1c3faa",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "4px 12px",
                  border: "none",
                }}
              >
                <UserOutlined />
                <span
                  style={{
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                >
                  {user.name}
                </span>
                <DownOutlined />
              </Button>
            </Dropdown>
          ) : (
            <Button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                color: "#1c3faa",
                background: "#fff",
                borderRadius: 8,
                padding: "4px 12px",
                border: "none",
              }}
              onClick={() => setShowLogin(true)}
            >
              <UserOutlined />
              Sign In
            </Button>
          )}
        </div>
      </Header>

      {shouldShowLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
