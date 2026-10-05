import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import LaundryDetailScreen from '../screens/customer/LaundryDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import AddressListScreen from '../screens/customer/AddressListScreen';
import AddEditAddressScreen from '../screens/customer/AddEditAddressScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderSuccessScreen from '../screens/customer/OrderSuccessScreen';
import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import SelectLocationScreen from '../screens/customer/SelectLocationScreen';
import CustomerSettingsScreen from '../screens/customer/CustomerSettingsScreen';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ApplyLaundryAdminScreen from '../screens/auth/ApplyLaundryAdminScreen';

const Stack = createNativeStackNavigator();

export const CustomerNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="CustomerHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* ── Customer Marketplace & Ordering Flow ── */}
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="SelectLocation" component={SelectLocationScreen} />
      <Stack.Screen name="CustomerSettings" component={CustomerSettingsScreen} />
      <Stack.Screen name="LaundryDetail" component={LaundryDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="AddressList" component={AddressListScreen} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />

      {/* ── Auth Screens (Seamlessly reachable via AuthGateModal) ── */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ApplyLaundryAdmin" component={ApplyLaundryAdminScreen} />
    </Stack.Navigator>
  );
};

export default CustomerNavigator;
