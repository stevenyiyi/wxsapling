import React from "react";
import PropTypes from "prop-types";
import ReactEmoji from "react-emoji";
import { parseFrom } from "./utils";
import "./barrage.css";

const tracks_reducer = (tracks, action) => {
  switch (action.type) {
    case "set_free_tracks": {
      let l = action.message.content.length;
      if (l < 10) {
        for (let i = 4; i >= 0; i--) {
          if (!tracks[i].working) {
            console.log(`found free track:${i}`);
            action.result = true;
            tracks[i].working = true;
            tracks[i].startTs = window.performance.now();
            tracks[i].message = action.message;
            return [...tracks];
          }
        }
      } else {
        for (let i = 0; i <= 4; i++) {
          if (!tracks[i].working) {
            console.log(`found free track:${i}`);
            action.result = true;
            tracks[i].working = true;
            tracks[i].startTs = window.performance.now();
            tracks[i].message = action.message;
            return [...tracks];
          }
        }
      }
      console.log("Not free track!");
      action.result = false;
      return tracks;
    }
    case "check_state": {
      let is_changed = false;
      for (const track of tracks) {
        if (track.working) {
          if (
            window.performance.now() - track.startTs >
            track.interval * 1000
          ) {
            /** Track 工作已经完成 */
            is_changed = true;
            track.working = false;
          }
        }
      }
      if (is_changed) {
        action.hasFreeTracks = true;
        return [...tracks];
      } else {
        action.hasFreeTracks = false;
        return tracks;
      }
    }
    default:
      throw new Error(`Unexpected action:${action.type}`);
  }
};
export default function Barrage(props) {
  const { message } = props;
  const refMessages = React.useRef([]);
  const [tracksState, dispatchTracksState] = React.useReducer(tracks_reducer, [
    { index: 0, interval: 10, working: false, startTs: 0, message: null },
    { index: 1, interval: 9, working: false, startTs: 0, message: null },
    { index: 2, interval: 8, working: false, startTs: 0, message: null },
    { index: 3, interval: 7, working: false, startTs: 0, message: null },
    { index: 4, interval: 6, working: false, startTs: 0, message: null }
  ]);

  React.useEffect(() => {
    if (message) {
      console.log(message);
      let params = { type: "set_free_tracks", message: message };
      dispatchTracksState(params);
      if (!params.result) {
        /** 当没有空闲的track时，将消息存入队列以后处理 */
        refMessages.current.push(message);
      }
    }
  }, [message]);

  React.useEffect(() => {
    let timerid = setInterval(() => {
      let actionState = { type: "check_state" };
      dispatchTracksState(actionState);
      if (actionState.hasFreeTracks) {
        let msg = null;
        do {
          msg = refMessages.current.shift();
          if (msg) {
            let params = {
              type: "set_free_tracks",
              message: msg
            };
            dispatchTracksState(params);
          }
        } while (msg);
      }
    }, 1000);
    return () => {
      console.log("destory timer");
      clearInterval(timerid);
    };
  }, []);

  const genBarage = () => {
    return tracksState.map((track, index) => {
      if (track.working) {
        let ufrom = parseFrom(track.message.from);
        return (
          <div key={index} className={`track track-${index}`}>
            <span className="title">{`${ufrom.name}:`}</span>
            <span>{ReactEmoji.emojify(track.message.content)}</span>
          </div>
        );
      } else {
        return null;
      }
    });
  };

  return <div>{genBarage()}</div>;
}

Barrage.propTypes = {
  message: PropTypes.object.isRequired
};

Barrage.defaultProps = {
  message: {
    from: "系统消息:jpg@admin",
    content: "铴好的中华人民共和国:)",
    ts: Date.now()
  }
};
