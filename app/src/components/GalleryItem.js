import { Card, Image, List, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    navigate("/detail/" + metadata.address);
  };

  const renderItemBody = () => {
    return (
      <Card
        hoverable
        cover={
          <div style={{ height: "200px", overflow: "hidden" }}>
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

  return <List.Item onClick={onClick}>{renderItemBody()}</List.Item>;
};

export default GalleryItem;
