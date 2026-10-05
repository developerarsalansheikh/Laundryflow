import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorState from '../../components/ui/ErrorState';

export const VerifyOTPScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const { phone = '', mode = 'login' } = route.params || {};
  const consumePendingIntent = useAuthStore((state) => state.consumePendingIntent);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      let authResponse;
      if (mode === 'register') {
        authResponse = await authService.verifyRegisterOTP({ phone, otp: trimmedOtp });
      } else {
        authResponse = await authService.verifyCustomerLoginOTP({ phone, otp: trimmedOtp });
      }

      const role = authResponse?.data?.user?.role || useAuthStore.getState().role;
      // If role is admin or delivery, RootNavigator automatically switches to the respective navigator
      if (role === 'user' || !role) {
        const intent = consumePendingIntent();
        if (intent?.returnTo) {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'CustomerHome' },
              { name: intent.returnTo, params: intent.payload },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CustomerHome' }],
          });
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrorMessage('');
    setResendSuccess(false);

    try {
      await authService.resendOTP(phone);
      setResendSuccess(true);
      setCountdown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to resend OTP. Please wait before retrying.');
    } finally {
      setResending(false);
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
            Verify Mobile
          </Text>
          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs }}>
            We've sent a 6-digit code to{' '}
            <Text weight="bold" colorVariant="primary">
              +91 {phone}
            </Text>
          </Text>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Verification Error" message={errorMessage} />
            </View>
          )}

          {resendSuccess && (
            <View style={[styles.successBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Badge label="OTP RESENT" variant="success" size="sm" />
              <Text variant="bodySmall" colorVariant="primary" style={{ marginTop: 4 }}>
                A fresh verification code has been dispatched to your phone.
              </Text>
            </View>
          )}

          <Input
            label="Enter 6-Digit OTP"
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            helperText="Enter the OTP received on SMS"
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Verify & Continue"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || otp.trim().length < 6}
            onPress={handleVerify}
          />

          {/* Resend & Timer Row */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text variant="bodySmall" colorVariant="secondary">
                Resend code in{' '}
                <Text weight="semibold" style={{ color: colors.primary }}>
                  {countdown}s
                </Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                  {resending ? 'Sending OTP...' : 'Resend Verification Code'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.changePhoneRow}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text variant="caption" colorVariant="muted">
                Wrong number? <Text weight="semibold" style={{ color: colors.primary }}>Change Phone Number</Text>
              </Text>
            </Pressable>
          </View>
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
  successBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  changePhoneRow: {
    alignItems: 'center',
    marginTop: 12,
  },
});

export default VerifyOTPScreen;
