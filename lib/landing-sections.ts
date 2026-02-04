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
    type: "hero" | "cards";
    title: string;
    titleGradient?: string;
    description?: string;
    cta?: { text: string; href: string };
    features?: string[];
    meta?: string;
    cards?: { emoji: string; title: string; description: string }[];
  };
}

export const landingSections: Section[] = [
  {
    id: "hero",
    handPosition: "bottom-right",
    background: {
      type: "illustration",
      image: "/backgrounds/orizaba.png", // Ilustración de Nano Banana - Pico de Orizaba
      gradient: `
        radial-gradient(circle at 20% 80%, rgba(255, 107, 107, 0.3) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.25) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "hero",
      title: "Controla la gravedad ",
      titleGradient: "con tu mano.",
      description: "Apunta con tus dedos. Haz OK. Abre un agujero negro.",
      cta: { text: "Jugar ahora", href: "/tracking" },
      features: ["Sin controles", "Partidas rápidas", "Caos instantáneo"],
      meta: "Requiere cámara • Juega en segundos",
    },
  },
  {
    id: "how-to-play",
    handPosition: "bottom-left", // Alterna posición
    background: {
      type: "illustration",
      image: "/backgrounds/isla-mujeres.png", // Ilustración de Nano Banana - Isla Mujeres
      gradient: `
        radial-gradient(circle at 80% 20%, rgba(254, 202, 87, 0.3) 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(255, 159, 67, 0.25) 0%, transparent 60%),
        #0a0a0a
      `,
    },
    content: {
      type: "cards",
      title: "Cómo se juega",
      cards: [
        {
          emoji: "🎯",
          title: "Apunta",
          description: "Mueve la retícula con tu mano.",
        },
        {
          emoji: "👌",
          title: "OK = Vacío",
          description: "Haz OK para fijar el agujero negro.",
        },
        {
          emoji: "🌀",
          title: "Atrae aviones",
          description: "Júntalos y trágatelos.",
        },
      ],
    },
  },
];
