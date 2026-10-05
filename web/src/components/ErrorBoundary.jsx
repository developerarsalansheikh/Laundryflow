import React from 'react';

/**
 * Web Admin Error Boundary (RN-9)
 * Catches unhandled runtime exceptions in the dashboard and renders
 * a clean recovery card without exposing raw stack traces.
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
    if (import.meta.env.DEV) {
      console.warn('[WebErrorBoundary] Uncaught component exception:', error, errorInfo);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#0F172A',
              margin: '0 0 8px 0'
            }}>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#64748B',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              The dashboard encountered an unexpected error. Your business operations and orders remain safe.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-block',
                width: '100%',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFFFFF',
                backgroundColor: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#1D4ED8')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#2563EB')}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
