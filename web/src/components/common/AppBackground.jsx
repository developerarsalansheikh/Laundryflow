/**
 * AppBackground — Clean light slate SaaS canvas for the main workspace.
 * Provides a crisp, distraction-free neutral backdrop (#F8FAFC) allowing
 * content cards and charts to stand out professionally.
 */
export const AppBackground = ({ children }) => {
  return (
    <div
      className="relative min-h-screen w-full text-textPrimary overflow-hidden bg-[#F8FAFC]"
    >
      {/* Foreground Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AppBackground;

