/**
 * AppBackground — Clean warm limestone atelier canvas for the main workspace.
 * Provides a crisp, distraction-free neutral backdrop (#FAF9F6) allowing
 * content cards and charts to stand out professionally.
 */
export const AppBackground = ({ children }) => {
  return (
    <div
      className="relative min-h-screen w-full text-textPrimary overflow-hidden bg-[#FAF9F6]"
    >
      {/* Foreground Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AppBackground;

