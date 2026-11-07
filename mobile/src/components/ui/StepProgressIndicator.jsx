import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * StepProgressIndicator
 * Renders a clean 4-step progress stepper matching the FreshFold / LaundryWave design.
 * e.g., 1 Pickup ── 2 Details ── 3 Review ── 4 Confirm
 */
export const StepProgressIndicator = ({
  steps = ['Pickup', 'Details', 'Review', 'Confirm'],
  currentStep = 1,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isActive
                      ? colors.primary || '#0066FF'
                      : isCompleted
                      ? colors.status?.success || '#10B981'
                      : '#FFFFFF',
                    borderColor: isActive
                      ? colors.primary || '#0066FF'
                      : isCompleted
                      ? colors.status?.success || '#10B981'
                      : colors.border || '#CBD5E1',
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{
                    color: isActive || isCompleted ? '#FFFFFF' : '#94A3B8',
                    fontSize: 12,
                  }}
                >
                  {isCompleted ? '✓' : stepNum}
                </Text>
              </View>
              <Text
                variant="caption"
                weight={isActive ? 'semibold' : 'normal'}
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.primary || '#0066FF'
                      : isCompleted
                      ? colors.textPrimary || '#0F172A'
                      : '#94A3B8',
                  },
                ]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>

            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      stepNum < currentStep
                        ? colors.status?.success || '#10B981'
                        : '#E2E8F0',
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 1,
  },
});

export default StepProgressIndicator;
