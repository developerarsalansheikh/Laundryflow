import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Modal Component
 * Accessible dialog and bottom-sheet surface with glassmorphism styling and backdrop dismissal.
 */
export const Modal = ({
  visible = false,
  onClose,
  title,
  description,
  children,
  footer,
  dismissable = true,
  position = 'center',
  animationType,
  style,
  testID,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const isBottom = position === 'bottom';
  const defaultAnim = animationType || (isBottom ? 'slide' : 'fade');

  const handleBackdropPress = () => {
    if (dismissable && onClose) {
      onClose();
    }
  };

  return (
    <RNModal
      testID={testID}
      visible={visible}
      transparent
      animationType={defaultAnim}
      onRequestClose={handleBackdropPress}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlayStrong }]}
          onPress={handleBackdropPress}
          accessibilityRole="none"
        >
          <View
            style={[
              styles.wrapper,
              isBottom ? styles.wrapperBottom : styles.wrapperCenter,
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                    borderRadius: isBottom
                      ? radius.component.sheet
                      : radius.component.modal,
                    padding: spacing.xl,
                  },
                  isBottom && styles.cardBottom,
                  shadows.lg,
                  style,
                ]}
                accessibilityViewIsModal
              >
                {/* Optional drag handle bar for bottom sheet */}
                {isBottom && (
                  <View style={styles.handleContainer}>
                    <View
                      style={[
                        styles.handle,
                        { backgroundColor: colors.borderLight },
                      ]}
                    />
                  </View>
                )}

                {/* Title & Description Header */}
                {(Boolean(title) || Boolean(description)) && (
                  <View style={[styles.header, { marginBottom: spacing.base }]}>
                    {Boolean(title) && (
                      <Text variant="h3" weight="semibold">
                        {title}
                      </Text>
                    )}
                    {Boolean(description) && (
                      <Text
                        variant="bodySmall"
                        colorVariant="secondary"
                        style={{ marginTop: spacing.xs }}
                      >
                        {description}
                      </Text>
                    )}
                  </View>
                )}

                {/* Content Body */}
                <View style={styles.content}>{children}</View>

                {/* Footer slot (e.g. actions) */}
                {Boolean(footer) && (
                  <View style={[styles.footer, { marginTop: spacing.lg }]}>
                    {footer}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
  },
  wrapperCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  wrapperBottom: {
    justifyContent: 'flex-end',
    marginTop: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  cardBottom: {
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
  footer: {
    width: '100%',
  },
});

export default Modal;
