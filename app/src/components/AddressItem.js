import { Button, Row } from "antd";
import * as anchor from "@project-serum/anchor";
import solscan from "../images/solscan.png";

const AddressItem = ({ address }) => {
  const key = new anchor.web3.PublicKey(address);
  const keyBase58 = key.toBase58();

  const getCollapsedAddress = () => {
    return (
      keyBase58.substring(0, 5) +
      "..." +
      keyBase58.substring(keyBase58.length - 5)
    );
  };

  const onOpenSolscan = () => {
    window.open(
      `https://explorer.solana.com/address/${keyBase58}?cluster=devnet`
    );
  };

  return (
    <Row align="middle">
      <Button type="link" onClick={() => onOpenSolscan()}>
        <img src={solscan} width={20} height={20} />
      </Button>
      {getCollapsedAddress()}
    </Row>
  );
};

export default AddressItem;
