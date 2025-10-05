import React from 'react';
import ReactDOM from 'react-dom/client';

// Optional: set basic document attributes for Arabic RTL preview
document.title = 'Web Preview';
document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: any }>{
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('Render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: '#b91c1c', fontFamily: 'system-ui' }}>
          <h2>حدث خطأ أثناء العرض</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.stack || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Vite + React is working</h1>
        <p>إذا رأيت هذه الرسالة فالمشكلة ليست من Vite/React نفسها.</p>
      </div>
    </ErrorBoundary>
  </React.StrictMode>
);
