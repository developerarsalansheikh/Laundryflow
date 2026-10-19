import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../store/networkStore';
import { healthService } from '../../services/healthService';
import { queryClient } from '../../api/queryClient';
import Text from './Text';

/**
 * Enhanced Offline, Cold-Start & Server Reachability Banner (RN-9)
 * Displays friendly connection state (Offline, Waking Up, or Server Down)
 * with a responsive manual "Retry" action.
 */
export const OfflineBanner = () => {
  const insets = useSafeAreaInsets();
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isServerReachable = useNetworkStore((state) => state.isServerReachable);
  const isColdStarting = useNetworkStore((state) => state.isColdStarting);
  const lastErrorType = useNetworkStore((state) => state.lastErrorType);
  const wasOffline = useNetworkStore((state) => state.wasOffline);
  const clearWasOffline = useNetworkStore((state) => state.clearWasOffline);

  const [slideAnim] = useState(new Animated.Value(-80));
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const shouldShow = !isConnected || !isServerReachable || isColdStarting || showOnlineToast;

  useEffect(() => {
    if (!isConnected || !isServerReachable || isColdStarting) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (wasOffline) {
      setShowOnlineToast(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowOnlineToast(false);
          clearWasOffline();
        });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, isServerReachable, isColdStarting, wasOffline, clearWasOffline, slideAnim]);

  const handleManualRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const res = await healthService.checkServerHealth(true);
      if (res?.ok) {
        // Refetch active queries so any failed screen data immediately loads
        queryClient.invalidateQueries();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (!shouldShow) {
    return null;
  }

  // Determine banner theme and content
  let bgColor = '#DC2626'; // Default offline red
  let title = '⚠️ No internet connection';
  let subtitle = 'Some features may be unavailable. Browsing cached data.';
  let showRetry = false;

  if (showOnlineToast && isConnected && isServerReachable) {
    bgColor = '#059669'; // Emerald green
    title = '✓ Back online';
    subtitle = 'Connection restored. Data is up to date.';
  } else if (!isConnected) {
    bgColor = '#DC2626';
    title = '⚠️ Offline';
    subtitle = 'Please check your Wi-Fi or mobile data connection.';
    showRetry = true;
  } else if (isColdStarting) {
    bgColor = '#D97706'; // Amber
    title = '⚡ Cloud server is waking up';
    subtitle = 'Render cold start in progress. This usually takes 30-50s.';
    showRetry = true;
  } else if (!isServerReachable) {
    bgColor = '#EA580C'; // Orange
    title = '📡 Server temporarily unreachable';
    subtitle = 'Unable to connect to backend. Tap retry to reconnect.';
    showRetry = true;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
          transform: [{ translateY: slideAnim }],
          backgroundColor: bgColor,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <Text variant="caption" weight="bold" style={styles.title}>
            {title}
          </Text>
          <Text variant="caption" style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        {showRetry && !showOnlineToast && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleManualRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text variant="caption" weight="bold" style={styles.retryButtonText}>
                Retry
              </Text>
            )}
          </TouchableOpacity>
        )}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#F8FAFC',
    opacity: 0.9,
    fontSize: 11,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default OfflineBanner;
