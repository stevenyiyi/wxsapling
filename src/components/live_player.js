import React from "react";
import { FaInfo, FaUser, FaTelegramPlane } from "react-icons/fa";
import { UserContext } from "../user_context";
import { useLocation } from "react-router-dom";
import HLSPlayer from "./hlsplayer";
import CameraList from "./camera_list";
import Person from "./person";
import Info from "./info";
import Jabber from "./jabber";
import { tlv_serialize_object, tlv_unserialize_object } from "./tlv";
import Websocket from "./websocket";
import config from "../config";
import { useSnackbar } from "./use_snackbar";
import "./live_player.css";

const ENDPOINT = config.wssLiveUrl;

export default function LivePlayer(props) {
  const userCtx = React.useContext(UserContext);
  const location = useLocation();
  const username = userCtx.user.username;
  const ws = React.useRef(null);
  const [streamUri, setStreamUri] = React.useState("");
  const [camlist, setCamlist] = React.useState(null);
  const [camsRefreshId, setCamsRefreshId] = React.useState(0);
  const [showPerson, setShowPerson] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [chatText, setChatText] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [wsopened, setWsopened] = React.useState(false);
  const refPersonBut = React.useRef();
  const refInfoBut = React.useRef();
  const refPerson = React.useRef();
  const openSnackbar = React.useRef(useSnackbar()[0]);

  React.useEffect(() => {
    if (!userCtx.useNavbar && location.state && location.state.from === "/") {
      userCtx.update(userCtx.user, true);
    }
  }, [userCtx, location]);

  /** 从服务器获取摄像头列表 */
  React.useEffect(() => {
    const ERR_NO_ACCOUNT = 0x800000f;
    const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
    const ERR_OVERDUE = ERR_INVALID_PWD + 1;
    fetch(`${config.apiBaseUrl}/sapling/get_camera_list?ts=${Date.now()}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json"
      },
      cache: "no-cache",
      method: "GET",
      mode: "cors"
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Server repsone status:${response.status}`);
        }
      })
      .then((jresp) => {
        console.log(jresp);
        if (jresp.result === 0) {
          setCamlist(jresp.camlist);
        } else if (jresp.result === ERR_NO_ACCOUNT) {
          openSnackbar.current("帐户不存在!");
        } else if (jresp.result === ERR_INVALID_PWD) {
          openSnackbar.current("口令错误!");
        } else if (jresp.result === ERR_OVERDUE) {
          openSnackbar.current("帐户已过期!");
        }
      })
      .catch((e) => {
        console.error("Error:", e);
        setCamlist({
          cameras: [
            { oid: "51060300001310000006", name: "门卫", status: 1 },
            { oid: "51060300001310000308", name: "大厅", status: 1 }
          ]
        });
      });
  }, [camsRefreshId]);

  React.useEffect(() => {
    if (streamUri && username && wsopened) {
      /// 用户切换PlayUri
      let fpos = streamUri.lastIndexOf("/");
      let soid = streamUri.substring(fpos + 1);
      let oid = soid.split("_")[0];
      let msg = {};
      console.log(`Send ws switch stream:${oid}`);
      msg.from =
        refPerson.current.getName() +
        ":" +
        refPerson.current.getPhoto() +
        "@" +
        username;
      msg.to = "server";
      msg.type = "jabber";
      msg.ts = Date.now();
      msg.content = "playing_stream:" + oid;
      /// Send jabber join video group
      let binMsg = tlv_serialize_object(msg);
      ws.current.sendMessage(binMsg, (result) => {
        console.log("Send message success!");
      });
    }
  }, [streamUri, username, wsopened]);

  /** 处理用户点击播放列表 */
  const handlePlayUri = (uri, is_main_stream) => {
    setStreamUri(uri);
    /**
    if (!is_main_stream) {
      if (isMainStream) refVideo.current.classList.add("aspect_ratio_d1");
    } else {
      if (!isMainStream) refVideo.current.classList.remove("aspect_ratio_d1");
    }
    setIsMainStream(is_main_stream); */
  };

  /** 处理 HLSPlayer 传来的刷新播放列表的消息 */
  const handleRefreshCamList = React.useCallback(() => {
    setCamsRefreshId((rid) => rid + 1);
  }, []);

  /** 处理 HLSPlayer 传来的播放列表变化的消息 */
  const handlePalyChange = React.useCallback(
    (uri) => {
      if (uri !== streamUri) {
        setStreamUri(uri);
        setCamlist({ ...camlist });
      }
    },
    [camlist, streamUri]
  );

  /** 点击个人信息 */
  const handlePersonClick = (event) => {
    setShowPerson(!showPerson);
  };

  /** 个人信息关闭事件*/
  const handlePersonClose = React.useCallback((event) => {
    if (!refPersonBut.current.contains(event.target)) {
      setShowPerson(false);
    }
  }, []);

  /** 点击信息显示 */
  const handleInfoClick = (event) => {
    setShowInfo(!showInfo);
  };

  /** 信息关闭 */
  const handleInfoClose = React.useCallback((event) => {
    if (!refInfoBut.current.contains(event.target)) {
      setShowInfo(false);
    }
  }, []);

  /** Assembly jabber message and send to websocket */
  const assemblySendMessage = React.useCallback(
    (text) => {
      let msg = {};
      msg.from =
        refPerson.current.getName() +
        ":" +
        refPerson.current.getPhoto() +
        "@" +
        username;
      msg.to = "all";
      msg.type = "jabber";
      msg.content = text;
      msg.ts = Date.now();
      let binMsg = tlv_serialize_object(msg);
      ws.current
        .sendMessage(binMsg)
        .then(() => {
          console.log("Send message success!");
          msg.to = username;
          setMessages([...messages, msg]);
        })
        .catch((e) => console.log(e));
    },
    [messages, username]
  );

  /** 处理 HLSPlayer 传来的发送聊天的消息*/
  const handleJabberFromPlayer = React.useCallback(
    (text) => {
      assemblySendMessage(text);
    },
    [assemblySendMessage]
  );

  /** 点击聊天 */
  const handleJabber = (event) => {
    if (!chatText) return;
    assemblySendMessage(chatText);
    setChatText("");
  };

  /** Websocket callbacks */
  const ws_onopen = (e) => {
    let msg = {
      from: "系统消息:jpg@admin",
      content: "已经连接到聊天服务器，您可以聊天，聊天时请注意文明用语！",
      ts: Date.now()
    };
    setMessages([...messages, msg]);
    setWsopened(true);
  };
  const ws_onclose = (e) => {
    let msgcontent = "与聊天服务器断开，聊天暂时不可用！";
    if (e.code === 4001) {
      msgcontent = "我们检测到您的帐户已经在另外的设备上登录，请退出再试！";
    }
    let msg = {
      from: "系统消息:jpg@admin",
      content: msgcontent,
      ts: Date.now()
    };
    setMessages([...messages, msg]);
    setWsopened(false);
  };
  const ws_onerror = (e) => {
    let msg = {
      from: "系统消息:jpg@admin",
      content: "与聊天服务器通信发生错误，请稍后再试！",
      ts: Date.now()
    };
    setMessages([...messages, msg]);
    setWsopened(false);
  };

  const ws_onmessage = (data) => {
    const wsmsg = tlv_unserialize_object(data);
    for (const [key, value] of Object.entries(wsmsg)) {
      if (key === "on_message") {
        console.log(value);
        setMessages([...messages, value]);
      } else {
        console.log(`Unknown ws onmessage method:${key}`);
      }
    }
  };

  const hlsconfig = React.useMemo(
    () => ({
      liveDurationInfinity: true,
      xhrSetup: function (xhr, url) {
        xhr.withCredentials = true; // do send cookies
      },
      fetchSetup: function (context, initParams) {
        // Always send cookies, even for cross-origin calls.
        initParams.credentials = "include";
        return new Request(context.url, initParams);
      }
    }),
    []
  );
  return (
    <div className="live_container">
      {username && (
        <Websocket
          ref={ws}
          url={`${ENDPOINT}?username=${username}`}
          onOpen={ws_onopen}
          onMessage={ws_onmessage}
          onClose={ws_onclose}
          onError={ws_onerror}
          reconnect={true}
          debug={true}
          protocol="jabber"
        />
      )}
      {streamUri && (
        <HLSPlayer
          url={streamUri}
          autoplay={true}
          hlsConfig={hlsconfig}
          poster=""
          videoProps={{}}
          cameras={camlist}
          messages={messages}
          onRefreshCamlist={handleRefreshCamList}
          onSendMessage={handleJabberFromPlayer}
          onPlayChange={handlePalyChange}
          switchPlayUri={handlePlayUri}
        />
      )}
      <div className="content__container">
        <div className="inner__content-container">
          {camlist && (
            <CameraList camlist={camlist} onPlayUri={handlePlayUri} />
          )}
          <Jabber messages={messages} />
        </div>
      </div>
      <div className="navbar">
        <div ref={refPersonBut} className="icon" onClick={handlePersonClick}>
          <FaUser />
        </div>
        <div ref={refInfoBut} className="icon" onClick={handleInfoClick}>
          <FaInfo />
        </div>
        <input
          id="input-jabber-message"
          type="text"
          placeholder="说点什么？"
          value={chatText}
          onChange={(e) => setChatText(e.target.value.trim())}
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleJabber(event);
            }
          }}
        />
        <div className="icon" onClick={handleJabber}>
          <FaTelegramPlane />
        </div>
      </div>
      <Person
        ref={refPerson}
        open={showPerson}
        onOutsideClick={handlePersonClose}
      />
      <Info open={showInfo} onOutsideClick={handleInfoClose} />
    </div>
  );
}
