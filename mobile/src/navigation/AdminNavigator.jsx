import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ModernBottomTabBar } from './ModernBottomTabBar';

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

const ADMIN_TAB_ICONS = {
  Dashboard: { name: 'grid' },
  Orders: { name: 'orders' },
  Services: { name: 'washing-machine' },
  Delivery: { name: 'truck' },
  Profile: { name: 'store' },
};

const AdminTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernBottomTabBar {...props} tabIcons={ADMIN_TAB_ICONS} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Services"
        component={AdminServicesScreen}
        options={{
          tabBarLabel: 'Services',
        }}
      />
      <Tab.Screen
        name="Delivery"
        component={AdminDeliveryScreen}
        options={{
          tabBarLabel: 'Delivery',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Store',
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
