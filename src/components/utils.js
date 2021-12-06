const parseFrom = (from) => {
  /** name:avatar@username */
  let fidx = from.lastIndexOf("@");
  if (fidx < 0) {
    throw Error(`Invalid message from field:${from}`);
  }
  let name_and_avatar = from.substring(0, fidx);
  let uid = from.substring(fidx + 1);
  let spair = name_and_avatar.split(":");
  if (spair.length !== 2) {
    throw Error(`Invalid message from field:${from}`);
  }
  return {
    username: uid,
    name: spair[0],
    avatar: spair[1]
  };
};

/** 根据oid产生播放地址 */
const genPlayUri = (oid) => {
  let uri = "https://anylooker.com/live/" + oid + "_master.m3u8";
  return uri;
};
export { parseFrom, genPlayUri };
