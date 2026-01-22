import { motion } from 'framer-motion';

export const DartboardBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-dartboard-gradient" />
      
      {/* Animated dartboard rings */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          className="opacity-20"
        >
          {/* Outer ring */}
          <circle
            cx="400"
            cy="400"
            r="380"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
          />
          {/* Middle ring */}
          <circle
            cx="400"
            cy="400"
            r="280"
            stroke="hsl(var(--secondary))"
            strokeWidth="2"
            fill="none"
          />
          {/* Inner ring */}
          <circle
            cx="400"
            cy="400"
            r="180"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
          />
          {/* Bullseye outer */}
          <circle
            cx="400"
            cy="400"
            r="80"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            fill="none"
          />
          {/* Bullseye inner */}
          <circle
            cx="400"
            cy="400"
            r="30"
            fill="hsl(var(--secondary))"
            opacity="0.3"
          />
          
          {/* Dividing lines */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i * 18 * Math.PI) / 180;
            const x2 = 400 + 380 * Math.sin(angle);
            const y2 = 400 - 380 * Math.cos(angle);
            return (
              <line
                key={i}
                x1="400"
                y1="400"
                x2={x2}
                y2={y2}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </motion.div>
      
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};
