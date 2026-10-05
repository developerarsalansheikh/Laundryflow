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
import ErrorState from '../../components/ui/ErrorState';

export const RegisterScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.register({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password,
      });

      // Navigate to OTP verification for phone confirmation
      navigation.navigate('VerifyOTP', {
        phone: trimmedPhone,
        mode: 'register',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
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
            Create Account
          </Text>
          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs }}>
            Join LaundryFlow for quick, reliable laundry pickups
          </Text>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Registration Error" message={errorMessage} />
            </View>
          )}

          <Input
            label="Full Name"
            placeholder="John Doe"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Email Address"
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Mobile Number"
            placeholder="10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            helperText="Used for order tracking and delivery coordination"
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Create Account"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !name || !email || phone.length < 10 || password.length < 6}
            onPress={handleRegister}
          />

          <View style={styles.signInRow}>
            <Text variant="bodySmall" colorVariant="secondary">
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                Sign In
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
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  guestRow: {
    marginTop: 16,
  },
});

export default RegisterScreen;
