import React, { useEffect, useState, useMemo } from "react";
import {
  Tree,
  Table,
  Select,
  Checkbox,
  Button,
  Input,
  Form,
  Row,
  Col,
  Card,
  message,
  Typography,
  Divider,
  Empty,
  Tooltip,
  Tag,
  Space,
} from "antd";

import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined
} from "@ant-design/icons";

import {
  ShieldCheck,
  Settings2,
  LayoutGrid,
  UserCog,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../constants/API";

const { Title, Text } = Typography;
const { Option } = Select;

export default function MenuPermissionManager() {
  const token = localStorage.getItem("token");

  // State
  const [menus, setMenus] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [form] = Form.useForm();

  /* =================================
     LOAD INITIAL DATA
  ================================= */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadMenus(), loadRoles(), loadPermissions()]);
      } catch (err) {
        message.error("Failed to fetch initial configuration");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  async function loadMenus() {
    const res = await fetch(`${BASE_URL}/menu/menus`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMenus(buildTree(data));
  }

  async function loadRoles() {
    const res = await fetch(`${BASE_URL}/menu/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRoles(Array.isArray(data) ? data : data.roles || []);
  }

  async function loadPermissions() {
    const res = await fetch(`${BASE_URL}/menu/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const perms = Array.isArray(data) ? data : data.permissions || [];
    setPermissions(perms);
  }

  function buildTree(data) {
    if (!Array.isArray(data)) return [];
    const map = {};
    const roots = [];
    data.forEach((m) => {
      map[m.menu_id] = { ...m, title: m.menu_name, key: m.menu_id, children: [] };
    });
    data.forEach((m) => {
      if (m.parent_id && map[m.parent_id]) {
        map[m.parent_id].children.push(map[m.menu_id]);
      } else {
        roots.push(map[m.menu_id]);
      }
    });
    return roots;
  }

  /* =================================
     EVENT HANDLERS (LOGIC PRESERVED)
  ================================= */
  const onMenuSelect = (keys, info) => {
    if (!info.node) {
      setSelectedMenu(null);
      form.resetFields();
      return;
    }
    const menu = info.node;
    setSelectedMenu(menu);
    form.setFieldsValue(menu);
  };

  const handleResetForm = () => {
    setSelectedMenu(null);
    form.resetFields();
  };

  async function saveMenu(values) {
    const url = selectedMenu
      ? `${BASE_URL}/menu/menus/${selectedMenu.menu_id}`
      : `${BASE_URL}/menu/menus`;
    const method = selectedMenu ? "PUT" : "POST";

    try {
      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      message.success(`Menu ${selectedMenu ? "updated" : "created"} successfully`);
      handleResetForm();
      loadMenus();
    } catch (e) {
      message.error("Save operation failed");
    }
  }

  async function deleteMenu() {
    if (!selectedMenu) return;
    try {
      await fetch(`${BASE_URL}/menu/menus/${selectedMenu.menu_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Menu deleted successfully");
      handleResetForm();
      loadMenus();
    } catch (e) {
      message.error("Delete operation failed");
    }
  }

  async function loadRolePermissions(roleId) {
    setSelectedRole(roleId);
    const res = await fetch(`${BASE_URL}/menu/roles/${roleId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRolePermissions(Array.isArray(data) ? data.map((p) => p.permission_id) : []);
  }

  async function updateRolePermissions(list) {
    if (!selectedRole) return;
    setRolePermissions(list);
    await fetch(`${BASE_URL}/menu/roles/${selectedRole}/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions: list }),
    });
    message.info("Permissions synced");
  }

  async function searchUser() {
    const res = await fetch(`${BASE_URL}/menu/users/search?q=${userSearch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.length) {
      message.warning("No user found");
      return;
    }
    const user = data[0];
    setSelectedUser(user);
    loadUserPermissions(user.user_id);
  }

  async function loadUserPermissions(userId) {
    const res = await fetch(`${BASE_URL}/menu/users/${userId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUserPermissions(Array.isArray(data) ? data.map((p) => p.permission_id) : []);
  }

  async function updateUserPermissions(list) {
    setUserPermissions(list);
    await fetch(`${BASE_URL}/menu/users/${selectedUser.user_id}/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions: list }),
    });
  }

  /* =================================
     COLUMNS
  ================================= */
  const commonColumns = (currentList, updateFn) => [
    {
      title: "Permission Key",
      dataIndex: "permission_key",
      render: (text) => <code className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{text}</code>,
    },
    {
      title: "Grant",
      align: "center",
      width: 80,
      render: (_, record) => (
        <Checkbox
          checked={currentList.includes(record.permission_id)}
          onChange={(e) => {
            const newList = e.target.checked
              ? [...currentList, record.permission_id]
              : currentList.filter((p) => p !== record.permission_id);
            updateFn(newList);
          }}
        />
      ),
    },
  ];

  /* =================================
     RENDER
  ================================= */
  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <Title level={2} className="!mb-1">Access Control</Title>
          <Text type="secondary">Manage navigation menus, role-based access, and user overrides.</Text>
        </div>
        <Tag color="blue" className="px-3 py-1 rounded-full border-none font-medium">System Admin</Tag>
      </header>

      <Row gutter={[24, 24]}>
        {/* COLUMN 1: NAVIGATION TREE */}
        <Col xs={24} lg={7}>
          <Card 
            title={<div className="flex items-center gap-2"><LayoutGrid size={18}/> Menu Structure</div>}
            className="shadow-sm border-0 h-full rounded-xl"
            extra={<Button size="small" icon={<PlusOutlined />} onClick={handleResetForm}>New</Button>}
          >
            <div className="max-h-[700px] overflow-auto">
              <Tree
                showIcon
                blockNode
                className="modern-tree"
                treeData={menus}
                onSelect={onMenuSelect}
                selectedKeys={selectedMenu ? [selectedMenu.menu_id] : []}
                defaultExpandAll
              />
              {menus.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No menus found" />}
            </div>
          </Card>
        </Col>

        {/* COLUMN 2: EDITOR & ROLE PERMS */}
        <Col xs={24} lg={9}>
          <Space direction="vertical" className="w-full" size={24}>
            {/* MENU EDITOR */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card 
                className="shadow-md border-0 rounded-xl"
                title={
                  <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-blue-500"/>
                    {selectedMenu ? "Edit Menu" : "Create New Menu"}
                  </div>
                }
              >
                <Form form={form} layout="vertical" onFinish={saveMenu} requiredMark={false}>
                  <Row gutter={12}>
                    <Col span={14}>
                      <Form.Item name="menu_name" label="Label" rules={[{ required: true }]}>
                        <Input placeholder="Dashboard" />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item name="display_order" label="Order">
                        <Input type="number" placeholder="0" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="route" label="Route Path">
                    <Input placeholder="/admin/dashboard" />
                  </Form.Item>

                  <Form.Item name="icon" label="Icon Identifier">
                    <Input placeholder="home-icon" />
                  </Form.Item>

                  <Form.Item name="permission_id" label="Linked Permission">
                    <Select allowClear placeholder="Select associated permission">
                      {permissions.map((p) => (
                        <Option key={p.permission_id} value={p.permission_id}>
                          {p.permission_key}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Divider className="my-4" />

                  <div className="flex justify-between gap-3">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />} 
                      className="bg-blue-600 flex-1 h-10 rounded-lg shadow-sm"
                    >
                      {selectedMenu ? "Update Menu" : "Create Menu"}
                    </Button>
                    
                    {selectedMenu && (
                      <Tooltip title="Permanently Delete">
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={deleteMenu}
                          className="h-10 rounded-lg"
                        />
                      </Tooltip>
                    )}
                  </div>
                </Form>
              </Card>
            </motion.div>

            {/* ROLE PERMISSIONS */}
            <Card 
              className="shadow-sm border-0 rounded-xl"
              title={<div className="flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-500"/> Role Mapping</div>}
            >
              <Select
                className="w-full mb-4 h-10 rounded-lg overflow-hidden"
                placeholder="Select Role to Edit"
                onChange={loadRolePermissions}
                value={selectedRole}
              >
                {roles.map((r) => (
                  <Option key={r.role_id} value={r.role_id}>{r.role_name}</Option>
                ))}
              </Select>

              <Table
                size="small"
                columns={commonColumns(rolePermissions, updateRolePermissions)}
                dataSource={permissions}
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
                rowKey="permission_id"
                className="border rounded-lg overflow-hidden"
              />
            </Card>
          </Space>
        </Col>

        {/* COLUMN 3: USER OVERRIDES */}
        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm border-0 h-full rounded-xl"
            title={<div className="flex items-center gap-2"><UserCog size={18} className="text-purple-500"/> User Overrides</div>}
          >
            <div className="mb-6">
              <Input.Search
                placeholder="Search user by email or ID..."
                size="large"
                enterButton={<SearchOutlined />}
                onSearch={searchUser}
                onChange={(e) => setUserSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between mb-6">
                    <div>
                      <Text strong className="text-purple-900 text-lg block">{selectedUser.name}</Text>
                      <Text type="secondary" className="text-xs uppercase tracking-wider">Target User Selected</Text>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                      {selectedUser.name?.[0]}
                    </div>
                  </div>

                  <Title level={5} className="!mb-4 flex items-center gap-2">
                    <ChevronRight size={16} /> Individual Permissions
                  </Title>
                  
                  <Table
                    size="small"
                    columns={commonColumns(userPermissions, updateUserPermissions)}
                    dataSource={permissions}
                    pagination={{ pageSize: 10 }}
                    rowKey="permission_id"
                    className="border rounded-lg overflow-hidden shadow-inner"
                  />
                </motion.div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="bg-slate-50 p-6 rounded-full mb-4">
                    <SearchOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
                  </div>
                  <Text type="secondary" className="max-w-[200px] inline-block text-center">
                    Search for a user to manage individual permission overrides.
                  </Text>
                </div>
              )}
            </AnimatePresence>
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .modern-tree .ant-tree-node-content-wrapper {
          padding: 6px 8px !important;
          border-radius: 6px !important;
          transition: all 0.2s;
        }
        .modern-tree .ant-tree-node-selected {
          background-color: #e6f0ff !important;
          color: #2563eb !important;
          font-weight: 600 !important;
        }
        .ant-card-head { border-bottom: 1px solid #f1f5f9 !important; min-height: 56px !important; }
        .ant-card-head-title { font-weight: 600 !important; font-size: 15px !important; color: #1e293b !important; }
        .ant-form-item-label label { font-weight: 500 !important; color: #64748b !important; }
        .search-input .ant-input-affix-wrapper { border-radius: 8px !important; }
        .search-input .ant-input-group-addon button { border-radius: 0 8px 8px 0 !important; height: 40px !important; }
      `}</style>
    </div>
  );
}