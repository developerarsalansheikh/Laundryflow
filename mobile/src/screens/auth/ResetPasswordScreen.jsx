import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { authService } from '../../services/authService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorState from '../../components/ui/ErrorState';

export const ResetPasswordScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const initialToken = route.params?.token || '';
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setErrorMessage('Please enter your reset token');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.resetPassword({
        token: trimmedToken,
        newPassword,
      });
      setResetSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired reset token. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.headerArea}>
          <Text variant="h1" weight="bold" colorVariant="primary">
            New Password
          </Text>
          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs }}>
            Set a new secure password for your account
          </Text>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Reset Failed" message={errorMessage} />
            </View>
          )}

          {resetSuccess ? (
            <View style={styles.successContainer}>
              <Badge label="PASSWORD UPDATED" variant="success" size="md" />
              <Text variant="h3" weight="semibold" align="center" style={{ marginTop: spacing.md }}>
                Password Reset Successfully!
              </Text>
              <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
                Your password has been changed. You can now sign in with your new credentials.
              </Text>

              <Button
                title="Sign In Now"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          ) : (
            <View>
              <Input
                label="Reset Token"
                placeholder="Paste token from email"
                autoCapitalize="none"
                value={token}
                onChangeText={setToken}
                containerStyle={{ marginBottom: spacing.md }}
              />

              <Input
                label="New Password"
                placeholder="At least 6 characters"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                containerStyle={{ marginBottom: spacing.md }}
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                containerStyle={{ marginBottom: spacing.lg }}
              />

              <Button
                title="Update Password"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !token.trim() || newPassword.length < 6 || confirmPassword.length < 6}
                onPress={handleReset}
              />

              <View style={styles.backRow}>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text variant="bodySmall" weight="semibold" style={{ color: colors.primary }}>
                    ← Back to Sign In
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </Card>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authCard: {
    width: '100%',
    padding: 24,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backRow: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default ResetPasswordScreen;
