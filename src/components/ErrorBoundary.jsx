import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in the component tree
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              We encountered an unexpected error. Please try again.
            </p>
            {this.props.showErrorDetails && this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="btn-retry"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn-reload"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  showErrorDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showErrorDetails: false
};

export default ErrorBoundary;
