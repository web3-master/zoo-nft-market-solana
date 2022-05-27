import { TableOutlined } from "@ant-design/icons";
import { useConnection } from "@solana/wallet-adapter-react";
import { Card, Col, Divider, List, Row, Skeleton } from "antd";
import { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import GalleryItem from "../components/GalleryItem";
import CollectionContext from "../contexts/collection-context";

const Gallery = () => {
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();
  const collectionCtx = useContext(CollectionContext);

  useEffect(() => {
    loadMoreData();
  }, []);

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
      return (
        collectionCtx.collection.length <
        collectionCtx.collectionPublicKeys.length
      );
    }
  };

  const renderItem = (metadata, index) => {
    if (Object.keys(metadata).length == 0) {
      return (
        <List.Item>
          <Skeleton active />
        </List.Item>
      );
    } else {
      return (
        <GalleryItem
          metadata={metadata}
          metatdataPublicKey={collectionCtx.collectionPublicKeys[index]}
        />
      );
    }
  };

  return (
    <Row style={{ margin: 60 }}>
      <Col span={24}>
        <Row gutter={20} style={{ marginTop: 10 }}>
          <Col span={20} offset={2}>
            <Card
              title={
                <span>
                  <TableOutlined style={{ marginRight: 10 }} />
                  All NFT Items (Total{" "}
                  {collectionCtx.collectionPublicKeys.length} items)
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
                  endMessage={<Divider plain>It is all, nothing more</Divider>}
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
                    locale={{ emptyText: "Loading from solana cluster..." }}
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
