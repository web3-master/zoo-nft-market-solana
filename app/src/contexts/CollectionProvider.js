import { useReducer } from "react";

import CollectionContext from "./collection-context";
import { binary_to_base58 } from "base58-js";
import { decodeMetadata } from "../util/metaplex_util";
import { TOKEN_METADATA_PROGRAM_ID, NFT_SYMBOL } from "../data/Constants";

const defaultCollectionState = {
  collection: [],
  nftIsLoading: true,
};

const collectionReducer = (state, action) => {
  if (action.type === "LOADCOLLECTION") {
    return {
      collection: action.collection,
      nftIsLoading: false,
    };
  }

  if (action.type === "ADD") {
    return {
      collection: [action.item, ...state.collection],
      nftIsLoading: false,
    };
  }

  if (action.type === "LOADING") {
    return {
      collection: state.collection,
      nftIsLoading: action.loading,
    };
  }

  return defaultCollectionState;
};

const CollectionProvider = (props) => {
  const [CollectionState, dispatchCollectionAction] = useReducer(
    collectionReducer,
    defaultCollectionState
  );

  const loadCollectionHandler = async (connection) => {
    dispatchCollectionAction({ type: "LOADING", loading: true });

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

    dispatchCollectionAction({
      type: "LOADCOLLECTION",
      collection: decodedMetadatas,
    });
  };

  const loadItemMetadataHandler = async (connection, metadataAddress) => {
    dispatchCollectionAction({ type: "LOADING", loading: true });

    const metadataAccountInfo = await connection.getAccountInfo(
      metadataAddress
    );

    const decodedMetadata = decodeMetadata(metadataAccountInfo.data);

    dispatchCollectionAction({
      type: "ADD",
      item: decodedMetadata,
    });
  };

  const setNftIsLoadingHandler = (loading) => {
    dispatchCollectionAction({ type: "LOADING", loading: loading });
  };

  const collectionContext = {
    collection: CollectionState.collection,
    nftIsLoading: CollectionState.nftIsLoading,
    loadCollection: loadCollectionHandler,
    loadItemMetadata: loadItemMetadataHandler,
    setNftIsLoading: setNftIsLoadingHandler,
  };

  return (
    <CollectionContext.Provider value={collectionContext}>
      {props.children}
    </CollectionContext.Provider>
  );
};

export default CollectionProvider;
