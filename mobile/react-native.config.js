module.exports = {
  dependencies: {
    'react-native-config': {
      platforms: {
        android: null, // Avoid AGP 8.6.0 variant error and Bridgeless NativeModule crash
      },
    },
  },
};

