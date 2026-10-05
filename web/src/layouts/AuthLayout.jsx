import { Outlet } from 'react-router-dom';
import { AppBackground } from '../components/common/AppBackground';

/**
 * AuthLayout structural shell for public authentication pages.
 */
export const AuthLayout = () => {
  return (
    <AppBackground>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Outlet />
      </div>
    </AppBackground>
  );
};

export default AuthLayout;
