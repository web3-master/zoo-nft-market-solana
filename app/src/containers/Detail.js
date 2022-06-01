import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
  createMintToInstruction,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ShoppingCartOutlined, WalletOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  InputNumber,
  Result,
  Row,
  Skeleton,
} from "antd";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddressItem from "../components/AddressItem";
import CollectionContext from "../contexts/collection-context";

import ZooNftMarketIdl from "../idl/zoo_nft_market_solana.json";

import {
  TOKEN_METADATA_PROGRAM_ID,
  ZOO_NFT_MARKET_PROGRAM_ID,
  NFT_SYMBOL,
} from "../data/Constants";

import solImage from "../images/sol.png";
import { useForm } from "antd/lib/form/Form";

import { BN } from "bn.js";
import SolPrice from "../components/SolPrice";

const { LAMPORTS_PER_SOL } = anchor.web3;

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
    console.log("mint key: ", mintKey.toString());

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

      const myTokenAccountAddress = await getAssociatedTokenAddress(
        mintKey,
        wallet.publicKey
      );
      console.log(
        "my token account address: ",
        myTokenAccountAddress.toString()
      );
      const myTokenAccountInfo =
        await program.provider.connection.getAccountInfo(myTokenAccountAddress);
      console.log("my token account info: ", myTokenAccountInfo);

      if (myTokenAccountInfo === null) {
        // This is not my nft.
        setIsMyNft(false);
      } else {
        const balance =
          await program.provider.connection.getTokenAccountBalance(
            myTokenAccountAddress
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
      console.log("Order.creator: ", order.creator.toString());
      console.log("Order.price: ", order.price.toNumber());
      console.log("My wallet address: ", wallet.publicKey.toString());
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
        <Form form={createSaleForm} layout="inline" onFinish={createSale}>
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

  const createOrder = async (
    mintKey,
    ownerKey,
    ownerTokenAccount,
    memo,
    price
  ) => {
    const [orderAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("order"), mintKey.toBytes()],
      program.programId
    );

    const orderTokenAccount = await getAssociatedTokenAddress(
      mintKey,
      orderAccount,
      true
    );

    try {
      const tx = program.transaction.createOrder(
        memo,
        new BN(price * LAMPORTS_PER_SOL),
        {
          accounts: {
            order: orderAccount,
            orderTokenAccount: orderTokenAccount,
            mintKey: mintKey,
            creator: ownerKey,
            creatorTokenAccount: ownerTokenAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      console.log("Create Order Success!");

      let order = await program.account.order.fetch(orderAccount);
      return {
        order,
        orderAccount,
        orderTokenAccount,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  const createSale = async (values) => {
    let { price } = values;
    const myTokenAccountAddress = await getAssociatedTokenAddress(
      mintKey,
      wallet.publicKey
    );
    const order = await createOrder(
      mintKey,
      wallet.publicKey,
      myTokenAccountAddress,
      "An order",
      price
    );
    console.log("Order Created: ", order);
  };

  const renderMySale = () => {
    return (
      <Card title="Sale" style={{ marginBottom: 10 }}>
        <SolPrice price={order.price.toNumber()} />
        <Button
          type="primary"
          onClick={cancelOffer}
          style={{ marginTop: 10, background: "red", borderColor: "red" }}
        >
          Cancel
        </Button>
      </Card>
    );
  };

  const cancelOffer = () => {};

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
