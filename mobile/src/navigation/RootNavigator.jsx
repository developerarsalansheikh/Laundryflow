import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { USER_ROLES } from '../constants/roles';
import { useTheme } from '../theme';
import CustomerNavigator from './CustomerNavigator';
import AdminNavigator from './AdminNavigator';
import DeliveryNavigator from './DeliveryNavigator';
import SuperAdminBlockedScreen from '../screens/auth/SuperAdminBlockedScreen';
import { authService } from '../services/authService';

export const RootNavigator = () => {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Session restoration: Attempt token refresh on startup if authenticated
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      authService.refreshToken().catch(() => {
        // Handled silently: if refresh fails, authService.refreshToken() clears session
        // and user smoothly falls back to Guest browsing on CustomerNavigator.
      });
    }
  }, [isHydrated]);

  // Show minimal splash loader while MMKV rehydrates the persisted state
  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors?.background || '#F8FAFC' }]}>
        <ActivityIndicator
          size="large"
          color={colors?.primary || '#2563EB'}
          style={{ width: 36, height: 36 }}
        />
      </View>
    );
  }

  // If NOT authenticated -> Open Customer Marketplace directly as Guest (Never force login on launch)
  if (!isAuthenticated) {
    return <CustomerNavigator />;
  }

  // Authenticated user -> Role-based navigation
  switch (role) {
    case USER_ROLES.SUPERADMIN:
      // Block mobile access for superadmin, direct to Web portal
      return <SuperAdminBlockedScreen />;

    case USER_ROLES.ADMIN:
      return <AdminNavigator />;

    case USER_ROLES.DELIVERY:
      return <DeliveryNavigator />;

    case USER_ROLES.USER:
    default:
      return <CustomerNavigator />;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
