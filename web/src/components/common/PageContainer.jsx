/**
 * PageContainer — Consistent page content wrapper.
 * Provides max-width, responsive horizontal padding, and vertical spacing.
 */
export const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
