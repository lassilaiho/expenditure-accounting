import React from 'react';

import ErrorDisplay from './ErrorDisplay';
import Scaffold from './common/Scaffold';

export interface ErrorBoundaryState {
  currentError: Error | null;
}

export default class ErrorBoundary extends React.Component<
  any,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { currentError: null };

  private onUnhandledRejection = (e: PromiseRejectionEvent) => {
    this.setState({ currentError: toError(e.reason) });
  };

  public componentDidMount() {
    window.addEventListener('unhandledrejection', this.onUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
  }

  public static getDerivedStateFromError(error: unknown) {
    return { currentError: toError(error) };
  }

  public render() {
    if (this.state.currentError === null) {
      return this.props.children;
    }
    return (
      <Scaffold
        title='Error'
        content={<ErrorDisplay error={this.state.currentError} />}
      />
    );
  }
}

function toError(e: unknown) {
  return e instanceof Error ? e : new Error('' + e);
}
