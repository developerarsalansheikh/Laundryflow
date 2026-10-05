import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// ── Firebase Background Message Handler ────────────────────────────────────
// IMPORTANT: Must be registered BEFORE AppRegistry.registerComponent
// This runs in a headless JS context when the app is in background/quit state
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  // Background messages are automatically shown as system notifications by FCM.
  // We only need to handle data-only messages here if needed.
  console.log('[FCM Background] Message received:', remoteMessage?.data?.notificationType);
});

AppRegistry.registerComponent(appName, () => App);

