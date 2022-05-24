import { Badge, Card, Image, List, Skeleton } from "antd";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import CollectionContext from "../web3/store/collection-context";
// import MarketplaceContext from "../web3/store/marketplace-context";
// import Web3Context from "../web3/store/web3-context";
import "./GalleryItem.css";

const GalleryItem = ({ metadata }) => {
  const [uriData, setUriData] = useState(null);
  let navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const response = await fetch(metadata.data.uri);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      setUriData(json);
    })();
  }, [metadata]);

  const onClick = () => {
    navigate("/detail/" + metadata.mint);
  };

  const renderItemBody = () => {
    return (
      <Card
        hoverable
        cover={
          <div style={{ height: "240px", overflow: "hidden" }}>
            {uriData == null ? (
              <Skeleton active />
            ) : (
              <Image src={`${uriData.image}`} preview={false} />
            )}
          </div>
        }
        bodyStyle={{ paddingLeft: 10, paddingRight: 10, paddingTop: 20 }}
      >
        <Card.Meta title={metadata.data.name} />
      </Card>
    );
  };

  return (
    <List.Item onClick={onClick}>
      {renderItemBody()}
      {/* {offer == null ? (
        renderItemBody()
      ) : (
        <Badge.Ribbon text="In Sale" color="green">
          {renderItemBody()}
        </Badge.Ribbon>
      )} */}
    </List.Item>
  );
};

export default GalleryItem;
