import React from "react";

const CollectionContext = React.createContext({
  collection: [],
  nftIsLoading: true,
  loadCollection: () => {},
  loadItemMetadata: () => {},
  setNftIsLoading: () => {},
});

export default CollectionContext;
