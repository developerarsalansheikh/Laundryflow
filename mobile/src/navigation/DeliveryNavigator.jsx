import React from 'react';
import { Text as RNText, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';

// Delivery Tab Screens
import DeliveryHomeScreen from '../screens/delivery/DeliveryHomeScreen';
import DeliveryOrdersScreen from '../screens/delivery/DeliveryOrdersScreen';
import DeliveryProfileScreen from '../screens/delivery/DeliveryProfileScreen';

// Delivery Stack Screens
import DeliveryOrderDetailScreen from '../screens/delivery/DeliveryOrderDetailScreen';
import NewPickupScreen from '../screens/delivery/NewPickupScreen';
import DeliveryNotificationsScreen from '../screens/delivery/DeliveryNotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DeliveryTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DeliveryHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>🛵</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={DeliveryOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>📦</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DeliveryProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>👤</RNText>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const DeliveryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
      <Stack.Screen name="DeliveryOrderDetail" component={DeliveryOrderDetailScreen} />
      <Stack.Screen name="NewPickup" component={NewPickupScreen} />
      <Stack.Screen name="DeliveryNotifications" component={DeliveryNotificationsScreen} />
    </Stack.Navigator>
  );
};

export default DeliveryNavigator;
