export const TOTAL_STICKERS = 980;
export const STICKERS_PER_TEAM = 20;
export const FWC_STICKERS = 20;

export type Language = "da" | "bs";

export type Team = {
  id: string;
  flag: string;
  flagCode: string;
  abbr: string;
  name: Record<Language, string>;
  start: number;
  end: number;
};

export type StickerGroup = {
  id: string;
  letter: string;
  teams: Team[];
};

const teamSeeds: Array<{
  id: string;
  flag: string;
  flagCode: string;
  abbr: string;
  name: Record<Language, string>;
}> = [
  { id: "mex", flag: "🇲🇽", flagCode: "mx", abbr: "MEX", name: { da: "Mexico", bs: "Meksiko" } },
  { id: "rsa", flag: "🇿🇦", flagCode: "za", abbr: "RSA", name: { da: "Sydafrika", bs: "Južna Afrika" } },
  { id: "kor", flag: "🇰🇷", flagCode: "kr", abbr: "KOR", name: { da: "Sydkorea", bs: "Južna Koreja" } },
  { id: "cze", flag: "🇨🇿", flagCode: "cz", abbr: "CZE", name: { da: "Tjekkiet", bs: "Češka" } },

  { id: "can", flag: "🇨🇦", flagCode: "ca", abbr: "CAN", name: { da: "Canada", bs: "Kanada" } },
  { id: "bih", flag: "🇧🇦", flagCode: "ba", abbr: "BIH", name: { da: "Bosnien-Hercegovina", bs: "Bosna i Hercegovina" } },
  { id: "qat", flag: "🇶🇦", flagCode: "qa", abbr: "QAT", name: { da: "Qatar", bs: "Katar" } },
  { id: "sui", flag: "🇨🇭", flagCode: "ch", abbr: "SUI", name: { da: "Schweiz", bs: "Švicarska" } },

  { id: "bra", flag: "🇧🇷", flagCode: "br", abbr: "BRA", name: { da: "Brasilien", bs: "Brazil" } },
  { id: "mar", flag: "🇲🇦", flagCode: "ma", abbr: "MAR", name: { da: "Marokko", bs: "Maroko" } },
  { id: "hai", flag: "🇭🇹", flagCode: "ht", abbr: "HAI", name: { da: "Haiti", bs: "Haiti" } },
  { id: "sco", flag: "🏴", flagCode: "gb-sct", abbr: "SCO", name: { da: "Skotland", bs: "Škotska" } },

  { id: "usa", flag: "🇺🇸", flagCode: "us", abbr: "USA", name: { da: "USA", bs: "Sjedinjene Američke Države" } },
  { id: "par", flag: "🇵🇾", flagCode: "py", abbr: "PAR", name: { da: "Paraguay", bs: "Paragvaj" } },
  { id: "aus", flag: "🇦🇺", flagCode: "au", abbr: "AUS", name: { da: "Australien", bs: "Australija" } },
  { id: "tur", flag: "🇹🇷", flagCode: "tr", abbr: "TUR", name: { da: "Tyrkiet", bs: "Turska" } },

  { id: "ger", flag: "🇩🇪", flagCode: "de", abbr: "GER", name: { da: "Tyskland", bs: "Njemačka" } },
  { id: "cuw", flag: "🇨🇼", flagCode: "cw", abbr: "CUW", name: { da: "Curaçao", bs: "Curaçao" } },
  { id: "civ", flag: "🇨🇮", flagCode: "ci", abbr: "CIV", name: { da: "Elfenbenskysten", bs: "Obala Slonovače" } },
  { id: "ecu", flag: "🇪🇨", flagCode: "ec", abbr: "ECU", name: { da: "Ecuador", bs: "Ekvador" } },

  { id: "ned", flag: "🇳🇱", flagCode: "nl", abbr: "NED", name: { da: "Nederlandene", bs: "Nizozemska" } },
  { id: "jpn", flag: "🇯🇵", flagCode: "jp", abbr: "JPN", name: { da: "Japan", bs: "Japan" } },
  { id: "swe", flag: "🇸🇪", flagCode: "se", abbr: "SWE", name: { da: "Sverige", bs: "Švedska" } },
  { id: "tun", flag: "🇹🇳", flagCode: "tn", abbr: "TUN", name: { da: "Tunesien", bs: "Tunis" } },

  { id: "bel", flag: "🇧🇪", flagCode: "be", abbr: "BEL", name: { da: "Belgien", bs: "Belgija" } },
  { id: "egy", flag: "🇪🇬", flagCode: "eg", abbr: "EGY", name: { da: "Egypten", bs: "Egipat" } },
  { id: "irn", flag: "🇮🇷", flagCode: "ir", abbr: "IRN", name: { da: "Iran", bs: "Iran" } },
  { id: "nzl", flag: "🇳🇿", flagCode: "nz", abbr: "NZL", name: { da: "New Zealand", bs: "Novi Zeland" } },

  { id: "esp", flag: "🇪🇸", flagCode: "es", abbr: "ESP", name: { da: "Spanien", bs: "Španija" } },
  { id: "cpv", flag: "🇨🇻", flagCode: "cv", abbr: "CPV", name: { da: "Kap Verde", bs: "Zelenortska Ostrva" } },
  { id: "ksa", flag: "🇸🇦", flagCode: "sa", abbr: "KSA", name: { da: "Saudi-Arabien", bs: "Saudijska Arabija" } },
  { id: "uru", flag: "🇺🇾", flagCode: "uy", abbr: "URU", name: { da: "Uruguay", bs: "Urugvaj" } },

  { id: "fra", flag: "🇫🇷", flagCode: "fr", abbr: "FRA", name: { da: "Frankrig", bs: "Francuska" } },
  { id: "sen", flag: "🇸🇳", flagCode: "sn", abbr: "SEN", name: { da: "Senegal", bs: "Senegal" } },
  { id: "irq", flag: "🇮🇶", flagCode: "iq", abbr: "IRQ", name: { da: "Irak", bs: "Irak" } },
  { id: "nor", flag: "🇳🇴", flagCode: "no", abbr: "NOR", name: { da: "Norge", bs: "Norveška" } },

  { id: "arg", flag: "🇦🇷", flagCode: "ar", abbr: "ARG", name: { da: "Argentina", bs: "Argentina" } },
  { id: "alg", flag: "🇩🇿", flagCode: "dz", abbr: "ALG", name: { da: "Algeriet", bs: "Alžir" } },
  { id: "aut", flag: "🇦🇹", flagCode: "at", abbr: "AUT", name: { da: "Østrig", bs: "Austrija" } },
  { id: "jor", flag: "🇯🇴", flagCode: "jo", abbr: "JOR", name: { da: "Jordan", bs: "Jordan" } },

  { id: "por", flag: "🇵🇹", flagCode: "pt", abbr: "POR", name: { da: "Portugal", bs: "Portugal" } },
  { id: "cod", flag: "🇨🇩", flagCode: "cd", abbr: "COD", name: { da: "DR Congo", bs: "DR Kongo" } },
  { id: "uzb", flag: "🇺🇿", flagCode: "uz", abbr: "UZB", name: { da: "Usbekistan", bs: "Uzbekistan" } },
  { id: "col", flag: "🇨🇴", flagCode: "co", abbr: "COL", name: { da: "Colombia", bs: "Kolumbija" } },

  { id: "eng", flag: "🏴", flagCode: "gb-eng", abbr: "ENG", name: { da: "England", bs: "Engleska" } },
  { id: "cro", flag: "🇭🇷", flagCode: "hr", abbr: "CRO", name: { da: "Kroatien", bs: "Hrvatska" } },
  { id: "gha", flag: "🇬🇭", flagCode: "gh", abbr: "GHA", name: { da: "Ghana", bs: "Gana" } },
  { id: "pan", flag: "🇵🇦", flagCode: "pa", abbr: "PAN", name: { da: "Panama", bs: "Panama" } }
];

export const groups: StickerGroup[] = Array.from({ length: 12 }, (_, groupIndex) => {
  const letter = String.fromCharCode(65 + groupIndex);
  const teams = teamSeeds.slice(groupIndex * 4, groupIndex * 4 + 4).map((team, teamIndex) => {
    const overallTeamIndex = groupIndex * 4 + teamIndex;
    const start = FWC_STICKERS + overallTeamIndex * STICKERS_PER_TEAM + 1;
    return {
      ...team,
      start,
      end: start + STICKERS_PER_TEAM - 1
    };
  });

  return {
    id: `group-${letter.toLowerCase()}`,
    letter,
    teams
  };
});

export const fwcRange = {
  start: 1,
  end: FWC_STICKERS,
  total: FWC_STICKERS
};

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function isValidStickerNumber(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= TOTAL_STICKERS;
}

export function stickerGroupLabel(letter: string, language: Language) {
  return language === "da" ? `Gruppe ${letter}` : `Grupa ${letter}`;
}
