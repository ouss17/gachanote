export type Gacha = {
  id: string;
  name: string;
  logo: any;
  resourceType?: string; // nouvelle propriété pour indiquer la ressource par défaut
  tags: string[];
};

export const GACHAS: Gacha[] = [
  {
    id: "bbs",
    name: "Bleach Brave Souls",
    logo: require("@/assets/logos/bbs.png"),
    resourceType: "orbs",
    tags: ["bleach", "bbs"]
  },
  {
    id: "bsr",
    name: "Bleach Soul Resonance",
    logo: require("@/assets/logos/bsr.png"),
    resourceType: "primalgem",
    tags: ["bleach", "bsr", "soulresonance"]
  },
  {
    id: "dbl",
    name: "Dragon Ball Legends",
    logo: require("@/assets/logos/dbl.png"),
    resourceType: "cc",
    tags: ["dragonball", "dbz", "dbl", "db"]
  },
  {
    id: "dokkan",
    name: "Dragon Ball Z : Dokkan Battle",
    logo: require("@/assets/logos/dokkan.png"),
    resourceType: "ds",
    tags: ["dragonball", "dbz", "db"]
  },
  {
    id: "fgo",
    name: "Fate Grand Order",
    logo: require("@/assets/logos/fgo.png"),
    resourceType: "sq",
    tags: ["fgo", "grandorder"]
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    logo: require("@/assets/logos/genshin.png"),
    resourceType: "primogems",
    tags: ["gi"]
  },
  {
    id: "hsr",
    name: "Honkai Star Rail",
    logo: require("@/assets/logos/hsr.png"),
    resourceType: "hyperspace",
    tags: ["hsr", "starrail"]
  },
  {
    id: "nikke",
    name: "Nikke",
    logo: require("@/assets/logos/nikke.png"),
    resourceType: "gemmes",
    tags: ["nikke"]
  },
  {
    id: "opbounty",
    name: "One Piece Bounty Rush",
    logo: require("@/assets/logos/opbounty.png"),
    resourceType: "diamants",
    tags: ["onepiece", "op", "bountyrush", "opbr"]
  },
  {
    id: "optc",
    name: "One Piece Treasure Cruise",
    logo: require("@/assets/logos/optc.png"),
    resourceType: "gems",
    tags: ["onepiece", "op", "optc", "treasurecruise"]
  },
  {
    id: "uma",
    name: "Uma Musume Pretty Derby",
    logo: require("@/assets/logos/uma.png"),
    resourceType: "carats",
    tags: ["umamusume", "prettyderby"]
  },
  {
    id: "ww",
    name: "Wuthering Waves",
    logo: require("@/assets/logos/wuwa.png"),
    resourceType: "convenes",
    tags: ["wutheringwaves", "ww", "wuwa"]
  },
  {
    id: "zenlesszone",
    name: "Zenless Zone Zero",
    logo: require("@/assets/logos/zzz.png"),
    resourceType: "polychromes",
    tags: ["zenlesszone", "zz"]
  },
  {
    id: "haikyufh",
    name: "Haikyu!! Fly High!!",
    logo: require("@/assets/logos/haikyufh.png"),
    resourceType: "diamonds",
    tags: ["haikyufh", "haikyuu", "flyhigh"]
  },
  {
    id: "jjkpp",
    name: "Jujutsu Kaisen Phantom Parade",
    logo: require("@/assets/logos/jjkpp.png"),
    resourceType: "cubes",
    tags: ["jjkpp", "jujutsukaisen", "phantomparade"]
  },
  {
    id: "sdgundamgge",
    name: "SD Gundam G Generation Eternal",
    logo: require("@/assets/logos/gundamgg.png"),
    resourceType: "diamonds",
    tags: ["sdgundam", "ggeneration", "eternal"]
  }
];
