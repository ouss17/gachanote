export type Gacha = {
  id: string;
  name: string;
  logo: any;
  tags: string[];
};

export const GACHAS: Gacha[] = [
  {
    id: "bbs",
    name: "Bleach Brave Souls",
    logo: require("@/assets/logos/bbs.png"),
    tags: ["bleach", "bbs"]
  },
  {
    id: "bsr",
    name: "Bleach Soul Resonance",
    logo: require("@/assets/logos/bsr.png"),
    tags: ["bleach", "bsr", "soulresonance"]
  },
  {
    id: "dbl",
    name: "Dragon Ball Legends",
    logo: require("@/assets/logos/dbl.png"),
    tags: ["dragonball", "dbz", "dbl", "db"]
  },
  {
    id: "dokkan",
    name: "Dragon Ball Z : Dokkan Battle",
    logo: require("@/assets/logos/dokkan.png"),
    tags: ["dragonball", "dbz", "db"]
  },
  {
    id: "fgo",
    name: "Fate Grand Order",
    logo: require("@/assets/logos/fgo.png"),
    tags: ["fgo", "grandorder"]
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    logo: require("@/assets/logos/genshin.png"),
    tags: ["gi"]
  },
  {
    id: "hsr",
    name: "Honkai Star Rail",
    logo: require("@/assets/logos/hsr.png"),
    tags: ["hsr", "starrail"]
  },
  {
    id: "nikke",
    name: "Nikke",
    logo: require("@/assets/logos/nikke.png"),
    tags: ["nikke"]
  },
  {
    id: "opbounty",
    name: "One Piece Bounty Rush",
    logo: require("@/assets/logos/opbounty.png"),
    tags: ["onepiece", "op", "bountyrush", "opbr"]
  },
  {
    id: "optc",
    name: "One Piece Treasure Cruise",
    logo: require("@/assets/logos/optc.png"),
    tags: ["onepiece", "op", "optc", "treasurecruise"]
  },
  {
    id: "uma",
    name: "Uma Musume Pretty Derby",
    logo: require("@/assets/logos/uma.png"),
    tags: ["umamusume", "prettyderby"]
  },
  {
    id: "ww",
    name: "Wuthering Waves",
    logo: require("@/assets/logos/wuwa.png"),
    tags: ["wutheringwaves", "ww", "wuwa"]
  },
];
