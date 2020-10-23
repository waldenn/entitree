import {
  HUMAN_ID,
  ORGANIZATION_ID,
  BUSINESS_ID,
  HUMAN_SETTLEMENT_ID,
} from "./entities";

export const INSTANCE_OF_ID = "P31";

export const SIBLINGS_ID = "P3373";
export const SPOUSE_ID = "P26";
export const BIRTH_DATE_ID = "P569";
export const BIRTH_PLACE_ID = "P19";
export const DEATH_DATE_ID = "P570";
export const DEATH_PLACE_ID = "P20";
export const BIRTH_NAME = "P1477";
export const GENDER_ID = "P21";
export const EYE_COLOR_ID = "P1340";
export const HAIR_COLOR_ID = "P1884";
export const FATHER_ID = "P22";
export const MOTHER_ID = "P25";
export const CHILD_ID = "P40";
export const NUMBER_OF_CHILDREN_ID = "P1971";
export const STUDENT_OF_ID = "P1066";
export const STUDENT_ID = "P802";
export const LOCATED_IN_ID = "P131";
export const IMAGE_ID = "P18";
export const LOGO_ID = "P154";
export const TWITTER_ID = "P2002";
export const START_DATE_ID = "P580";
export const END_DATE_ID = "P582";
export const INCEPTION_ID = "P571";
export const DISSOLVED_ABOLISHED_DEMOLISHED_ID = "P576";
export const WEBSITE_ID = "P856";
export const WIKITREE_ID = "P2949";

export const FAMILY_IDS_MAP = {
  [CHILD_ID]: true,
  [SIBLINGS_ID]: true,
  [SPOUSE_ID]: true,
  [FATHER_ID]: true,
  [MOTHER_ID]: true,
};

export const FAMILY_PROP = {
  id: CHILD_ID,
  slug: "family_tree",
  label: "child",
  overrideLabel: "family tree",
  overrideLabels: {
    "zh-hans": "家族树",
    "zh-hant": "家族樹",
    "zh-hk": "家族樹",
    "zh-cn": "家族树",
    "zh-sg": "家族树",
    "zh-tw": "家族樹",
    pl: "Drzewo genealogiczne",
    eu: "Zuhaitz genealogiko",
    es: "árbol genealógico",
    or: "ବଂଶାବଳୀ",
    hu: "családfa",
    ms: "Salasilah keluarga",
    it: "albero genealogico",
    et: "Sugupuu",
    de: "Stammbaum",
    id: "Bagan silsilah",
    br: "Gwezenn-gerentiezh",
    el: "Γενεαλογικό δέντρο",
    sh: "Obiteljsko stablo",
    ar: "شجرة العائلة",
    sv: "Släktträd",
    nl: "stamboom",
    pt: "árvore genealógica",
    eo: "genealogia arbo",
    sk: "Rodokmeň",
    ru: "генеалогическое древо",
    tt: "Шәҗәрә",
    en: "family tree",
    tr: "Soy ağacı",
    ro: "Arbore genealogic",
    ca: "arbre genealògic",
    fi: "Sukupuu",
    cy: "Coeden deulu",
    sl: "Družinsko drevo",
    cs: "rodokmen",
    fa: "تبارنامه",
    hr: "Obiteljsko stablo",
    "kk-arab": "گەنەالوگىييالىك اعاش",
    "kk-cn": "گەنەالوگىييالىك اعاش",
    "kk-tr": "Genealogïyalık ağaş",
    "kk-kz": "Генеалогиялык ағаш",
    "kk-cyrl": "Генеалогиялык ағаш",
    "kk-latn": "Genealogïyalık ağaş",
    da: "Efterslægtstavle",
    ko: "가계도",
    kk: "Генеалогиялык ағаш",
    sah: "Төрүччү",
    zh: "谱系图",
    gl: "Árbore xenealóxica",
    bn: "কুলজিনামা",
    uk: "Генеалогічне дерево",
    ta: "குடும்ப மரம்",
    fr: "arbre généalogique",
    sr: "породично стабло",
    "sr-ec": "породично стабло",
    "sr-el": "porodično stablo",
    lv: "Ciltskoks",
    sco: "faimily tree",
    az: "Nəsil şəcərəsi",
    ja: "系図",
    hi: "वंशावली",
    he: "אילן יוחסין",
    la: "Arbor familiaris",
    nb: "stamtre",
    hyw: "Տոհմածառ",
    hy: "տոհմածառ",
    vro: "Sugupuu",
  },
  isFav: true,
};

export const BUSINESS_PROPS = [
  {
    id: "P355",
    label: "Subsidiaries",
    isFav: true,
  },
  {
    id: "P749",
    label: "Parent orgs",
    isFav: true,
  },
  {
    id: "P1830",
    label: "Ownership",
    isFav: true,
  },
  {
    id: "P127",
    label: "Ownership reversed?",
    isFav: true,
  },
];

export const SOCIAL_PROPS_IDS = {
  wikidata: {
    title: "Open Wikidata item in a new tab",
    iconName: "wikidata",
    alt: "wikidata icon",
    baseUrl: "",
  },
  wikipedia: {
    title: "Open wikipedia article in a new tab",
    iconName: "wikipedia",
    alt: "wikipedia icon",
    baseUrl: "",
  },
  P6634: {
    title: "Open LinkedIn profile in a new tab",
    iconName: "linkedin",
    alt: "linkedin icon",
    baseUrl: "https://www.linkedin.com/in/",
  },
  P2003: {
    title: "Open instagram profile in a new tab",
    alt: "instagram icon",
    iconName: "instagram",
    baseUrl: "https://www.instagram.com/",
  },
  P2002: {
    title: "Open twitter profile in a new tab",
    alt: "twitter icon",
    iconName: "twitter",
    baseUrl: "https://twitter.com/",
  },
  P2013: {
    title: "Open facebook page in a new tab",
    iconName: "facebook",
    alt: "facebook icon",
    baseUrl: "https://www.facebook.com/",
  },
  P2949: {
    title: "Open wikitree profile in a new tab",
    iconName: "wikitree",
    alt: "wikitree icon",
    baseUrl: "https://www.wikitree.com/wiki/",
  },
  P2600: {
    title: "Open geni profile in a new tab",
    iconName: "geni",
    alt: "geni icon",
    baseUrl: "https://www.geni.com/profile/index/",
  },
  P7085: {
    title: "Open geni profile in a new tab",
    iconName: "tiktok",
    alt: "tiktok icon",
    baseUrl: "https://www.tiktok.com/@",
  },
  // 'P345' : ['imdb',' https://www.imdb.com/name/$1/']
};
