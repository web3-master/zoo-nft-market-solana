import { BrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useContext, useEffect } from "react";
import CollectionContext from "./contexts/collection-context";

function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const collectionCtx = useContext(CollectionContext);

  useEffect(() => {
    collectionCtx.loadCollection(connection);
  }, [connection, wallet]);

  return (
    <BrowserRouter>
      <div className="App">
        <AppLayout />
      </div>
    </BrowserRouter>
  );
}

export default App;
