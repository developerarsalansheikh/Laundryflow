import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Input Component
 * Accessible, token-driven text field with focus highlighting, error messaging, and icon support.
 */
export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  disabled = false,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) => {
  const { colors, spacing, radius, layout, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const hasError = Boolean(error);

  // Determine border color based on interaction state
  const getBorderColor = () => {
    if (hasError) return colors.status.danger;
    if (isFocused) return colors.borderFocus;
    return colors.border;
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && (
        <Text
          variant="label"
          colorVariant="secondary"
          style={[styles.label, { marginBottom: spacing.xs }]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: getBorderColor(),
            borderRadius: radius.component.input,
            paddingHorizontal: spacing.base,
            minHeight: multiline ? 88 : layout.inputHeight,
          },
          isFocused && styles.inputWrapperFocused,
          disabled && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon && <View style={[styles.leftIcon, { marginRight: spacing.sm }]}>{leftIcon}</View>}

        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.textInput,
            typography.body,
            {
              color: disabled ? colors.textDisabled : colors.textPrimary,
              paddingVertical: multiline ? spacing.sm : 0,
            },
            inputStyle,
          ]}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          accessibilityInvalid={hasError}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={togglePasswordVisibility}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            style={[styles.rightIcon, { marginLeft: spacing.sm }]}
          >
            <Text variant="caption" colorVariant="brand">
              {isPasswordVisible ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={8}
            style={[styles.rightIcon, { marginLeft: spacing.sm }]}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <Text
          variant="caption"
          colorVariant="error"
          style={[styles.helper, { marginTop: spacing.xxs }]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          variant="caption"
          colorVariant="muted"
          style={[styles.helper, { marginTop: spacing.xxs }]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  inputWrapperFocused: {
    borderWidth: 1.5,
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  leftIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  helper: {
    marginTop: 4,
    marginLeft: 2,
  },
});

export default Input;
