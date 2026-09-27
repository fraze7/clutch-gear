import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Category } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  price: number; // pounds — converted to pence below
  stock: number;
  featured?: boolean;
  specs: Record<string, string>;
};

// Made-up products for a made-up brand. Prices in GBP.
const products: SeedProduct[] = [
  // Mice
  {
    slug: "flick-pro-wireless",
    name: "Flick Pro Wireless",
    tagline: "58 g of pure aim",
    description:
      "Our flagship wireless mouse. A symmetrical shell built for claw and fingertip grips, a flawless 26K sensor and optical switches that never double-click.",
    category: Category.MICE,
    price: 129.99,
    stock: 40,
    featured: true,
    specs: { Weight: "58 g", Sensor: "26,000 DPI optical", Polling: "Up to 4,000 Hz", Battery: "90 hours", Connection: "2.4 GHz wireless, USB-C" },
  },
  {
    slug: "recoil-mini",
    name: "Recoil Mini",
    tagline: "Small hands, big plays",
    description: "A compact wired mouse for small hands and fingertip grips, with an ultralight paracord-style cable.",
    category: Category.MICE,
    price: 49.99,
    stock: 85,
    specs: { Weight: "52 g", Sensor: "18,000 DPI optical", Polling: "1,000 Hz", Connection: "Wired, 1.8 m flexible cable" },
  },
  {
    slug: "tracer-ergo",
    name: "Tracer Ergo",
    tagline: "All-day comfort, tournament speed",
    description: "A right-handed ergonomic shape for palm grippers, with a thumb rest groove and quiet side buttons.",
    category: Category.MICE,
    price: 89.99,
    stock: 32,
    specs: { Weight: "68 g", Sensor: "26,000 DPI optical", Polling: "Up to 2,000 Hz", Battery: "110 hours", Connection: "2.4 GHz wireless, Bluetooth" },
  },
  {
    slug: "lowsens-air",
    name: "Lowsens Air",
    tagline: "Built for big arm swipes",
    description: "A large, low-profile mouse for low-sensitivity players who aim with their whole arm.",
    category: Category.MICE,
    price: 99.99,
    stock: 0,
    specs: { Weight: "63 g", Sensor: "26,000 DPI optical", Polling: "Up to 4,000 Hz", Battery: "80 hours", Connection: "2.4 GHz wireless" },
  },
  {
    slug: "entry-frag",
    name: "Entry Frag",
    tagline: "Your first real gaming mouse",
    description: "Everything you need, nothing you don't. A reliable wired mouse with a proper sensor at a starter price.",
    category: Category.MICE,
    price: 24.99,
    stock: 150,
    specs: { Weight: "74 g", Sensor: "12,000 DPI optical", Polling: "1,000 Hz", Connection: "Wired" },
  },

  // Keyboards
  {
    slug: "rapid-75",
    name: "Rapid 75",
    tagline: "Rapid trigger, 75% layout",
    description:
      "Magnetic Hall-effect switches with adjustable actuation from 0.1 mm to 4 mm and rapid trigger, in a compact 75% aluminium case.",
    category: Category.KEYBOARDS,
    price: 159.99,
    stock: 25,
    featured: true,
    specs: { Layout: "75% (UK ISO)", Switches: "Magnetic Hall-effect", Actuation: "0.1–4.0 mm adjustable", Case: "CNC aluminium", Connection: "Wired, USB-C" },
  },
  {
    slug: "tactix-tkl",
    name: "Tactix TKL",
    tagline: "Tenkeyless, tactile, tough",
    description: "A tenkeyless mechanical keyboard with tactile switches, PBT keycaps and a detachable cable.",
    category: Category.KEYBOARDS,
    price: 99.99,
    stock: 48,
    specs: { Layout: "TKL (UK ISO)", Switches: "Tactile mechanical", Keycaps: "Double-shot PBT", Connection: "Wired, USB-C" },
  },
  {
    slug: "overclock-65",
    name: "Overclock 65",
    tagline: "Tri-mode 65% with hot-swap sockets",
    description: "A 65% board that connects by cable, 2.4 GHz or Bluetooth, with hot-swappable sockets for trying new switches.",
    category: Category.KEYBOARDS,
    price: 119.99,
    stock: 30,
    specs: { Layout: "65% (UK ISO)", Switches: "Linear, hot-swappable", Battery: "4,000 mAh", Connection: "Wired, 2.4 GHz, Bluetooth" },
  },
  {
    slug: "keystroke-full",
    name: "Keystroke Full",
    tagline: "Full size, full control",
    description: "A full-size keyboard with a numpad, media keys and a volume roller, for gaming and work.",
    category: Category.KEYBOARDS,
    price: 79.99,
    stock: 60,
    specs: { Layout: "Full size (UK ISO)", Switches: "Linear mechanical", Extras: "Media keys, volume roller", Connection: "Wired" },
  },
  {
    slug: "rapid-60",
    name: "Rapid 60",
    tagline: "Maximum mouse space",
    description: "All the rapid-trigger tech of the Rapid 75 in a tiny 60% board that frees up your desk for low-sens flicks.",
    category: Category.KEYBOARDS,
    price: 139.99,
    stock: 4,
    specs: { Layout: "60% (UK ISO)", Switches: "Magnetic Hall-effect", Actuation: "0.1–4.0 mm adjustable", Connection: "Wired, USB-C" },
  },

  // Headsets
  {
    slug: "callout-pro",
    name: "Callout Pro",
    tagline: "Hear every footstep",
    description: "A wireless headset tuned for positional audio, with a detachable broadcast-grade microphone and 50-hour battery.",
    category: Category.HEADSETS,
    price: 149.99,
    stock: 22,
    featured: true,
    specs: { Drivers: "50 mm", Microphone: "Detachable, cardioid", Battery: "50 hours", Connection: "2.4 GHz wireless, Bluetooth", Weight: "295 g" },
  },
  {
    slug: "footstep-x",
    name: "Footstep X",
    tagline: "Open-back clarity",
    description: "An open-back wired headset for a wide, natural soundstage, with velour cushions for long sessions.",
    category: Category.HEADSETS,
    price: 109.99,
    stock: 18,
    specs: { Drivers: "53 mm", Design: "Open-back", Microphone: "Detachable boom", Connection: "3.5 mm, USB-C DAC included", Weight: "270 g" },
  },
  {
    slug: "comms-lite",
    name: "Comms Lite",
    tagline: "Light, clear, affordable",
    description: "A lightweight closed-back headset with a flip-to-mute mic. Works with PC, console and phone.",
    category: Category.HEADSETS,
    price: 49.99,
    stock: 90,
    specs: { Drivers: "40 mm", Microphone: "Flip-to-mute", Connection: "3.5 mm", Weight: "240 g" },
  },
  {
    slug: "clutch-iem",
    name: "Clutch IEM",
    tagline: "Pro-style in-ears",
    description: "Wired in-ear monitors with a detachable mic cable — the lightweight choice for LAN events.",
    category: Category.HEADSETS,
    price: 69.99,
    stock: 35,
    specs: { Drivers: "Dual dynamic", Microphone: "Detachable inline", Connection: "3.5 mm, detachable cable", Weight: "6 g per earbud" },
  },

  // Mousepads
  {
    slug: "glide-xl",
    name: "Glide XL",
    tagline: "Fast surface, full desk",
    description: "An extra-large speed mousepad with a smooth woven surface and stitched edges.",
    category: Category.MOUSEPADS,
    price: 29.99,
    stock: 120,
    featured: true,
    specs: { Size: "900 × 400 mm", Surface: "Speed (smooth weave)", Thickness: "4 mm", Edges: "Stitched" },
  },
  {
    slug: "control-pad-l",
    name: "Control Pad L",
    tagline: "Stop exactly where you aim",
    description: "A textured control surface that adds stopping power for precise micro-adjustments.",
    category: Category.MOUSEPADS,
    price: 24.99,
    stock: 95,
    specs: { Size: "450 × 400 mm", Surface: "Control (textured weave)", Thickness: "4 mm", Edges: "Stitched" },
  },
  {
    slug: "glass-pad",
    name: "Glass Pad",
    tagline: "Ultra-fast tempered glass",
    description: "A tempered glass mousepad with an etched surface — the fastest glide we make, and it never wears out.",
    category: Category.MOUSEPADS,
    price: 64.99,
    stock: 12,
    specs: { Size: "490 × 420 mm", Surface: "Etched tempered glass", Thickness: "4 mm", Base: "Silicone feet" },
  },
  {
    slug: "hybrid-pad-m",
    name: "Hybrid Pad M",
    tagline: "Balanced speed and control",
    description: "A medium hybrid pad that sits between speed and control — a safe pick if you're not sure.",
    category: Category.MOUSEPADS,
    price: 19.99,
    stock: 70,
    specs: { Size: "360 × 300 mm", Surface: "Hybrid weave", Thickness: "3 mm", Edges: "Stitched" },
  },

  // Accessories
  {
    slug: "cable-bungee",
    name: "Cable Bungee",
    tagline: "Wired, but drag-free",
    description: "A weighted bungee that holds your mouse cable up so it never catches on the desk.",
    category: Category.ACCESSORIES,
    price: 14.99,
    stock: 80,
    specs: { Base: "Weighted, anti-slip", Arm: "Flexible silicone" },
  },
  {
    slug: "coiled-cable",
    name: "Coiled Cable",
    tagline: "The finishing touch for your keyboard",
    description: "A braided coiled USB-C cable with an aviator connector, in five colourways.",
    category: Category.ACCESSORIES,
    price: 34.99,
    stock: 55,
    specs: { Length: "1.8 m", Connectors: "USB-C to USB-A, aviator", Sleeve: "Double braided" },
  },
  {
    slug: "wrist-rest",
    name: "Memory Foam Wrist Rest",
    tagline: "Comfort for long sessions",
    description: "A memory foam wrist rest sized for TKL and 75% keyboards, with a non-slip base.",
    category: Category.ACCESSORIES,
    price: 19.99,
    stock: 65,
    specs: { Size: "360 × 90 mm", Fill: "Memory foam", Base: "Non-slip rubber" },
  },
  {
    slug: "glide-skates",
    name: "Glide Skates",
    tagline: "Upgrade your mouse feet",
    description: "Pure PTFE replacement mouse feet with rounded edges. Includes sets for all Clutch Gear mice.",
    category: Category.ACCESSORIES,
    price: 9.99,
    stock: 200,
    specs: { Material: "100% virgin PTFE", Thickness: "0.8 mm", Fits: "All Clutch Gear mice" },
  },
  {
    slug: "grip-tape",
    name: "Grip Tape Set",
    tagline: "Never lose your grip",
    description: "Pre-cut grip tape for all Clutch Gear mice — adds texture without adding bulk.",
    category: Category.ACCESSORIES,
    price: 7.99,
    stock: 3,
    specs: { Thickness: "0.5 mm", Fits: "All Clutch Gear mice", Pieces: "4" },
  },
  {
    slug: "headset-stand",
    name: "Headset Stand",
    tagline: "Park your headset in style",
    description: "An aluminium headset stand with a built-in two-port USB hub.",
    category: Category.ACCESSORIES,
    price: 39.99,
    stock: 28,
    specs: { Material: "Aluminium", Hub: "2 × USB-A", Base: "Weighted, anti-slip" },
  },
  {
    slug: "usb-dongle-extender",
    name: "Dongle Extender",
    tagline: "Get your receiver closer",
    description: "A weighted extender that brings your wireless receiver close to your mouse for the most stable connection.",
    category: Category.ACCESSORIES,
    price: 12.99,
    stock: 110,
    specs: { Cable: "1.5 m USB-C", Base: "Weighted" },
  },
];

async function main() {
  // Upsert by slug, so the seed can be run again without creating duplicates
  for (const p of products) {
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      priceCents: Math.round(p.price * 100),
      stock: p.stock,
      imageUrl: `/products/${p.slug}.svg`,
      featured: p.featured ?? false,
      specs: p.specs,
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
