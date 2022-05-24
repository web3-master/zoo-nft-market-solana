import { ControlOutlined, TableOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Radio,
  Row,
  Skeleton,
  Space,
} from "antd";
import CollapsePanel from "antd/lib/collapse/CollapsePanel";
import { useForm } from "antd/lib/form/Form";
import { useContext, useEffect, useState } from "react";
import GalleryItem from "../components/GalleryItem";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { binary_to_base58, base58_to_binary } from "base58-js";
import { decodeMetadata } from "../util/metaplex_util";
import { TOKEN_METADATA_PROGRAM_ID, NFT_SYMBOL } from "../data/Constants";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [keywordForm] = useForm();

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    fetchAllNfts();
  }, [connection, wallet]);

  //   useEffect(() => {
  //     var result = [];
  //     if (keyword == "") {
  //       result = collectionCtx.collection;
  //     } else {
  //       result = collectionCtx.collection.filter(
  //         (nft) =>
  //           nft.title.includes(keyword) || nft.description.includes(keyword)
  //       );
  //     }

  //     setItems(result);
  //   }, [keyword]);

  const fetchAllNfts = async () => {
    const MAX_NAME_LENGTH = 32;
    const MAX_URI_LENGTH = 200;
    const MAX_SYMBOL_LENGTH = 10;
    const MAX_CREATOR_LEN = 32 + 1 + 1;
    const MAX_CREATOR_LIMIT = 5;
    const MAX_DATA_SIZE =
      4 +
      MAX_NAME_LENGTH +
      4 +
      MAX_SYMBOL_LENGTH +
      4 +
      MAX_URI_LENGTH +
      2 +
      1 +
      4 +
      MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
    const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
    const SYMBOL_START = 1 + 32 + 32 + 4 + MAX_NAME_LENGTH + 4;

    const nftSymbolBytes = new TextEncoder().encode(NFT_SYMBOL);
    const nftSymbolBase58 = binary_to_base58(nftSymbolBytes);

    const metadataAccounts = await connection.getProgramAccounts(
      TOKEN_METADATA_PROGRAM_ID,
      {
        filters: [
          // Only get Metadata accounts.
          { dataSize: MAX_METADATA_LEN },

          // Filter using the first creator.
          {
            memcmp: {
              offset: SYMBOL_START,
              bytes: nftSymbolBase58,
            },
          },
        ],
      }
    );

    const decodedMetadatas = metadataAccounts.map((metadataAccountInfo) =>
      decodeMetadata(new Buffer(metadataAccountInfo.account.data))
    );

    console.log("Decoded Metatdata Accounts", decodedMetadatas);
    setItems(decodedMetadatas);
  };

  const renderItem = (metadata, key) => {
    if (Object.keys(metadata).length == 0) {
      return (
        <List.Item>
          <Skeleton active />
        </List.Item>
      );
    } else {
      return <GalleryItem metadata={metadata} />;
    }
  };

  const renderFilterBar = () => {
    return (
      <Col span={4}>
        <Card
          title={
            <span>
              <ControlOutlined style={{ marginRight: 10 }} />
              Filter
            </span>
          }
          bodyStyle={{ padding: 0 }}
        >
          <Collapse defaultActiveKey={[1, 2, 3]}>
            <CollapsePanel header="Keyword" key={1}>
              <Form
                form={keywordForm}
                initialValues={{ keyword: "" }}
                onFinish={onKeywordSubmit}
              >
                <Row gutter={10}>
                  <Col flex={1}>
                    <Form.Item name="keyword" noStyle>
                      <Input placeholder="Keyword" />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Form.Item noStyle>
                      <Button type="primary" htmlType="submit">
                        Search
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </CollapsePanel>
          </Collapse>
        </Card>
      </Col>
    );
  };

  const onKeywordSubmit = () => {
    setKeyword(keywordForm.getFieldValue("keyword"));
  };

  return (
    <Row style={{ margin: 60 }}>
      {/* {collectionCtx.nftIsLoading && (
    <Col span={24}>
      <Alert message="Loading items..." type="info" showIcon />
    </Col>
  )}
  {!collectionCtx.nftIsLoading && marketplaceCtx.mktIsLoading && (
    <Col span={24}>
      <Alert message="Processing request..." type="info" showIcon />
    </Col>
  )} */}
      <Col span={24}>
        <Row gutter={20} style={{ marginTop: 10 }}>
          {renderFilterBar()}
          <Col span={20}>
            <Card
              title={
                <span>
                  <TableOutlined style={{ marginRight: 10 }} />
                  All NFT Items
                </span>
              }
            >
              <List
                grid={{
                  gutter: 32,
                  xs: 1,
                  sm: 2,
                  md: 2,
                  lg: 4,
                  xl: 4,
                  xxl: 4,
                }}
                locale={{ emptyText: "There's nothing to show!" }}
                dataSource={items}
                renderItem={renderItem}
                pagination={{
                  position: "bottom",
                  pageSize: 8,
                  total: items.length,
                  showTotal: (total) => `Total ${total} items`,
                }}
              />
              {/* {collectionCtx.nftIsLoading ? (
                <Skeleton />
              ) : (
                <List
                  grid={{
                    gutter: 32,
                    xs: 1,
                    sm: 2,
                    md: 2,
                    lg: 4,
                    xl: 4,
                    xxl: 4,
                  }}
                  locale={{ emptyText: "There's nothing to show!" }}
                  dataSource={items}
                  renderItem={renderItem}
                  pagination={{
                    position: "bottom",
                    pageSize: 8,
                    total: items.length,
                    showTotal: (total) => `Total ${total} items`,
                  }}
                />
              )} */}
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Gallery;
