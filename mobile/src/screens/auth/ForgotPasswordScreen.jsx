import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { authService } from '../../services/authService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorState from '../../components/ui/ErrorState';

export const ForgotPasswordScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.forgotPassword(trimmedEmail);
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to process password reset. Please try again.');
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
            Reset Password
          </Text>
          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs }}>
            Enter your registered email to receive reset instructions
          </Text>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Request Error" message={errorMessage} />
            </View>
          )}

          {submitted ? (
            <View style={styles.successContainer}>
              <Badge label="EMAIL DISPATCHED" variant="success" size="md" />
              <Text variant="h3" weight="semibold" align="center" style={{ marginTop: spacing.md }}>
                Check Your Inbox
              </Text>
              <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
                We've sent password reset instructions to{' '}
                <Text weight="bold" colorVariant="primary">{email}</Text>.
              </Text>

              <Button
                title="I have a reset token"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => navigation.navigate('ResetPassword')}
                style={{ marginBottom: spacing.md }}
              />

              <Button
                title="Return to Sign In"
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          ) : (
            <View>
              <Input
                label="Email Address"
                placeholder="registered@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                helperText="We will send a secure password reset token"
                containerStyle={{ marginBottom: spacing.lg }}
              />

              <Button
                title="Send Reset Instructions"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !email.trim()}
                onPress={handleSubmit}
              />

              <View style={styles.backRow}>
                <Pressable onPress={() => navigation.goBack()}>
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

export default ForgotPasswordScreen;
