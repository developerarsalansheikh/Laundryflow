import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

export const ApplyLaundryAdminScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  // Laundry / Store info
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Owner info
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmedStoreName = storeName.trim();
    const trimmedOwnerName = ownerName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedState = stateName.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedStoreName) {
      setErrorMessage('Please enter the laundry store name');
      return;
    }
    if (!trimmedOwnerName) {
      setErrorMessage('Please enter your full name (Owner Name)');
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
    if (!trimmedAddress) {
      setErrorMessage('Please enter store address');
      return;
    }
    if (!trimmedCity) {
      setErrorMessage('Please enter city');
      return;
    }
    if (!trimmedState) {
      setErrorMessage('Please enter state');
      return;
    }
    if (!trimmedPincode || trimmedPincode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.applyLaundryAdmin({
        name: trimmedStoreName,
        ownerName: trimmedOwnerName,
        ownerPassword: password,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
      });

      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to submit application. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <ScreenContainer scrollable contentContainerStyle={styles.container}>
        <View style={styles.keyboardView}>
          <Card variant="elevated" style={styles.authCard}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Badge variant="warning" size="md">
                PENDING REVIEW
              </Badge>
              <Text variant="h2" weight="bold" colorVariant="primary" style={{ marginTop: 16 }}>
                Application Submitted!
              </Text>
              <Text variant="body" colorVariant="secondary" align="center" style={{ marginTop: 10, lineHeight: 22 }}>
                Thank you for applying to partner with LaundryFlow. Your application for{' '}
                <Text weight="bold" colorVariant="primary">
                  {storeName}
                </Text>{' '}
                has been submitted to Super Admin for verification.
              </Text>
              <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 12, lineHeight: 18 }}>
                Once your account is approved, you will be able to log in with your registered email/phone and password to manage your laundry.
              </Text>
            </View>

            <Button
              title="Return to Sign In"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Login')}
            />
          </Card>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.headerArea}>
          <Text variant="h2" weight="bold" colorVariant="primary">
            Partner Onboarding
          </Text>
          <Text variant="subtitle" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs }}>
            Apply to register your laundry business on LaundryFlow
          </Text>
        </View>

        <Card variant="elevated" style={styles.authCard}>
          {Boolean(errorMessage) && (
            <View style={{ marginBottom: spacing.md }}>
              <ErrorState title="Application Error" message={errorMessage} />
            </View>
          )}

          <Text variant="label" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            STORE DETAILS
          </Text>

          <Input
            label="Laundry / Store Name"
            placeholder="e.g. Royal Cleaners"
            value={storeName}
            onChangeText={setStoreName}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Store Address"
            placeholder="Shop No., Street, Landmark"
            value={address}
            onChangeText={setAddress}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="City"
                placeholder="e.g. Indore"
                value={city}
                onChangeText={setCity}
                containerStyle={{ marginBottom: spacing.md }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="State"
                placeholder="e.g. MP"
                value={stateName}
                onChangeText={setStateName}
                containerStyle={{ marginBottom: spacing.md }}
              />
            </View>
          </View>

          <Input
            label="Pincode"
            placeholder="6-digit pincode"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={setPincode}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Text variant="label" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            OWNER & LOGIN CREDENTIALS
          </Text>

          <Input
            label="Owner Full Name"
            placeholder="e.g. Rajesh Sharma"
            value={ownerName}
            onChangeText={setOwnerName}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Email Address"
            placeholder="owner@laundry.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Mobile Number"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Submit Laundry Application"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            onPress={handleSubmit}
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
    maxWidth: 460,
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authCard: {
    width: '100%',
    padding: 24,
  },
  row: {
    flexDirection: 'row',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default ApplyLaundryAdminScreen;
