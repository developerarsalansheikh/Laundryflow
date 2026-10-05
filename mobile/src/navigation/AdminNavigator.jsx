import React from 'react';
import { Text as RNText, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';

// Admin Tab Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminServicesScreen from '../screens/admin/AdminServicesScreen';
import AdminDeliveryScreen from '../screens/admin/AdminDeliveryScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

// Admin Stack Screens
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminAddEditServiceScreen from '../screens/admin/AdminAddEditServiceScreen';
import AdminTimeSlotsScreen from '../screens/admin/AdminTimeSlotsScreen';
import AdminEditLaundryProfileScreen from '../screens/admin/AdminEditLaundryProfileScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AdminTabs = () => {
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
        component={AdminHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>📊</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>📦</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Services"
        component={AdminServicesScreen}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>🧺</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Delivery"
        component={AdminDeliveryScreen}
        options={{
          tabBarLabel: 'Delivery',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>🛵</RNText>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Store',
          tabBarIcon: ({ focused }) => (
            <RNText style={{ fontSize: 20, opacity: focused ? 1 : 0.7 }}>🏪</RNText>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
      <Stack.Screen name="AdminAddEditService" component={AdminAddEditServiceScreen} />
      <Stack.Screen name="AdminTimeSlots" component={AdminTimeSlotsScreen} />
      <Stack.Screen name="AdminEditProfile" component={AdminEditLaundryProfileScreen} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
