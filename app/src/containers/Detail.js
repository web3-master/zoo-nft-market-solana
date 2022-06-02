import { ShoppingCartOutlined, WalletOutlined } from "@ant-design/icons";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  InputNumber,
  notification,
  Result,
  Row,
  Skeleton,
} from "antd";
import { useForm } from "antd/lib/form/Form";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddressItem from "../components/AddressItem";
import SolPrice from "../components/SolPrice";
import CollectionContext from "../contexts/collection-context";
import { ZOO_NFT_MARKET_PROGRAM_ID } from "../data/Constants";
import ZooNftMarketIdl from "../idl/zoo_nft_market_solana.json";
import solImage from "../images/sol.png";
import * as Market from "../util/Market";

const Detail = () => {
  let navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const { metadataAddress } = useParams();
  const [metatdata, setMetadata] = useState(null);
  const collectionCtx = useContext(CollectionContext);
  const [uriData, setUriData] = useState(null);
  const [invalidItem, setInvalidItem] = useState(false);

  const [isMyNft, setIsMyNft] = useState(false);
  const [order, setOrder] = useState(null);
  const [mintKey, setMintKey] = useState(null);
  const [associatedTokenAddress, setAssociatedTokenAddress] = useState(null);

  const [createSaleForm] = useForm();

  useEffect(() => {
    const provider = new anchor.AnchorProvider(connection, wallet);
    anchor.setProvider(provider);

    const program = new Program(
      ZooNftMarketIdl,
      ZOO_NFT_MARKET_PROGRAM_ID,
      provider
    );

    setProgram(program);
  }, [connection, wallet]);

  useEffect(() => {
    if (program != null && metatdata != null) {
      getMarketInfo(metatdata);
    }
  }, [program, metatdata]);

  useEffect(() => {
    (async () => {
      var metadataItem = collectionCtx.collection.find(
        (item) => item.address == metadataAddress
      );

      if (metadataItem === undefined) {
        metadataItem = await collectionCtx.loadItemMetadata(
          connection,
          new anchor.web3.PublicKey(metadataAddress),
          false
        );
      }

      console.log("metadataItem", JSON.stringify(metadataItem));
      setMetadata(metadataItem);

      if (metadataItem !== undefined) {
        const response = await fetch(metadataItem.data.uri);
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        setUriData(json);
      } else {
        setInvalidItem(true);
      }
    })();
  }, [metadataAddress]);

  const getMarketInfo = async (metatdata) => {
    const mintKey = new anchor.web3.PublicKey(metatdata.mint.toArray("le"));
    setMintKey(mintKey);
    console.log("mintKey", mintKey.toString());

    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintKey,
      wallet.publicKey
    );
    console.log("associatedTokenAddress", associatedTokenAddress.toString());
    setAssociatedTokenAddress(associatedTokenAddress);

    //
    // Check if this item is in order.
    //
    const [orderAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("order"), mintKey.toBytes()],
      program.programId
    );

    const orderAccountInfo = await program.provider.connection.getAccountInfo(
      orderAccount
    );

    if (orderAccountInfo === null) {
      // This item is not in order.
      setOrder(null);

      const associatedTokenAccountInfo =
        await program.provider.connection.getAccountInfo(
          associatedTokenAddress
        );
      console.log("associatedTokenAccountInfo", associatedTokenAccountInfo);

      if (associatedTokenAccountInfo === null) {
        // This is not my nft.
        setIsMyNft(false);
      } else {
        const balance =
          await program.provider.connection.getTokenAccountBalance(
            associatedTokenAddress
          );

        if (balance.value.uiAmount === 1) {
          // This is my nft.
          setIsMyNft(true);
        } else {
          // This is not my nft.
          setIsMyNft(false);
        }
      }
    } else {
      // This item is in order.
      const order = await program.account.order.fetch(orderAccount);
      setOrder(order);
    }
  };

  const getTraitValue = (key) => {
    let trait = uriData.attributes.find((trait) => trait.trait_type === key);
    if (trait !== undefined) {
      return trait.value;
    }
    return "";
  };

  if (invalidItem) {
    return (
      <Result
        status="warning"
        title="Sorry, the item you visited does not exist."
        extra={
          <Button
            type="primary"
            key="console"
            onClick={() => navigate("/market")}
          >
            Go Market
          </Button>
        }
      />
    );
  }

  const renderCreateSale = () => {
    return (
      <Card title="Create Sale" style={{ marginBottom: 20 }}>
        <Form form={createSaleForm} layout="inline" onFinish={onCreateSale}>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              addonBefore={<img src={solImage} width={14} height={14} />}
              placeholder="0.0"
            />
          </Form.Item>

          <Form.Item>
            <Button
              icon={<ShoppingCartOutlined />}
              type="primary"
              htmlType="submit"
              style={{ background: "green", borderColor: "green" }}
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const onCreateSale = async (values) => {
    let { price } = values;

    const order = await Market.createOrder(
      program,
      mintKey,
      wallet.publicKey,
      associatedTokenAddress,
      "An order",
      price
    );

    if (order != null) {
      setIsMyNft(false);
      setOrder(order);

      notification["success"]({
        message: "Success",
        description: "Created a sale of this item!",
      });
    }
  };

  const renderMySale = () => {
    return (
      <Card title="Sale" style={{ marginBottom: 10 }}>
        <SolPrice price={order.price.toNumber()} />
        <Button
          type="primary"
          onClick={onCancelOffer}
          style={{ marginTop: 10, background: "red", borderColor: "red" }}
        >
          Cancel
        </Button>
      </Card>
    );
  };

  const onCancelOffer = async () => {
    const success = await Market.cancelOrder(
      program,
      mintKey,
      wallet.publicKey,
      associatedTokenAddress
    );

    if (success) {
      setIsMyNft(true);
      setOrder(null);

      notification["success"]({
        message: "Success",
        description: "Cancelled sale of this item!",
      });
    }
  };

  const renderBuy = () => {
    return (
      <Card title="Sale" style={{ marginBottom: 10 }}>
        <SolPrice price={order.price.toNumber()} />
        <Button
          icon={<WalletOutlined />}
          type="primary"
          style={{ marginTop: 10 }}
          onClick={onBuy}
        >
          Buy
        </Button>
      </Card>
    );
  };

  const onBuy = async () => {
    const success = await Market.fillOrder(
      program,
      mintKey,
      order.creator,
      wallet
    );

    if (success) {
      setIsMyNft(true);
      setOrder(null);

      notification["success"]({
        message: "Success",
        description:
          "Bought this item!\nYou will see this item in your wallet.",
      });
    }
  };

  return (
    <Row style={{ margin: 20 }}>
      <Col span={16} offset={4} style={{ marginTop: 10 }}>
        {metatdata == null || uriData == null ? (
          <Skeleton active />
        ) : (
          <>
            <Card
              title={`${uriData.name}(${uriData.symbol})`}
              style={{ marginTop: 10 }}
            >
              <Row gutter={20}>
                <Col xl={12} l={24}>
                  <img
                    src={`${uriData.image}`}
                    style={{ width: "100%", height: "auto" }}
                  />
                </Col>
                <Col xl={12} l={24}>
                  {isMyNft && renderCreateSale()}
                  {order != null &&
                    order.creator.toString() == wallet.publicKey.toString() &&
                    renderMySale()}
                  {order != null &&
                    order.creator.toString() != wallet.publicKey.toString() &&
                    renderBuy()}

                  <Collapse
                    defaultActiveKey={["1", "2", "3"]}
                    style={{ width: "100%" }}
                  >
                    <Collapse.Panel header="Description" key="1">
                      <div align="left">{uriData.description}</div>
                    </Collapse.Panel>
                    <Collapse.Panel header="Attributes" key="2">
                      <Descriptions layout="vertical" bordered>
                        <Descriptions.Item label="Size">
                          {getTraitValue("size")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Live">
                          {getTraitValue("live in")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Food">
                          {getTraitValue("food")}
                        </Descriptions.Item>
                      </Descriptions>
                    </Collapse.Panel>
                    <Collapse.Panel header="Details" key="3">
                      <Descriptions layout="horizontal" column={1} bordered>
                        <Descriptions.Item label="Metadata address">
                          <AddressItem address={metadataAddress} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Mint address">
                          <AddressItem address={metatdata.mint.toArray("le")} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Update authority">
                          <AddressItem
                            address={metatdata.updateAuthority.toArray("le")}
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="Artist royalties">
                          {metatdata.data.sellerFeeBasisPoints / 100}%
                        </Descriptions.Item>
                        <Descriptions.Item label="Misc">
                          {isMyNft ? "This is my NFT" : ""}
                        </Descriptions.Item>
                      </Descriptions>
                    </Collapse.Panel>
                  </Collapse>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Col>
    </Row>
  );
};

export default Detail;
