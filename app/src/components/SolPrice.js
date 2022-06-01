import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Row } from "antd";
import React from "react";
import solImage from "../images/sol.png";

const SolPrice = ({ price, imageSize = 30, textSize = 40, padding = 10 }) => {
  const sol = price / LAMPORTS_PER_SOL;
  return (
    <Row justify="center" align="middle">
      <img src={solImage} width={imageSize} height={imageSize} />
      <span
        style={{
          fontSize: textSize,
          fontWeight: "600",
          marginLeft: padding,
        }}
      >
        {sol}
      </span>
    </Row>
  );
};

export default SolPrice;
