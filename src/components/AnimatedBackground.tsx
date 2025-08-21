const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Static pink blob in top right */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-100 opacity-20 blur-3xl" />
      
      {/* Static purple blob in bottom left */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100 opacity-20 blur-3xl" />
    </div>
  );
};

export default AnimatedBackground;