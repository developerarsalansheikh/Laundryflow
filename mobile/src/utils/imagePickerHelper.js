import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// ─────────────────────────────────────────────────────────
//  Internal: open Android app settings so user can
//  manually grant camera permission after permanent denial.
// ─────────────────────────────────────────────────────────
const openAppSettings = () => {
  Linking.openSettings().catch(() => {
    Alert.alert('Unable to Open Settings', 'Please open Settings manually and grant Camera permission.');
  });
};

// ─────────────────────────────────────────────────────────
//  Request Android CAMERA runtime permission.
//
//  Returns:
//    'granted'           → permission is already/newly granted
//    'denied'            → user tapped Deny (can ask again next time)
//    'never_ask_again'   → permanently denied (show Settings option)
// ─────────────────────────────────────────────────────────
export const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return 'granted';

  try {
    // First check current status without showing a dialog
    const currentStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    if (currentStatus) return 'granted';

    // Not granted — request the runtime permission
    // NOTE: android.permission.CAMERA must be in AndroidManifest.xml
    // or Android will silently return DENIED without showing any dialog.
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission Required',
        message:
          'LaundryFlow needs camera access to take the pickup photo. ' +
          'This photo is required to confirm collection from the customer.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
        buttonNeutral: 'Ask Me Later',
      }
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'never_ask_again';
    }
    return 'denied';
  } catch (err) {
    console.warn('Camera permission request error:', err);
    return 'denied';
  }
};

// ─────────────────────────────────────────────────────────
//  Capture photo using device camera.
//  Returns the asset object, or null on cancel/error.
// ─────────────────────────────────────────────────────────
export const captureImageFromCamera = async (options = {}) => {
  const permissionStatus = await requestCameraPermission();

  if (permissionStatus === 'never_ask_again') {
    Alert.alert(
      'Camera Permission Blocked',
      'Camera access has been permanently denied. Please open Settings and enable Camera permission for LaundryFlow.',
      [
        { text: 'Open Settings', onPress: openAppSettings },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    return null;
  }

  if (permissionStatus !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Camera permission is required to capture the pickup photo. Please allow camera access when prompted.',
      [{ text: 'OK', style: 'default' }]
    );
    return null;
  }

  // Permission granted — open camera
  try {
    const result = await launchCamera({
      mediaType: 'photo',
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.85,
      saveToPhotos: false,
      ...options,
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      Alert.alert('Camera Error', result.errorMessage || 'Could not capture photo. Please try again.');
      return null;
    }

    const asset = result.assets && result.assets[0];
    return asset || null;
  } catch (err) {
    console.error('captureImageFromCamera error:', err);
    Alert.alert('Camera Error', err.message || 'Unable to open camera. Please try again.');
    return null;
  }
};

// ─────────────────────────────────────────────────────────
//  Capture PICKUP PROOF PHOTO — goes directly to camera
//  (no gallery choice). This is for the mandatory
//  "Collect From Customer" pickup photo flow.
//
//  Usage:
//    capturePickupPhoto().then(asset => { if (asset) ... });
// ─────────────────────────────────────────────────────────
export const capturePickupPhoto = async () => {
  return captureImageFromCamera({ saveToPhotos: false });
};

// ─────────────────────────────────────────────────────────
//  Pick image from device gallery
// ─────────────────────────────────────────────────────────
export const pickImageFromGallery = async (options = {}) => {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.85,
      selectionLimit: 1,
      ...options,
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      Alert.alert('Gallery Error', result.errorMessage || 'Could not select photo from gallery.');
      return null;
    }

    const asset = result.assets && result.assets[0];
    return asset || null;
  } catch (err) {
    console.error('pickImageFromGallery error:', err);
    Alert.alert('Photo Selection Error', err.message || 'Unable to access photo gallery.');
    return null;
  }
};

// ─────────────────────────────────────────────────────────
//  Show action sheet to choose between Camera and Gallery.
//  Used for profile/optional photos — NOT for pickup proof.
// ─────────────────────────────────────────────────────────
export const promptImageSource = (onImageSelected) => {
  Alert.alert(
    'Upload Photo',
    'Choose a photo source',
    [
      {
        text: '📸 Take Photo',
        onPress: async () => {
          const asset = await captureImageFromCamera();
          if (asset) onImageSelected(asset);
        },
      },
      {
        text: '🖼️ Choose from Gallery',
        onPress: async () => {
          const asset = await pickImageFromGallery();
          if (asset) onImageSelected(asset);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};

export default {
  pickImageFromGallery,
  captureImageFromCamera,
  capturePickupPhoto,
  promptImageSource,
  requestCameraPermission,
};
