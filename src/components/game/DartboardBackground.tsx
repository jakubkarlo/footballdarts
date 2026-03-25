import { motion } from 'framer-motion';

const STICKER_FRAGMENTS = [
  { x: '4%',  y: '6%',  rotate: -12, color: '#1e3a8a', w: 28, h: 40, delay: 0 },
  { x: '90%', y: '10%', rotate: 10,  color: '#b91c1c', w: 36, h: 48, delay: 0.4 },
  { x: '8%',  y: '78%', rotate: -5,  color: '#d97706', w: 24, h: 34, delay: 0.9 },
  { x: '85%', y: '72%', rotate: 14,  color: '#1e3a8a', w: 32, h: 44, delay: 1.3 },
  { x: '48%', y: '4%',  rotate: -7,  color: '#b91c1c', w: 20, h: 30, delay: 0.6 },
  { x: '93%', y: '44%', rotate: 18,  color: '#d97706', w: 28, h: 38, delay: 0.2 },
  { x: '2%',  y: '48%', rotate: -15, color: '#1e3a8a', w: 22, h: 32, delay: 1.1 },
  { x: '20%', y: '92%', rotate: 8,   color: '#b91c1c', w: 30, h: 40, delay: 0.7 },
  { x: '70%', y: '88%', rotate: -9,  color: '#1e3a8a', w: 26, h: 36, delay: 1.5 },
];

export const DartboardBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Cream paper base */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#ede3ce',
          backgroundImage: `
            radial-gradient(circle at 22% 28%, rgba(200, 175, 130, 0.14) 0%, transparent 50%),
            radial-gradient(circle at 78% 72%, rgba(180, 155, 110, 0.1) 0%, transparent 45%)
          `,
        }}
      />

      {/* Halftone dot pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #b09060 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: 0.18,
        }}
      />

      {/* Horizontal album lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 47px,
            rgba(160, 130, 80, 0.22) 47px,
            rgba(160, 130, 80, 0.22) 48px
          )`,
          opacity: 0.6,
        }}
      />

      {/* Floating sticker fragments */}
      {STICKER_FRAGMENTS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: s.x,
            top: s.y,
            width: s.w,
            height: s.h,
            backgroundColor: s.color,
            rotate: s.rotate,
            opacity: 0.07,
          }}
          animate={{
            y: [0, -5, 0],
            rotate: [s.rotate, s.rotate + 1.5, s.rotate],
          }}
          transition={{
            duration: 4 + i * 0.4,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(180, 155, 110, 0.15) 100%)',
        }}
      />
    </div>
  );
};
