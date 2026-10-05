import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../store/networkStore';
import Text from './Text';

/**
 * Lightweight, non-intrusive Offline / Online Recovery Banner (RN-9)
 * Slides smoothly in and out without blocking screen interaction.
 */
export const OfflineBanner = () => {
  const insets = useSafeAreaInsets();
  const isConnected = useNetworkStore((state) => state.isConnected);
  const wasOffline = useNetworkStore((state) => state.wasOffline);
  const clearWasOffline = useNetworkStore((state) => state.clearWasOffline);

  const [slideAnim] = useState(new Animated.Value(-60));
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      // Slide down banner when offline
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (wasOffline) {
      // Temporarily show "Back online" toast for 2.5 seconds
      setShowOnlineToast(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowOnlineToast(false);
          clearWasOffline();
        });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Slide up and hide
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, wasOffline, clearWasOffline, slideAnim]);

  if (isConnected && !showOnlineToast) {
    return null;
  }

  const isBackOnline = isConnected && showOnlineToast;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
          transform: [{ translateY: slideAnim }],
          backgroundColor: isBackOnline ? '#059669' : '#DC2626',
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text variant="caption" weight="bold" style={styles.title}>
          {isBackOnline ? '✓ Back online' : '⚠️ No internet connection'}
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          {isBackOnline
            ? 'Connection restored. Data is up to date.'
            : 'Some features may be unavailable. Browsing cached data.'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#F8FAFC',
    opacity: 0.9,
    fontSize: 11,
  },
});

export default OfflineBanner;
