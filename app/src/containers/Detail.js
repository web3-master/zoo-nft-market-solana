import * as anchor from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Result,
  Row,
  Skeleton,
} from "antd";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddressItem from "../components/AddressItem";
import CollectionContext from "../contexts/collection-context";

const Detail = () => {
  let navigate = useNavigate();
  const { connection } = useConnection();
  const { metadataAddress } = useParams();
  const [metatdata, setMetadata] = useState(null);
  const collectionCtx = useContext(CollectionContext);
  const [uriData, setUriData] = useState(null);
  const [invalidItem, setInvalidItem] = useState(false);

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
                          <AddressItem address={metatdata.mint} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Update authority">
                          <AddressItem address={metatdata.updateAuthority} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Artist royalties">
                          {metatdata.data.sellerFeeBasisPoints / 100}%
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
