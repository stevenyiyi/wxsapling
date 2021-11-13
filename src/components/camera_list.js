import React from "react";
import { FaVideo, FaVideoSlash, FaServer } from "react-icons/fa";
import "./camera_list.css";
export default function CameraList(props) {
  const { camlist, onPlayUri } = props;
  const [cameras, setCameras] = React.useState([]);
  const [groups, setGroups] = React.useState([]);

  React.useEffect(() => {
    /** 根据oid产生播放地址 */
    const genPlayUri = (oid) => {
      let uri = "/live/" + oid + "_master.m3u8";
      return uri;
    };
    /** 给每一个camera 增加属性 'selected' 并返回默认选择播放的url及是否用主码流*/
    const fixCameraList = (camlist) => {
      // 预处理 camlist
      let obj = { playuri: "", is_main_stream: true };
      if (camlist.cameras) {
        let dcams = camlist.cameras.map((cam) => {
          if (cam.status === 1 && !obj.playuri) {
            cam["selected"] = true;
            obj.playuri = genPlayUri(cam.oid);
            obj.is_main_stream = cam.is_main_stream;
          } else {
            cam["selected"] = false;
          }
          return cam;
        });
        camlist.cameras = dcams;
      }
      if (camlist.groups) {
        let cgroups = camlist.groups.map((group) => {
          group.cameras.forEach((cam, index, theArray) => {
            if (cam.status === 1 && !obj.playuri) {
              theArray[index].selected = true;
              obj.playuri = genPlayUri(cam.oid);
              obj.is_main_stream = cam.is_main_stream;
            } else {
              theArray[index].selected = false;
            }
          });
          return { ...group, unfold: true };
        });
        camlist.groups = cgroups;
      }
      return obj;
    };

    if (camlist) {
      let clist = camlist.cameras;
      let robj = fixCameraList(clist);
      if (clist.groups) setGroups(clist.groups);
      else setGroups(null);
      if (clist.cameras) setCameras(clist.cameras);
      else setCameras(null);
      onPlayUri(robj.playuri, robj.is_main_stream);
    }
  }, [camlist, onPlayUri]);

  /** 用户点击摄像头 */
  const onClickCamera = (cam) => {
    cam.selected = true;
  };

  const genCameraList = (clist) => {
    clist.map((cam) => (
      <div key={cam.oid} className="camera_container">
        {cam.status === 1 ? (
          cam.selected ? (
            <FaVideo className="icon enable selected" />
          ) : (
            <FaVideo className="icon enable" />
          )
        ) : (
          <FaVideoSlash className="icon" />
        )}
        <p>{cam.name}</p>
      </div>
    ));
  };

  const genSubCamList = (clist) => {
    clist.map((cam) =>
      cam.status === 1 ? (
        cam.selected ? (
          <div key={cam.oid} className="camera_row_container enable selected">
            <FaVideo className="icon" />
            <p>{cam.name}</p>
          </div>
        ) : (
          <div className="camera_row_container enable">
            <FaVideo className="icon" />
            <p>{cam.name}</p>
          </div>
        )
      ) : (
        <div className="camera_row_container">
          <FaVideo className="icon" />
          <p>{cam.name}</p>
        </div>
      )
    );
  };

  const genGroupList = (glist) => {
    glist.map((group) => (
      <div key={group.gid} className="camera_container">
        group.selected ? <FaServer className="icon enable selected" /> :
        group.selected ? <FaServer className="icon enable" />
        <p>{group.name}</p>
      </div>
    ));
  };

  return (
    <div className="container">
      <div className="camera_container">
        <FaVideo className="icon enable" />
        <p>中一班</p>
      </div>
      <div className="camera_container">
        <FaVideo className="icon enable" />
        <p>中小二班</p>
      </div>
      <div className="camera_container">
        <FaVideoSlash className="icon" />
        <p>中三班</p>
      </div>
    </div>
  );
}
