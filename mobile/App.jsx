import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { QueryProvider } from './src/api/queryClient';
import { RootNavigator } from './src/navigation';
import { GlobalLoadingOverlay } from './src/components';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/ui/OfflineBanner';
import { useTheme } from './src/theme';
import { mobileNotificationService } from './src/services/mobileNotificationService';
import { useAuthStore } from './src/store/authStore';

const NavigationThemeSync = ({ navigationRef }) => {
  const { isDark, colors } = useTheme();
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  // ── FCM Listeners (mounted once after auth is hydrated) ──────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const navRef = navigationRef?.current;

    // Setup notification-open handlers (background + quit state)
    mobileNotificationService.setupNotificationOpenHandlers(navRef, role || 'user');

    // Foreground notification listener
    const unsubForeground = mobileNotificationService.setupForegroundNotificationListener(
      (remoteMessage) => {
        // In-app notification: backend already saved it to DB via FCM.
        // We just log — the existing in-app notification screens will show it.
        console.log(
          '[FCM Foreground] Received:',
          remoteMessage?.data?.notificationType,
          '| orderId:', remoteMessage?.data?.orderId
        );
      }
    );

    // Token refresh listener
    const unsubRefresh = mobileNotificationService.setupTokenRefreshListener();

    return () => {
      unsubForeground?.();
      unsubRefresh?.();
    };
  }, [isAuthenticated, role]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <OfflineBanner />
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <GlobalLoadingOverlay />
    </>
  );
};

export default function App() {
  const navigationRef = useRef(null);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <NavigationThemeSync navigationRef={navigationRef} />
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

