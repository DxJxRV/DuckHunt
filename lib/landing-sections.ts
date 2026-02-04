// Landing Page Sections Configuration

export interface Section {
  id: string;
  handPosition: "bottom-right" | "bottom-left";
  background: {
    type: "illustration" | "gradient";
    image?: string;
    gradient?: string;
  };
  content: {
    type: "hero" | "cards" | "tutorial";
    title: string;
    titleGradient?: string;
    subtitle?: string;
    description?: string;
    cta?: { text: string; href: string };
    features?: string[];
    meta?: string;
    cards?: { emoji: string; title: string; description: string }[];
    tutorialGif?: string; // Path to GIF for tutorial slides
    details?: string[]; // Bullet points for details
  };
}

export const landingSections: Section[] = [
  // SLIDE 1: Hero
  {
    id: "hero",
    handPosition: "bottom-right",
    background: {
      type: "illustration",
      image: "/backgrounds/orizaba.png",
      gradient: `
        radial-gradient(circle at 20% 80%, rgba(255, 107, 107, 0.3) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.25) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "hero",
      title: "Defiende la Tierra ",
      titleGradient: "con tu mano.",
      description: "Un juego de defensa donde TÚ eres el arma. Sin mouse, sin teclado, sin controles.",
      cta: { text: "Jugar ahora", href: "/tracking" },
      features: ["100% Hand Tracking", "Intensidad brutal", "Adictivo AF"],
      meta: "Solo necesitas cámara web",
    },
  },

  // SLIDE 2: Apuntar
  {
    id: "aim",
    handPosition: "bottom-left",
    background: {
      type: "illustration",
      image: "/backgrounds/isla-mujeres.png",
      gradient: `
        radial-gradient(circle at 80% 20%, rgba(254, 202, 87, 0.3) 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(255, 159, 67, 0.25) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "tutorial",
      title: "🎯 Mueve tu mano para apuntar",
      description: "Tu mano controla la retícula roja. Muévela hacia donde quieras invocar el agujero negro.",
      tutorialGif: "/gifs/aim-tutorial.gif",
    },
  },

  // SLIDE 3: Agujero Negro
  {
    id: "black-hole",
    handPosition: "bottom-left",
    background: {
      type: "gradient",
      gradient: `
        radial-gradient(circle at 20% 80%, rgba(138, 43, 226, 0.4) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "tutorial",
      title: "👌 Haz OK para invocar el vacío",
      description: "Haz el gesto OK con tu mano. Se fija un agujero negro en tu retícula que succiona y destruye aviones cercanos por gravedad.",
      tutorialGif: "/gifs/ok-gesture.gif",
    },
  },

  // SLIDE 4: Combate y Shield Angel
  {
    id: "combat",
    handPosition: "bottom-left",
    background: {
      type: "gradient",
      gradient: `
        radial-gradient(circle at 80% 20%, rgba(255, 159, 67, 0.4) 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(254, 202, 87, 0.3) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "tutorial",
      title: "😇 Protege al ángel o pierde",
      description: "Los aviones atacan al Shield Angel. Destrúyelos con agujeros negros antes de que lo maten. Si el ángel llega a 0 HP, Game Over.",
      tutorialGif: "component:ShieldAngelGif",
    },
  },
];
