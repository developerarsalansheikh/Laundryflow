import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Text from './ui/Text';
import Button from './ui/Button';

/**
 * Mobile Error Boundary (RN-9)
 * Catches unhandled component tree exceptions and provides a recovery UI
 * without leaking technical stack traces to users.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (__DEV__) {
      console.warn('[ErrorBoundary] Uncaught component exception:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>

            <Text variant="h2" weight="bold" align="center" style={styles.title}>
              Something went wrong
            </Text>

            <Text
              variant="bodyMedium"
              colorVariant="secondary"
              align="center"
              style={styles.message}
            >
              The app encountered an unexpected issue. Don't worry, your data and bookings are safe.
            </Text>

            <View style={styles.actions}>
              <Button
                title="Try Again"
                variant="primary"
                size="lg"
                onPress={this.handleReset}
                style={styles.button}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    color: '#0F172A',
    marginBottom: 10,
  },
  message: {
    color: '#64748B',
    maxWidth: 320,
    marginBottom: 28,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
  },
  button: {
    width: '100%',
  },
});

export default ErrorBoundary;
