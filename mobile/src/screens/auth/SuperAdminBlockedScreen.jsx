import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const SuperAdminBlockedScreen = () => {
  const { colors, spacing } = useTheme();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await authService.logout();
  };

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.container}
    >
      <View style={styles.content}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.badgeWrapper}>
            <Badge label="WEB PORTAL ONLY" variant="warning" size="md" />
          </View>

          <Text variant="h2" weight="bold" align="center" style={{ marginBottom: spacing.sm }}>
            Super Admin Access
          </Text>

          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginBottom: spacing.lg }}>
            Global Operations & System Administration
          </Text>

          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text variant="body" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
              Hello, <Text weight="bold">{user?.name || 'Administrator'}</Text>
            </Text>
            <Text variant="bodySmall" colorVariant="secondary" style={{ lineHeight: 20 }}>
              Super Admin controls, platform governance, and partner settlements are managed exclusively through the desktop LaundryFlow Web Application.
            </Text>
          </View>

          <View style={[styles.urlBox, { backgroundColor: colors.backgroundElevated, borderColor: colors.cardBorder }]}>
            <Text variant="caption" colorVariant="muted" align="center">
              Please visit from your desktop browser:
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center" style={{ marginTop: 4 }}>
              https://admin.laundryflow.com
            </Text>
          </View>

          <Button
            title="Log Out & Return to Marketplace"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleLogout}
            style={{ marginTop: spacing.xl }}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    padding: 28,
    alignItems: 'center',
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  infoBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  urlBox: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default SuperAdminBlockedScreen;
