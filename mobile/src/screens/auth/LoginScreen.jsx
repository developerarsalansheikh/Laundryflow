import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export const LoginScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const pendingIntent = useAuthStore((state) => state.pendingIntent);
  const consumePendingIntent = useAuthStore((state) => state.consumePendingIntent);

  // 'credentials' (Email/Phone + Password) vs 'phone_otp' (Phone OTP)
  const [authMode, setAuthMode] = useState('credentials'); 
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Credentials Login (Email/Phone + Password)
  const handleCredentialsLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setErrorMessage('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await authService.loginWithEmailPassword({
        email: trimmedIdentifier,
        password,
      });

      const userRole = response?.data?.user?.role;

      // If a customer logged in with email/phone + password, consume intent and reset stack cleanly
      if (userRole === 'user') {
        const intent = consumePendingIntent();
        if (intent?.returnTo) {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'CustomerHome' },
              { name: intent.returnTo, params: intent.payload },
            ],
          });
          return;
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'CustomerHome' }],
        });
      }
      // Note: Admin/Delivery roles automatically trigger RootNavigator transition!
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Invalid email/phone or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer Phone OTP Login
  const handleCustomerPhoneLogin = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.loginCustomerWithPhone(trimmedPhone);
      navigation.navigate('VerifyOTP', {
        phone: trimmedPhone,
        mode: 'login',
      });
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Unable to send OTP. Please verify your phone number.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In is not configured for this mobile build. Please sign in using your registered Phone OTP or Email & Password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Brand Header */}
        <View style={styles.headerArea}>
          <View style={styles.logoBadge}>
            <View style={styles.washerIcon}>
              <View style={styles.washerOuter}>
                <View style={styles.washerDoor}>
                  <View style={styles.washerWater} />
                </View>
              </View>
              <View style={styles.bubble1} />
              <View style={styles.bubble2} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text variant="h1" weight="bold" style={styles.brandTitle}>
                Laundry<Text style={{ color: colors.primary }}>Flow</Text>
              </Text>
              <Text variant="caption" style={styles.tagline}>
                Fresh Clothes, On Demand
              </Text>
            </View>
          </View>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {/* Welcome Titles */}
          <Text variant="h2" weight="bold" colorVariant="primary" style={styles.welcomeTitle}>
            Welcome Back!
          </Text>
          <Text variant="bodySmall" colorVariant="secondary" style={styles.welcomeSubtitle}>
            {authMode === 'credentials'
              ? 'Sign in to continue managing your wash'
              : 'Enter your phone number to receive a one-time login code'}
          </Text>

          {/* Pending Intent Alert */}
          {Boolean(pendingIntent) && (
            <View style={[styles.intentBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Badge label="BASKET SAVED" variant="success" size="sm" />
              <Text variant="bodySmall" colorVariant="primary" style={{ marginTop: 4 }}>
                Sign in to complete your order. Your selected laundry & services are preserved.
              </Text>
            </View>
          )}

          {/* Error Message */}
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Authentication Error" message={errorMessage} />
            </View>
          )}

          {authMode === 'credentials' ? (
            /* Email / Phone + Password Flow */
            <View style={styles.formContent}>
              <Input
                label="Email / Phone"
                placeholder="example@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setErrorMessage('');
                }}
                leftIcon={<Text style={{ fontSize: 16 }}>✉️</Text>}
                containerStyle={{ marginBottom: spacing.sm }}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordPress}
              >
                <Text variant="caption" weight="semibold" style={{ color: colors.primary }}>
                  Forgot Password?
                </Text>
              </Pressable>

              <Button
                title="Sign In"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !identifier.trim() || !password}
                onPress={handleCredentialsLogin}
                style={styles.signInButton}
              />
            </View>
          ) : (
            /* Phone OTP Flow */
            <View style={styles.formContent}>
              <Input
                label="Mobile Number"
                placeholder="Enter 10-digit number (e.g. 9876543210)"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setErrorMessage('');
                }}
                leftIcon={<Text style={{ fontSize: 16 }}>📞</Text>}
                helperText="We will send a 6-digit one-time verification code via SMS"
                containerStyle={{ marginBottom: spacing.md }}
              />

              <Button
                title="Send Verification Code"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || phone.trim().length < 10}
                onPress={handleCustomerPhoneLogin}
                style={styles.signInButton}
              />

              <Pressable
                onPress={() => {
                  setAuthMode('credentials');
                  setErrorMessage('');
                }}
                style={styles.switchModePress}
              >
                <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                  ← Back to Email / Password Sign In
                </Text>
              </Pressable>
            </View>
          )}

          {/* Social / Alternative Sign In Options */}
          {authMode === 'credentials' && (
            <>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderLight || '#E2E8F0' }]} />
                <Text variant="caption" colorVariant="muted" style={styles.dividerText}>
                  or sign in with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderLight || '#E2E8F0' }]} />
              </View>

              <View style={styles.socialButtonsContainer}>
                {/* Continue with Google */}
                <Pressable
                  style={[styles.socialButton, { borderColor: colors.borderLight || '#E2E8F0' }]}
                  onPress={handleGoogleSignIn}
                  android_ripple={{ color: '#E2E8F0' }}
                >
                  <View style={styles.googleIconBadge}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>G</Text>
                  </View>
                  <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                    Continue with Google
                  </Text>
                </Pressable>

                {/* Continue with Phone */}
                <Pressable
                  style={[styles.socialButton, { borderColor: colors.borderLight || '#E2E8F0' }]}
                  onPress={() => {
                    setAuthMode('phone_otp');
                    setErrorMessage('');
                  }}
                  android_ripple={{ color: '#E2E8F0' }}
                >
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📞</Text>
                  <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                    Continue with Phone
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Sign Up Redirect */}
          <View style={styles.signupRow}>
            <Text variant="bodySmall" colorVariant="secondary">
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                Sign Up
              </Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Pressable onPress={() => navigation.navigate('ApplyLaundryAdmin')}>
              <Text variant="caption" style={{ color: colors.secondary, textDecorationLine: 'underline' }}>
                Laundry Owner? Apply as Laundry Admin
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  washerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    position: 'relative',
  },
  washerOuter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  washerDoor: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#0284C7',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  washerWater: {
    width: '100%',
    height: '50%',
    backgroundColor: '#38BDF8',
  },
  bubble1: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  bubble2: {
    position: 'absolute',
    top: 6,
    right: -7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0284C7',
  },
  brandTitle: {
    fontSize: 26,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
    letterSpacing: 0.2,
  },
  authCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    marginBottom: 20,
    lineHeight: 18,
  },
  intentBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  formContent: {
    width: '100%',
  },
  forgotPasswordPress: {
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  signInButton: {
    borderRadius: 14,
    marginTop: 4,
  },
  switchModePress: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
  },
  socialButtonsContainer: {
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
});

export default LoginScreen;
