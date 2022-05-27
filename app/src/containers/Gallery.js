import { ControlOutlined, TableOutlined } from "@ant-design/icons";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  List,
  Row,
  Skeleton,
} from "antd";
import CollapsePanel from "antd/lib/collapse/CollapsePanel";
import { useForm } from "antd/lib/form/Form";
import { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import GalleryItem from "../components/GalleryItem";
import CollectionContext from "../contexts/collection-context";

const Gallery = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [keywordForm] = useForm();

  const { connection } = useConnection();
  const collectionCtx = useContext(CollectionContext);

  useEffect(() => {
    loadMoreData();
  }, []);

  useEffect(() => {
    setItems(collectionCtx.collection);
  }, [collectionCtx]);

  useEffect(() => {
    var result = [];
    if (keyword == "") {
      result = collectionCtx.collection;
    } else {
      result = collectionCtx.collection.filter((nft) =>
        nft.data.name.includes(keyword)
      );
    }

    setItems(result);
  }, [keyword]);

  const loadMoreData = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    await collectionCtx.loadCollection(
      connection,
      parseInt(collectionCtx.collection.length / 10),
      10
    );
    setLoading(false);
  };

  const hasMore = () => {
    if (
      collectionCtx.collection === undefined ||
      collectionCtx.collectionPublicKeys === undefined ||
      collectionCtx.collectionPublicKeys.length === 0
    ) {
      return true;
    } else {
      console.log(
        "hasMore2",
        collectionCtx.collection.length <
          collectionCtx.collectionPublicKeys.length
      );
      return (
        collectionCtx.collection.length <
        collectionCtx.collectionPublicKeys.length
      );
    }
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
      <Col span={24}>
        <Row gutter={20} style={{ marginTop: 10 }}>
          {/* {renderFilterBar()} */}
          <Col span={20} offset={2}>
            <Card
              title={
                <span>
                  <TableOutlined style={{ marginRight: 10 }} />
                  All NFT Items
                </span>
              }
            >
              <div
                id="scrollableDiv"
                style={{
                  height: 600,
                  overflow: "auto",
                  padding: "0 0px",
                }}
              >
                <InfiniteScroll
                  dataLength={collectionCtx.collection.length}
                  next={loadMoreData}
                  hasMore={hasMore()}
                  loader={
                    <Skeleton
                      paragraph={{
                        rows: 2,
                      }}
                      active
                    />
                  }
                  endMessage={
                    <Divider plain>It is all, nothing more 🤐</Divider>
                  }
                  scrollableTarget="scrollableDiv"
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
                    dataSource={collectionCtx.collection}
                    renderItem={renderItem}
                  />
                </InfiniteScroll>
              </div>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Gallery;
