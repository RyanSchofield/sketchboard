import { useSync } from "@tldraw/sync";
import {
  AssetRecordType,
  getHashForString,
  TLAssetStore,
  TLBookmarkAsset,
  Tldraw,
  uniqueId,
} from "tldraw";

const HOST = location.origin.slice(0, -4).concat(process.env.PORT ?? "5858");
const WORKER_URL = HOST;

const roomId = 1;

function App() {
  const store = useSync({
    uri: `${WORKER_URL}/connect/${roomId}`,
    assets: multiplayerAssets,
  });

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw store={store} />
    </div>
  );
}

const multiplayerAssets: TLAssetStore = {
  // to upload an asset, we prefix it with a unique id, POST it to our worker, and return the URL
  async upload(_asset, file) {
    const id = uniqueId();

    const objectName = `${id}-${file.name}`;
    const url = `${WORKER_URL}/uploads/${encodeURIComponent(objectName)}`;

    const response = await fetch(url, {
      method: "PUT",
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload asset: ${response.statusText}`);
    }

    return url;
  },
  resolve(asset) {
    return asset.props.src;
  },
};

export default App;
