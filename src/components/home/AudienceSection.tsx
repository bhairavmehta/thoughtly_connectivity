
import { motion } from 'framer-motion';

const audiences = [
  "Marketers",
  "Designers",
  "Writers",
  "Researchers",
  "Developers",
  "Everyone"
];

export function AudienceSection() {
  return (
    <section className="py-20 px-4 bg-thoughtly-card/50">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-16"
        >
          For visual minds of all kinds.
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => (
            <motion.button
              key={audience}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="px-6 py-2 rounded-full border border-thoughtly-border hover:border-thoughtly-accent hover:text-thoughtly-accent transition-all duration-300"
            >
              {audience}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
