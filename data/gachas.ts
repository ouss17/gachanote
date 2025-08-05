export type Gacha = {
  id: string;
  name: string;
  logo: any; // Remplace par ImageSourcePropType si tu utilises React Native Image
};

export const GACHAS: Gacha[] = [
  {
    id: "bbs",
    name: "Bleach Brave Souls",
    logo: require("@/assets/logos/bbs.png"),
  },
  {
    id: "bsr",
    name: "Bleach Soul Resonance",
    logo: require("@/assets/logos/bsr.png"),
  },
  {
    id: "dbl",
    name: "Dragon Ball Legends",
    logo: require("@/assets/logos/dbl.png"),
  },
  {
    id: "dokkan",
    name: "Dokkan Battle",
    logo: require("@/assets/logos/dokkan.png"),
  },
  {
    id: "fgo",
    name: "Fate Grand Order",
    logo: require("@/assets/logos/fgo.png"),
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    logo: require("@/assets/logos/genshin.png"),
  },
  {
    id: "hsr",
    name: "Honkai Star Rail",
    logo: require("@/assets/logos/hsr.png"),
  },
  {
    id: "nikke",
    name: "Nikke",
    logo: require("@/assets/logos/nikke.png"),
  },
  {
    id: "opbounty",
    name: "One Piece Bounty Rush",
    logo: require("@/assets/logos/opbounty.png"),
  },
  {
    id: "optc",
    name: "One Piece Treasure Cruise",
    logo: require("@/assets/logos/optc.png"),
  },
  {
    id: "uma",
    name: "Uma Musume Pretty Derby",
    logo: require("@/assets/logos/uma.png"),
  },
  {
    id: "ww",
    name: "Wuthering Waves",
    logo: require("@/assets/logos/wuwa.png"),
  },
];
