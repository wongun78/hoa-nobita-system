import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../layout/ui'

type ErrorBoundaryProps = Readonly<{ children: ReactNode }>
type ErrorBoundaryState = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] caught:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h2 className="text-lg font-black text-rose-950">Đã xảy ra lỗi</h2>
            <p className="mt-1 max-w-md text-sm text-rose-700">
              Trang này gặp sự cố khi tải. Bạn có thể thử lại hoặc tải lại toàn bộ trang.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="min-h-11" onClick={this.handleReset}>
              <RefreshCw size={16} /> Thử lại
            </Button>
            <Button type="button" className="min-h-11" onClick={this.handleReload}>
              Tải lại trang
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
