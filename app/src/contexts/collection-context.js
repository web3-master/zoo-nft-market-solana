import React from "react";

const CollectionContext = React.createContext({
  collectionPublicKeys: [],
  collection: [],
  nftIsLoading: false,
  loadCollection: () => {},
  loadItemMetadata: () => {},
  setNftIsLoading: () => {},
});

export default CollectionContext;
