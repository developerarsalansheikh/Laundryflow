import React from 'react';
import { View } from 'react-native';

export const GestureHandlerRootView = ({ children, style, ...props }) => {
  return React.createElement(View, { style: [{ flex: 1 }, style], ...props }, children);
};

export default {
  GestureHandlerRootView,
};
