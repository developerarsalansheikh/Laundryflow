import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ModernBottomTabBar } from './ModernBottomTabBar';

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

const DELIVERY_TAB_ICONS = {
  Dashboard: { name: 'truck' },
  Orders: { name: 'orders' },
  Profile: { name: 'user' },
};

const DeliveryTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernBottomTabBar {...props} tabIcons={DELIVERY_TAB_ICONS} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DeliveryHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={DeliveryOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DeliveryProfileScreen}
        options={{
          tabBarLabel: 'Profile',
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
