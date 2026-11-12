"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";

import { useEffect, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

// Valeurs des classes Tailwind de la source, reprises en CSS (le projet n'utilise pas Tailwind)
const CSS = `
.at-root { margin: 0 auto; max-width: 24rem; padding: 5rem 1rem; font-family: ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.at-grid { position: relative; display: grid; grid-template-columns: 1fr; gap: 5rem; }
.at-image-box { position: relative; height: 20rem; width: 100%; }
.at-img, .at-img-vide { height: 100%; width: 100%; border-radius: 1.5rem; object-fit: cover; object-position: center; display: block; }
.at-img-vide { display: grid; place-items: center; font-size: 4rem; font-weight: 700; color: var(--gold, #b08a3e); background: linear-gradient(135deg, rgba(176,138,62,0.22), rgba(255,255,255,0.03)); border: 1px solid var(--border, #2a2a2a); }
.at-details { display: flex; flex-direction: column; justify-content: space-between; padding: 1rem 0; }
.at-name { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text, #f5f5f5); }
.at-designation { font-size: 0.875rem; margin: 0.25rem 0 0; color: var(--text-dim, #8a8a8a); }
.at-quote { margin-top: 2rem; font-size: 1.125rem; line-height: 1.6; color: var(--text, #d4d4d4); opacity: 0.9; }
.at-buttons { display: flex; gap: 1rem; padding-top: 3rem; }
.at-btn { display: flex; height: 1.75rem; width: 1.75rem; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,0.08); border: none; cursor: pointer; }
.at-btn svg { height: 1.25rem; width: 1.25rem; color: var(--text, #f5f5f5); transition: transform 0.3s; }
.at-btn.prev:hover svg { transform: rotate(12deg); }
.at-btn.next:hover svg { transform: rotate(-12deg); }
@media (min-width: 768px) {
  .at-root { max-width: 56rem; padding-left: 2rem; padding-right: 2rem; }
  .at-grid { grid-template-columns: 1fr 1fr; }
  .at-buttons { padding-top: 0; }
}
@media (min-width: 1024px) { .at-root { padding-left: 3rem; padding-right: 3rem; } }
`;

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    // Rotation aléatoire voulue par la source (comportement d'origine conservé)
    // eslint-disable-next-line react-hooks/purity
    return Math.floor(Math.random() * 21) - 10;
  };

  if (testimonials.length === 0) return null;
  const actuel = testimonials[active];

  return (
    // Mouvement réduit si l'appareil le demande (prefers-reduced-motion)
    <MotionConfig reducedMotion="user">
      <style>{CSS}</style>
      <div className="at-root">
        <div className="at-grid">
          <div>
            <div className="at-image-box">
              <AnimatePresence>
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${testimonial.name}-${index}`}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      z: -100,
                      rotate: randomRotateY(),
                    }}
                    animate={{
                      opacity: isActive(index) ? 1 : 0.7,
                      scale: isActive(index) ? 1 : 0.95,
                      z: isActive(index) ? 0 : -100,
                      rotate: isActive(index) ? 0 : randomRotateY(),
                      zIndex: isActive(index)
                        ? 40
                        : testimonials.length + 2 - index,
                      y: isActive(index) ? [0, -80, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotateY(),
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                    }}
                    style={{ position: "absolute", inset: 0, transformOrigin: "bottom" }}
                  >
                    {testimonial.src ? (
                      <img
                        src={testimonial.src}
                        alt={testimonial.name}
                        width={500}
                        height={500}
                        draggable={false}
                        className="at-img"
                      />
                    ) : (
                      <div className="at-img-vide" aria-label={testimonial.name}>
                        {testimonial.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="at-details">
            <motion.div
              key={active}
              initial={{
                y: 20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -20,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              <h3 className="at-name">{actuel.name}</h3>
              <p className="at-designation">{actuel.designation}</p>
              <motion.p className="at-quote">
                {actuel.quote.split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{
                      filter: "blur(10px)",
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: "easeInOut",
                      delay: 0.02 * index,
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
            <div className="at-buttons">
              <button onClick={handlePrev} className="at-btn prev" aria-label="Précédent">
                <IconArrowLeft />
              </button>
              <button onClick={handleNext} className="at-btn next" aria-label="Suivant">
                <IconArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};
