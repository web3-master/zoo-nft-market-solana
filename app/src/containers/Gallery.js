import { ControlOutlined, TableOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  List,
  Row,
  Skeleton,
} from "antd";
import CollapsePanel from "antd/lib/collapse/CollapsePanel";
import { useForm } from "antd/lib/form/Form";
import { useContext, useEffect, useState } from "react";
import GalleryItem from "../components/GalleryItem";
import CollectionContext from "../contexts/collection-context";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [keywordForm] = useForm();

  const collectionCtx = useContext(CollectionContext);

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
      {collectionCtx.nftIsLoading && (
        <Col span={24}>
          <Alert message="Loading items..." type="info" showIcon />
        </Col>
      )}

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
              {collectionCtx.nftIsLoading ? (
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
              )}
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Gallery;
