import AppRoutes from './routes/AppRoutes';
import { useAuthInitialization } from './hooks/useAuthInitialization';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * App root — runs session initialization once, then renders routes.
 * useAuthInitialization handles session restoration from localStorage
 * and validates it against the backend refresh-token endpoint.
 */
export const App = () => {
  useAuthInitialization();
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
};

export default App;
