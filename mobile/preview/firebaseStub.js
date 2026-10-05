const messagingInstance = {
  requestPermission: async () => 1,
  getToken: async () => 'mock-web-fcm-token',
  onMessage: () => () => {},
  onTokenRefresh: () => () => {},
  onNotificationOpenedApp: () => () => {},
  getInitialNotification: async () => null,
  deleteToken: async () => {},
};

export const AuthorizationStatus = {
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  DENIED: 0,
};

const messagingFn = () => messagingInstance;
messagingFn.AuthorizationStatus = AuthorizationStatus;

export default messagingFn;
