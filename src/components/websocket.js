import React from "react";
import PropTypes from "prop-types";

class Websocket extends React.Component {
  constructor(props) {
    super(props);
    console.log(`websocket constructor, protocol:${this.props.protocol}`);
    try {
      this.state = {
        ws: null,
        attempts: 1
      };
    } catch (e) {
      console.log("websocket constructor error:", e);
    }
    this.sendMessage = this.sendMessage.bind(this);
    this.setupWebsocket = this.setupWebsocket.bind(this);
    Object.defineProperties(this, {
      readyState: {
        get: function getReadyState() {
          return this.state.ws.readyState;
        }
      }
    });
  }

  logging(logline) {
    if (this.props.debug === true) {
      console.log(logline);
    }
  }

  generateInterval(k) {
    if (this.props.reconnectIntervalInMilliSeconds > 0) {
      return this.props.reconnectIntervalInMilliSeconds;
    }
    return Math.min(30, Math.pow(2, k) - 1) * 1000;
  }

  setupWebsocket(websocket) {
    /// Change binary type from "blob" to "arraybuffer"
    websocket.binaryType = "arraybuffer";
    websocket.onopen = (e) => {
      this.logging("Websocket connected");
      if (typeof this.props.onOpen === "function") this.props.onOpen(e);
      Promise.resolve();
    };

    websocket.onerror = (e) => {
      console.log(e);
      if (typeof this.props.onError === "function") this.props.onError(e);
      //Promise.reject(e);
    };

    websocket.onmessage = (evt) => {
      this.props.onMessage(evt.data);
    };

    this.shouldReconnect = this.props.reconnect;
    websocket.onclose = (e) => {
      console.log(e);
      if (typeof this.props.onClose === "function") this.props.onClose(e);
      if (
        this.shouldReconnect &&
        e.code !== 1000 &&
        e.code !== 4001 &&
        e.code !== 4002 &&
        e.code !== 4003
      ) {
        this.reconnect();
      }
    };
    this.setState({ ws: websocket });
  }

  connect() {
    return this.disconnect().then(() => {
      let ws = window.WebSocket
        ? new window.WebSocket(this.props.url, this.props.protocol)
        : new window.MozWebSocket(this.props.url, this.props.protocol);
      this.setupWebsocket(ws);
    });
  }

  disconnect() {
    clearTimeout(this.timeoutID);
    return new Promise((resolve) => {
      let ws = this.state.ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.onclose = (e) => {
          console.log(`closed, code:${e.code}.`);
          resolve();
        };
        ws.close();
      } else {
        console.log("closed");
        resolve();
      }
    });
  }

  reconnect() {
    this.logging("Websocket reconnect!");
    let time = this.generateInterval(this.state.attempts);
    this.timeoutID = setTimeout(() => {
      this.setState({ attempts: this.state.attempts + 1 });
      this.connect()
        .then(() => console.log("connected!"))
        .catch((e) => console.log(e));
    }, time);
  }

  componentDidMount() {
    this.ready = this.connect();
  }

  componentWillUnmount() {
    this.shouldReconnect = false;
    this.disconnect().then(() => {
      console.log("websocket componentWillUnmount!");
    });
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      let websocket = this.state.ws;
      if (websocket.readyState !== WebSocket.OPEN) {
        console.log("websocket send in invalid state!");
        reject(new Error("websocket send in invalid state"));
      }
      websocket.send(message);
      const timerid = setInterval(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          clearInterval(timerid);
          reject(new Error("SendMessage failed!websocket invalid state!"));
        } else if (websocket.bufferedAmount === 0) {
          clearInterval(timerid);
          resolve();
        }
      }, 20);
    });
  }

  render() {
    return <div></div>;
  }
}

Websocket.defaultProps = {
  url: "ws://localhost/ws_group_chat?username=9923456789",
  debug: true,
  reconnect: true
};

Websocket.propTypes = {
  url: PropTypes.string.isRequired,
  onMessage: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onError: PropTypes.func,
  debug: PropTypes.bool,
  reconnect: PropTypes.bool,
  protocol: PropTypes.string,
  reconnectIntervalInMilliSeconds: PropTypes.number
};

export default Websocket;
