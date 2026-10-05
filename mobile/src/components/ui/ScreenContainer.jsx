import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

/**
 * LaundryFlow Design System - ScreenContainer Component
 * Responsive, safe-area aware screen wrapper supporting fixed or scrollable layouts.
 */
export const ScreenContainer = ({
  children,
  scrollable = false,
  padding = 'base',
  header,
  footer,
  style,
  contentContainerStyle,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  keyboardAvoiding = false,
  refreshing = false,
  onRefresh,
  testID,
}) => {
  const { colors, spacing } = useTheme();

  // Resolve padding
  const resolvePadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'md':
        return spacing.md;
      case 'lg':
      case 'base':
      default:
        return spacing.base;
    }
  };

  const horizontalPadding = resolvePadding();

  const mainContent = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        { paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  const containerContent = (
    <SafeAreaView
      testID={testID}
      edges={safeAreaEdges}
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      {header}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {mainContent}
        </KeyboardAvoidingView>
      ) : (
        mainContent
      )}
      {footer}
    </SafeAreaView>
  );

  return containerContent;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ScreenContainer;
