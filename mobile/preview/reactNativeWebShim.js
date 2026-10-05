import * as RNW from 'react-native-web';

export * from 'react-native-web';

export const PermissionsAndroid = {
  PERMISSIONS: {
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: async () => 'granted',
  check: async () => true,
};

export default {
  ...RNW,
  PermissionsAndroid,
};
