"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">Une erreur est survenue.</p>
          <p className="text-xs text-on-surface-variant">{this.state.error?.message}</p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
