import { useSync } from "@tldraw/sync";
import {
  DefaultMainMenu,
  DefaultMainMenuContent,
  TLAssetStore,
  TLComponents,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  uniqueId,
} from "tldraw";

const HOST = location.origin;
console.log("host", HOST);

const multiplayerAssets: TLAssetStore = {
    // to upload an asset, we prefix it with a unique id, POST it to our worker, and return the URL
    async upload(_asset, file) {
        const id = uniqueId();

        const objectName = `${id}-${file.name}`;
        const url = `${HOST}/uploads/${encodeURIComponent(objectName)}`;

        const response = await fetch(url, {
            method: "PUT",
            body: file,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload asset: ${response.statusText}`);
        }

        let json = await response.json()

        if (json && json.publicUrl) {
            console.log('got a public url from server', json.publicUrl)
            return json.publicUrl;
        }
        
        // fall back to server url
        console.log('no public url', response)
        return url;
    },

    resolve(asset) {
        console.log('resolve asset', asset.props)
        return asset.props.src;
    },
};

function Board(props) {
    let roomId = props.roomId;
    if (!roomId || roomId < 1) return null; 

    const CustomMainMenu = () => {
        return (
            <DefaultMainMenu>
                <DefaultMainMenuContent />
                <div style={{ backgroundColor: 'thistle' }}>
                    <TldrawUiMenuGroup id="example">
                        <TldrawUiMenuItem
                            id="goBack"
                            label="Go back"
                            icon="arrow-left"
                            readonlyOk
                            onSelect={() => {
                                console.log('go back click');
                                props.handler(0)
                            }}
                        />
                    </TldrawUiMenuGroup>
                </div>
            </DefaultMainMenu>
        )
    }
    
    
    const components: TLComponents = {
        MainMenu: CustomMainMenu
    }
  
    const store = useSync({
        uri: `${HOST}/connect/${roomId}`,
        assets: multiplayerAssets,
    });
  
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            <Tldraw components={components} store={store} />
        </div>
    );
  }

export default Board;
