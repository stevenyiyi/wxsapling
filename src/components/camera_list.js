import React from "react";
import PropTypes from "prop-types";
import { FaVideo, FaVideoSlash, FaServer } from "react-icons/fa";
import "./camera_list.css";
export default function CameraList(props) {
  const { camlist, onPlayUri } = props;
  const [cameras, setCameras] = React.useState(null);
  const [groups, setGroups] = React.useState(null);
  const [currentCamera, setCurrentCamera] = React.useState(null);

  /** 根据oid产生播放地址 */
  const genPlayUri = (oid) => {
    let uri = "/live/" + oid + "_master.m3u8";
    return uri;
  };

  React.useEffect(() => {
    /** 给每一个camera 增加属性 'selected' 并返回默认选择播放的url及是否用主码流*/
    const fixCameraList = (clist) => {
      // 预处理 camlist
      let obj = { playuri: "", is_main_stream: true };
      if (clist.cameras) {
        let dcams = clist.cameras.map((cam) => {
          if (cam.status === 1 && !obj.playuri) {
            cam["selected"] = true;
            obj.playuri = genPlayUri(cam.oid);
            obj.is_main_stream = cam.is_main_stream;
            setCurrentCamera(cam);
          } else {
            cam["selected"] = false;
          }
          return cam;
        });
        clist.cameras = dcams;
      }
      if (clist.groups) {
        let cgroups = clist.groups.map((group) => {
          group.selected = false;
          group.show = false;
          group.cameras.forEach((cam, index, theArray) => {
            theArray[index].group = group;
            if (cam.status === 1 && !obj.playuri) {
              theArray[index].selected = true;
              group.selected = true;
              obj.playuri = genPlayUri(cam.oid);
              obj.is_main_stream = cam.is_main_stream;
              setCurrentCamera(theArray[index]);
            } else {
              theArray[index].selected = false;
            }
          });
          return group;
        });
        clist.groups = cgroups;
      }
      return obj;
    };

    if (camlist) {
      let clist = camlist;
      let robj = fixCameraList(clist);
      if (clist.groups && clist.groups.length === 1) {
        /// Merge to cameras
        let cams = clist.cameras || [];
        let newcams = cams.concat(clist.groups[0].cameras);
        setCameras(newcams);
      } else {
        if (clist.groups) setGroups(clist.groups);
        if (clist.cameras) setCameras(clist.cameras);
      }

      if (robj.playuri) {
        onPlayUri(robj.playuri, robj.is_main_stream);
      }
    }
  }, [camlist, onPlayUri]);

  /** 用户点击摄像头 */
  const onClickCamera = (cam) => {
    if (currentCamera) {
      currentCamera.selected = false;
      if (currentCamera.group) {
        currentCamera.group.selected = false;
      }
    }

    cam.selected = true;
    if (cam.group) {
      cam.group.selected = true;
      cam.group.show = false;
    }

    setCurrentCamera(cam);
    /// Update container
    if (cameras) setCameras([...cameras]);
    if (groups) setGroups([...groups]);

    onPlayUri(genPlayUri(cam.oid), cam.is_main_stream);
  };

  /** 用户点击group */
  const onClickGroup = (group) => {
    group.show = !group.show;
    setGroups([...groups]);
  };

  const genCameraList = () =>
    cameras.map((cam) => (
      <div key={cam.oid} className="camera_container">
        {cam.status === 1 ? (
          <span
            className={
              cam.selected ? "largeicon enable selected" : "largeicon enable"
            }
            onClick={(event) => onClickCamera(cam)}
          >
            <FaVideo />
          </span>
        ) : (
          <span className="largeicon">
            <FaVideoSlash />
          </span>
        )}
        <p>{cam.name}</p>
      </div>
    ));

  const genSubCamList = (clist) =>
    clist.map((cam) =>
      cam.status === 1 ? (
        <div
          key={cam.oid}
          className={
            cam.selected
              ? "camera_row_container enable selected"
              : "camera_row_container enable"
          }
          onClick={(event) => onClickCamera(cam)}
        >
          <span className="smallicon">
            <FaVideo />
          </span>
          <p>{cam.name}</p>
        </div>
      ) : (
        <div className="camera_row_container">
          <span className="smallicon">
            <FaVideo />
          </span>
          <p>{cam.name}</p>
        </div>
      )
    );

  const genGroupList = () =>
    groups.map((group) => (
      <div key={group.gid} className="camera_container">
        <span
          className={
            group.selected ? "largeicon enable selected" : "largeicon enable"
          }
          onClick={(event) => onClickGroup(group)}
        >
          <FaServer />
        </span>
        <div
          className={
            group.show ? "cameras_sub_container show" : "cameras_sub_container"
          }
        >
          {genSubCamList(group.cameras)}
        </div>
        <p>{group.name}</p>
      </div>
    ));

  return (
    <div className={groups ? "devlist_container" : "devlist_container scrollx"}>
      {cameras && genCameraList()}
      {groups && genGroupList()}
    </div>
  );
}

CameraList.propTypes = {
  camlist: PropTypes.object.isRequired,
  onPlayUri: PropTypes.func.isRequired
};

CameraList.defaultProps = {
  camlist: {
    cameras: [],
    groups: [
      {
        gid: "3214124121324",
        name: "北碚紫荆花幼儿园",
        cameras: [
          { oid: "142313441234123", name: "中一班", status: 1 },
          { oid: "142313441141231", name: "中二班", status: 1 },
          { oid: "142313441141232", name: "中二班", status: 1 },
          { oid: "142313441141233", name: "中二班", status: 1 },
          { oid: "142313441141234", name: "中二班", status: 1 },
          { oid: "142313441141235", name: "中二班", status: 1 },
          { oid: "142313441141236", name: "中二班", status: 1 }
        ]
      }
    ]
  },
  onPlayUri: () => {}
};