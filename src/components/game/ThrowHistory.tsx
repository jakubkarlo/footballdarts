import { motion } from 'framer-motion';
import { Throw } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThrowHistoryProps {
  throws: Throw[];
}

export const ThrowHistory = ({ throws }: ThrowHistoryProps) => {
  if (throws.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: '0.82rem',
          letterSpacing: '0.1em',
          color: '#b0996e',
          textTransform: 'uppercase',
        }}
      >
        No throws yet — search a player to start
      </div>
    );
  }

  return (
    <ScrollArea className="h-44">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '12px' }}>
        {throws
          .slice()
          .reverse()
          .map((throwItem, index) => (
            <motion.div
              key={throwItem.timestamp}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f5f0e8',
                borderRadius: '4px',
                padding: '7px 10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {throwItem.photo && (
                  <img
                    src={throwItem.photo}
                    alt={throwItem.playerName}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid #d4c4a0',
                    }}
                  />
                )}
                <div>
                  <p
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      letterSpacing: '0.04em',
                      color: '#2a1e0e',
                      lineHeight: 1.2,
                    }}
                  >
                    {throwItem.playerName}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.62rem',
                      letterSpacing: '0.08em',
                      color: '#8a7553',
                    }}
                  >
                    #{throws.length - index}
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.2rem',
                  letterSpacing: '0.03em',
                  color: '#b91c1c',
                }}
              >
                −{throwItem.appearances}
              </span>
            </motion.div>
          ))}
      </div>
    </ScrollArea>
  );
};
