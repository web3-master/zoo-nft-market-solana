import { Button, Result } from "antd";

const WrongNetwork = () => {
  const onHowto = () => {
    window.open("https://docs.solana.com/wallet-guide");
  };

  return (
    <Result
      status="warning"
      title="You are not connected to Solana wallet."
      subTitle="Please connect to Solana wallet in your browser extension first!"
      extra={
        <Button type="primary" key="howto" onClick={onHowto}>
          How to do?
        </Button>
      }
    />
  );
};

export default WrongNetwork;
