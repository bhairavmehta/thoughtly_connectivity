
import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export function BrainVisualSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-thoughtly-card/50 to-thoughtly min-h-[600px]">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Central Brain Icon */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="p-8 rounded-full bg-thoughtly-accent/10 border border-thoughtly-accent/20"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="h-16 w-16 text-thoughtly-accent" />
            </motion.div>
          </div>

          {/* Text Elements */}
          <div className="grid grid-cols-3 gap-8 items-center relative h-[500px]">
            {/* Left Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-right"
            >
              <h3 className="text-2xl font-medium bg-gradient-to-r from-blue-400 to-thoughtly-accent bg-clip-text text-transparent mb-2">
                Capture Ideas
              </h3>
              <p className="text-thoughtly-subtle text-lg">
                Transform your thoughts into organized knowledge
              </p>
            </motion.div>

            {/* Center Column (Empty for brain icon) */}
            <div />

            {/* Right Text */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-left"
            >
              <h3 className="text-2xl font-medium bg-gradient-to-r from-thoughtly-accent to-blue-400 bg-clip-text text-transparent mb-2">
                Connect & Grow
              </h3>
              <p className="text-thoughtly-subtle text-lg">
                Build meaningful connections between ideas
              </p>
            </motion.div>

            {/* Bottom Center Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="col-span-3 text-center mt-20"
            >
              <h3 className="text-2xl font-medium bg-gradient-to-r from-blue-400 via-thoughtly-accent to-blue-400 bg-clip-text text-transparent mb-2">
                Visualize Knowledge
              </h3>
              <p className="text-thoughtly-subtle text-lg max-w-md mx-auto">
                See your thoughts come to life in an interactive mindscape
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
