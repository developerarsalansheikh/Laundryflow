export const launchCamera = (options, callback) => callback && callback({ didCancel: true });
export const launchImageLibrary = (options, callback) => callback && callback({ didCancel: true });
export default {
  launchCamera,
  launchImageLibrary,
};
