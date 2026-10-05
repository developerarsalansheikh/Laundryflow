import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { useUIStore } from '../store/uiStore';
import { useTheme } from '../theme';

export const GlobalLoadingOverlay = () => {
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const loadingMessage = useUIStore((state) => state.loadingMessage);
  const { colors, typography, spacing, borderRadius } = useTheme();

  if (!isGlobalLoading) return null;

  return (
    <Modal transparent animationType="fade" visible={isGlobalLoading}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.cardBorder,
              padding: spacing.xl,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors?.primary || '#2563EB'}
            style={{ width: 36, height: 36 }}
          />
          {Boolean(loadingMessage) && (
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' },
              ]}
            >
              {loadingMessage}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    minWidth: 150,
    maxWidth: '80%',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
  },
});

export default GlobalLoadingOverlay;
