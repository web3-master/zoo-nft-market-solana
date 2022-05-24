import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Menu } from "antd";
import React from "react";
import { Link } from "react-router-dom";

const AppMenu = () => {
  return (
    <Menu mode="horizontal">
      <Menu.Item key="gallery" icon={<AppstoreOutlined />}>
        Gallery
        <Link to="/gallery" />
      </Menu.Item>
      <Menu.Item key="mint" icon={<PlusOutlined />}>
        Mint
        <Link to="/mint" />
      </Menu.Item>
    </Menu>
  );
};

export default AppMenu;
