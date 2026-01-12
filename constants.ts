
import { PrinterInfo, MajorArcana } from './types';

export const CARD_SIZES = {
  standard: { label: 'Standard Tarot', dims: '2.75" x 4.75"', px: { w: 825, h: 1425 } },
  mini: { label: 'Mini Tarot', dims: '1.75" x 3.5"', px: { w: 525, h: 1050 } },
  jumbo: { label: 'Jumbo Tarot', dims: '3.5" x 5.5"', px: { w: 1050, h: 1650 } },
};

export const PRINTERS: PrinterInfo[] = [
  {
    name: "Make Playing Cards (MPC)",
    pricePerDeck: 22.50,
    minOrder: 1,
    deliveryTime: "10-14 days",
    features: ["Linen finish", "Gilded edges", "Custom boxes"]
  },
  {
    name: "The Game Crafter",
    pricePerDeck: 18.99,
    minOrder: 1,
    deliveryTime: "2-3 weeks",
    features: ["Satin finish", "Eco-friendly", "Custom booklet support"]
  },
  {
    name: "DriveThruCards",
    pricePerDeck: 15.00,
    minOrder: 1,
    deliveryTime: "7-10 days",
    features: ["Standard UV coat", "Affordable", "High volume discounts"]
  },
  {
    name: "Shuffledink",
    pricePerDeck: 25.00,
    minOrder: 10,
    deliveryTime: "2 weeks",
    features: ["Superior card stock", "Foil stamping", "Fast shipping"]
  },
  {
    name: "PrintNinja",
    pricePerDeck: 9.50,
    minOrder: 500,
    deliveryTime: "6-8 weeks",
    features: ["Offset printing", "Highest quality", "Massive customization"]
  }
];

export const MAJOR_ARCANA_LIST = Object.values(MajorArcana);

export const DEFAULT_STYLE = "Mystical oil painting with gold leaf accents, celestial themes, highly detailed, dramatic lighting, tarot aesthetic.";
