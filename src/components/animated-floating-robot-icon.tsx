
import type { FC } from 'react';
import { motion } from 'framer-motion';

// Animated Floating Robot Icon SVG - Updated based on previous enhancements
export const AnimatedFloatingRobotIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        {...props}
    >
        <defs>
            {/* Gradient for robot body - Updated vertical gradient */}
             <linearGradient id="robotBodyGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#567D23' }} /> {/* Darker green at the top */}
                  <stop offset="100%" style={{ stopColor: '#B1D760' }} /> {/* Lighter green at the bottom */}
             </linearGradient>
             {/* Gradient for robot head - Updated vertical gradient */}
            <linearGradient id="robotHeadGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" style={{ stopColor: '#567D23' }} /> {/* Darker green at the top */}
                 <stop offset="100%" style={{ stopColor: '#B1D760' }} /> {/* Lighter green at the bottom */}
            </linearGradient>
             {/* Gradient for visor - Holographic effect */}
            <linearGradient id="robotVisorGradientEnhanced" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--secondary) / 0.6)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 0.9 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary) / 0.6)', stopOpacity: 1 }} />
            </linearGradient>
            {/* Subtle Aura Filter */}
            <filter id="auraGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.5 0"
                    result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            {/* Base Pulse Animation */}
            <radialGradient id="basePulseGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--secondary) / 0.5)', stopOpacity: 1 }}>
                     <animate attributeName="stop-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary) / 0.1)', stopOpacity: 1 }}>
                    <animate attributeName="stop-opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                </stop>
            </radialGradient>
        </defs>

        {/* Floating Base - Pulsing (Remains stationary relative to the SVG viewport) */}
        <motion.ellipse
            cx="50" cy="88" rx="30" ry="8"
            fill="url(#basePulseGradient)"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Group for Robot Parts (to apply float animation) */}
        <motion.g
            className="animate-float" // Apply float animation CSS class
            initial={{ y: 0 }} // Initial state for the group
            style={{ transformOrigin: '50% 88%' }} // Anchor floating point lower
        >
            {/* Robot Body - Apply subtle body gradient and aura */}
            <motion.rect
                x="28" y="35" width="44" height="45" rx="12" ry="12"
                fill="url(#robotBodyGradientVertical)" // Use vertical gradient
                stroke="hsl(var(--primary-foreground) / 0.7)" strokeWidth="1"
                filter="url(#auraGlow)" // Apply subtle aura
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            />
            {/* Body Panel Lines - Subtle */}
            <motion.line x1="35" y1="45" x2="65" y2="45" stroke="hsl(var(--primary-foreground) / 0.3)" strokeWidth="0.8" />
            <motion.line x1="32" y1="55" x2="68" y2="55" stroke="hsl(var(--primary-foreground) / 0.3)" strokeWidth="0.8" />
            <motion.line x1="35" y1="65" x2="65" y2="65" stroke="hsl(var(--primary-foreground) / 0.3)" strokeWidth="0.8" />
            {/* Central Core Light - Enhanced */}
            <motion.circle cx="50" cy="55" r="7" fill="hsl(var(--accent))" filter="url(#auraGlow)"> {/* Replaced neonGlow with auraGlow */}
                 <animate attributeName="r" values="6;7;6" dur="1.8s" repeatCount="indefinite" />
                 <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite" />
            </motion.circle>

            {/* Robot Head - Apply subtle head gradient and aura */}
            <motion.ellipse
                cx="50" cy="25" rx="18" ry="16"
                fill="url(#robotHeadGradientVertical)" // Use vertical gradient
                stroke="hsl(var(--primary-foreground) / 0.7)" strokeWidth="1"
                filter="url(#auraGlow)" // Apply subtle aura
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />


            {/* Visor - Apply enhanced gradient with subtle animated reflection */}
            <motion.rect
                x="33" y="18" width="34" height="14" rx="7" ry="7"
                fill="url(#robotVisorGradientEnhanced)"
                stroke="hsl(var(--primary-foreground) / 0.4)" strokeWidth="0.8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            />
             {/* Animated Visor Shine */}
            <motion.rect
                 x="35" y="20" width="5" height="10" rx="2" ry="2"
                 fill="white"
                 fillOpacity="0.3">
                 <animate attributeName="x" values="35;60;35" dur="3s" repeatCount="indefinite" />
                 <animate attributeName="fill-opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
            </motion.rect>

             {/* Eye Blinking Effect (using opacity on the glow) */}
            <motion.ellipse
                cx="50" cy="25" rx="13" ry="5"
                fill="hsl(var(--primary) / 0.7)"
                 filter="url(#auraGlow)" // Use auraGlow instead of neonGlow
            >
                 {/* Blink animation */}
                 <animate attributeName="opacity" values="0.7;1;1;1;1;1;1;1;0;1;1;0.7" dur="4s" repeatCount="indefinite" />
            </motion.ellipse>


             {/* Arms (Leaf-like shapes) - Enhanced with subtle movement and vein details */}
             <motion.g initial={{ rotate: 0 }} animate={{ rotate: [0, -3, 0, 3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                 {/* Left Leaf Hand */}
                 <motion.path
                     d="M 28 45 C 15 35, 10 50, 15 60 C 20 70, 25 55, 28 54 Z"
                      fill="url(#robotBodyGradientVertical)" // Apply gradient
                     stroke="hsl(var(--primary-foreground) / 0.5)" strokeWidth="0.8"
                     initial={{ x: -5, rotate: -15, opacity: 0 }}
                     animate={{ x: 0, rotate: 0, opacity: 1 }}
                     transition={{ delay: 0.5, duration: 0.6 }}
                 />
                 {/* Left Leaf Veins */}
                  <motion.path
                      d="M 28 54 Q 20 50, 15 60" // Central vein
                      stroke="hsl(var(--primary-foreground) / 0.4)"
                      strokeWidth="0.6" fill="none"
                      initial={{ x: -5, rotate: -15, opacity: 0 }}
                      animate={{ x: 0, rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.55, duration: 0.6 }}
                  />
                  <motion.path
                      d="M 23 52 Q 18 50, 16 56" // Side vein 1
                      stroke="hsl(var(--primary-foreground) / 0.3)"
                      strokeWidth="0.5" fill="none"
                      initial={{ x: -5, rotate: -15, opacity: 0 }}
                      animate={{ x: 0, rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                   />
                   <motion.path
                       d="M 21 48 Q 16 45, 15 50" // Side vein 2
                       stroke="hsl(var(--primary-foreground) / 0.3)"
                       strokeWidth="0.5" fill="none"
                       initial={{ x: -5, rotate: -15, opacity: 0 }}
                       animate={{ x: 0, rotate: 0, opacity: 1 }}
                       transition={{ delay: 0.65, duration: 0.6 }}
                   />
             </motion.g>
             {/* Right Hand Group */}
             <motion.g
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 3, 0, -3, 0] }} // Continuous sway
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             >
                 {/* Right Leaf Hand */}
                 <motion.path
                     d="M 72 45 C 85 35, 90 50, 85 60 C 80 70, 75 55, 72 54 Z"
                      fill="url(#robotBodyGradientVertical)" // Apply gradient
                     stroke="hsl(var(--primary-foreground) / 0.5)" strokeWidth="0.8"
                     initial={{ x: 0, rotate: 0, opacity: 0 }} // Initial pose
                     animate={{ x: 0, rotate: 0, opacity: 1 }} // Final pose
                     transition={{ delay: 0.5, duration: 0.6 }} // Hand appears
                 />
                 {/* Right Leaf Veins */}
                  <motion.path
                      d="M 72 54 Q 80 50, 85 60" // Central vein
                      stroke="hsl(var(--primary-foreground) / 0.4)"
                      strokeWidth="0.6" fill="none"
                       initial={{ x: 0, rotate: 0, opacity: 0 }}
                       animate={{ x: 0, rotate: 0, opacity: 1 }}
                       transition={{ delay: 0.55, duration: 0.6 }}
                  />
                  <motion.path
                      d="M 77 52 Q 82 50, 84 56" // Side vein 1
                      stroke="hsl(var(--primary-foreground) / 0.3)"
                      strokeWidth="0.5" fill="none"
                       initial={{ x: 0, rotate: 0, opacity: 0 }}
                       animate={{ x: 0, rotate: 0, opacity: 1 }}
                       transition={{ delay: 0.6, duration: 0.6 }}
                   />
                   <motion.path
                       d="M 79 48 Q 84 45, 85 50" // Side vein 2
                       stroke="hsl(var(--primary-foreground) / 0.3)"
                       strokeWidth="0.5" fill="none"
                        initial={{ x: 0, rotate: 0, opacity: 0 }}
                        animate={{ x: 0, rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.65, duration: 0.6 }}
                   />
             </motion.g>

             {/* Mouth */}
            <motion.path
                d="M 42 34 Q 50 38, 58 34"
                stroke="hsl(var(--primary-foreground) / 0.6)"
                strokeWidth="1.2"
                fill="none"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
            />

            {/* Antenna - Bobbing animation (Rendered last within this group) */}
            <motion.g initial={{ rotate: 0 }} animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                  <motion.line x1="50" y1="9" x2="50" y2="1" stroke="hsl(var(--primary-foreground) / 0.9)" strokeWidth="2" />
                  <motion.circle cx="50" cy="2" r="2.5" fill="hsl(var(--accent))" stroke="hsl(var(--primary-foreground) / 0.8)" strokeWidth="1">
                      <animate attributeName="fill" values="hsl(var(--accent));hsl(var(--primary));hsl(var(--accent))" dur="2.5s" repeatCount="indefinite" />
                  </motion.circle>
            </motion.g>


        </motion.g> {/* End of Robot Parts Group */}


    </svg>
);

