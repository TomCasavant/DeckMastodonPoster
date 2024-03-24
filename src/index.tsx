import {
  ButtonItem,
  definePlugin,
  gamepadDialogClasses,
  Navigation,
  PanelSection,
  PanelSectionRow,
  quickAccessControlsClasses,
  ServerAPI,
  ServerResponse,
  SidebarNavigation,
  staticClasses,
  TextField,
  DialogCheckbox,
  Router
} from "decky-frontend-lib";
import { VFC, Fragment, useRef, useState, useEffect } from "react";
import { PyInterop } from "./PyInterop";
import { IoApps, IoSettingsSharp } from "react-icons/io5";
import { Settings } from "./components/config-ui/Settings";
import { useSetting } from "./utils/hooks/useSetting";


const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [text, setText] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [waitingForAuth, setWaitingForAuth] = useState<boolean>(false)
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  const postStatus = async () => {
    setLoggedIn((await PyInterop.is_logged_in()).result as boolean)
    if (loggedIn) {
      await PyInterop.post_status_with_media(text, selectedFiles);
    } else {
      const authUrl = (await PyInterop.get_auth_url()).result as string;
      PyInterop.toast("Opening URL", authUrl)
      Navigation.NavigateToExternalWeb(authUrl)
      setWaitingForAuth(true)
      await PyInterop.toast("Failed to post", "Please login")
    }
  };

  async function fetchScreenshots(): Promise<void> {
    await PyInterop.get_recent_photos("/Pictures/Screenshots", 10, 0).then((res) => {
      if (res && res.result) {
        console.error("fetching screenshots")
        setScreenshots(res.result as string[]);
      } else {
        console.error("Failed to fetch screenshots.");
      }
    });
  }

  const handleCheckboxChange = (file: string) => {
    if (selectedFiles.includes(file)) {
      setSelectedFiles(selectedFiles.filter((f) => f !== file));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };  
  
  fetchScreenshots();

  const renderCheckboxes = () => {
    console.error("SCREENSHOTS")
    console.error(screenshots)
    if (screenshots.length > 0 ) {
      return ( screenshots.map((file, index) => 
        <PanelSectionRow key={index}>
          <DialogCheckbox label={file} onChange={() => handleCheckboxChange(file) }/>
        </PanelSectionRow>
      ));
    } else {
      return ( 
        <PanelSectionRow key={0}>
          <DialogCheckbox label={"test"} />
        </PanelSectionRow>

      )
    }
  };

  const submitAuth = () => {
    PyInterop.save_authentication(authCode)
    setWaitingForAuth(false)
  }


  const renderAuthorization = () => {
    if (waitingForAuth) {
      return ( <PanelSectionRow>
      <TextField
        label="Paste your authorization code:"
        value={authCode}
        onChange={(e) => setAuthCode(e.target.value)}
      />
      <ButtonItem layout="below" onClick={submitAuth}>
          Authenticate
      </ButtonItem>
    </PanelSectionRow>
    )}
  }

  return (
    <>
      <div className="bash-shortcuts-scope">
        <PanelSection>
          <PanelSectionRow>
            {renderAuthorization()}
            <TextField
              label="Enter your status text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => {
                Navigation.CloseSideMenus();
                Navigation.Navigate("/mastodon-config");
              }}
            >
              Plugin Config
            </ButtonItem>
            {renderCheckboxes()}
            <ButtonItem layout="below" onClick={postStatus}>
              Post Status
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      </div>
    </>
  );
};

const ShortcutsManagerRouter: VFC<{}> = () => {
  const guidePages = {}
  /*Object.entries(guides).map(([ guideName, guide ]) => {
    guidePages[guideName] = {
      title: guideName,
      content: <GuidePage content={guide} />,
      route: `/bash-shortcuts-config/guides-${guideName.toLowerCase().replace(/ /g, "-")}`,
      icon: <MdNumbers />,
      hideTitle: true
    }
  });*/

  return (
    <SidebarNavigation
      title="Plugin Config"
      showTitle
      pages={[
        {
          title: "Settings",
          content: <Settings />,
          route: "/mastodon-config/settings",
          icon: <IoSettingsSharp />
        }
      ]}
    />
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  PyInterop.setServer(serverApi);

  serverApi.routerHook.addRoute("/mastodon-config", () => (
      <ShortcutsManagerRouter />
  ));

  return {
    title: <div className={staticClasses.Title}>Bash Shortcuts</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <IoApps />,
    onDismount() {
      //loginHook.unregister();
      serverApi.routerHook.removeRoute("/mastodon-config");
      //PluginController.dismount();
    },
    alwaysRender: true
  };
});
