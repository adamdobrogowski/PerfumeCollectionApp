import { getReadableTextColor } from './colors.js'


const ACCORD_COLORS = {
  // Drzewne i ziemiste
  woody: '#8B5A2B',
  earthy: '#7A6248',
  patchouli: '#45723a',
  oud: '#2e2421',
  clay: '#B47353',
  sand: '#D9C29C',
  mossy: '#4F6B3A',
  conifer: '#2F6B4A',
  // Waniliowe, kremowe i słodkie
  vanilla: '#F0DFB0',
  creamy: '#F5EAD2',
  lactonic: '#EDDCC8',
  caramel: '#C98B3C',
  honey: '#E3A92A',
  beeswax: '#E7CB63',
  almond: '#D9B98E',
  nutty: '#B98A5B',
  coconut: '#F1ECE2',
  sweet: '#D9788C',
  gourmand: '#A9663E',
  chocolate: '#5D3A2A',
  cacao: '#6E4430',
  coffee: '#4B3328',
  // Cytrusowe i owocowe
  citrus: '#F2C230',
  fruity: '#F08A3A',
  tropical: '#F5A04A',
  cherry: '#B5223B',
  rum: '#9B5B2E',
  // Kwiatowe
  floral: '#E889A8',
  'white floral': '#F3ECE8',
  'yellow floral': '#E8B923',
  rose: '#D43D64',
  tuberose: '#EFD3DE',
  iris: '#A084C9',
  violet: '#8E5CB5',
  lavender: '#9B7ED1',
  // Zielone i ziołowe
  green: '#4F9D4A',
  herbal: '#6FAF6B',
  aromatic: '#41936E',
  cannabis: '#619032',
  terpenic: '#8AA84B',
  camphor: '#A8C6C2',
  bitter: '#6E7B3A',
  sour: '#B7C93A',
  // Wodne i świeże
  aquatic: '#3FA7D6',
  marine: '#2D7CB4',
  ozonic: '#9BD1E8',
  salty: '#8EB8C7',
  fresh: '#7FD3D0',
  mineral: '#8FA3AD',
  // Korzenne
  spicy: '#C0392B',
  'warm spicy': '#B5532A',
  'soft spicy': '#D98A6B',
  'fresh spicy': '#D4743B',
  cinnamon: '#A0522D',
  anis: '#7B5E8A',
  savory: '#8A6D3B',
  // Bursztynowe, orientalne i miękkie
  amber: '#C77A1E',
  balsamic: '#A5642D',
  oriental: '#B5472D',
  animalic: '#7A4B3A',
  musky: '#C8A9B8',
  powdery: '#E3C9D6',
  soapy: '#CFE0E8',
  aldehydic: '#DDE2E6',
  // Skóra, tytoń i dym
  leather: '#5A3A2E',
  tobacco: '#7A4A25',
  smoky: '#5E5A57',
  // Alkohole i napoje
  alcohol: '#B9C7D3',
  wine: '#7B1E3A',
  whiskey: '#B9742E',
  vodka: '#D7E3EA',
  champagne: '#F0DE9C',
  'coca-cola': '#6B1E1E',
  // Przemysłowe i nietypowe
  metallic: '#9AA3AB',
  plastic: '#A9B4BE',
  rubber: '#4D4D4D',
  vinyl: '#7A8791',
  asphault: '#3E3E3E',
  gasoline: '#6A7786',
  'hot iron': '#8A8F94',
  'industrial glue': '#B8B2A0',
  'brown scotch tape': '#B08D5B',
  paper: '#E7E0D0',
  oily: '#C9B77A',
}

const FALLBACK_COLOR = '#E9ECEF'

export function getAccordStyle(name) {
  const backgroundColor = Object.hasOwn(ACCORD_COLORS, name) ? ACCORD_COLORS[name] : FALLBACK_COLOR
  return {
    backgroundColor,
    color: getReadableTextColor(backgroundColor),
    border: '1px solid rgba(0, 0, 0, 0.18)',
  }
}