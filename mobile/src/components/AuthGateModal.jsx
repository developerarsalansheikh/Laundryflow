import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Text from './ui/Text';

/**
 * LaundryFlow AuthGateModal
 * Reusable authentication gate for protected customer marketplace actions.
 * Prompts guests gracefully without looking like an error.
 */
export const AuthGateModal = ({
  visible = false,
  onClose,
  title = 'Sign in to continue',
  description = 'Create an account or sign in to place your laundry order.',
  pendingIntent = null,
  onLogin,
  onRegister,
}) => {
  const { spacing, colors } = useTheme();
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch {
    navigation = null;
  }
  const setPendingIntent = useAuthStore((state) => state.setPendingIntent);

  const handleLoginPress = () => {
    if (pendingIntent) {
      setPendingIntent(pendingIntent);
    }
    if (onClose) {
      onClose();
    }
    if (onLogin) {
      onLogin();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  const handleRegisterPress = () => {
    if (pendingIntent) {
      setPendingIntent(pendingIntent);
    }
    if (onClose) {
      onClose();
    }
    if (onRegister) {
      onRegister();
    } else if (navigation?.navigate) {
      navigation.navigate('Register');
    }
  };

  const handleContinueBrowsing = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      title={title}
      description={description}
      footer={
        <View style={styles.buttonStack}>
          <Button
            title="Login"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleLoginPress}
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title="Create Account"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={handleRegisterPress}
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title="Continue Browsing"
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleContinueBrowsing}
          />
        </View>
      }
    >
      <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text variant="bodySmall" colorVariant="secondary" align="center">
          ⚡ Quick, seamless OTP verification. Your basket and selected laundry store will be preserved.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonStack: {
    width: '100%',
    alignItems: 'stretch',
  },
  infoBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
});

export default AuthGateModal;
