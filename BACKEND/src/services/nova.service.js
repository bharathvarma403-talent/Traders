const prisma = require('../db');
const { formatCurrency } = require('../utils/helpers');

// ── Legacy product name aliases (old seed names → current DB names) ───────────
const LEGACY_PRODUCT_ALIASES = {
  'UltraTech PPC': 'PPC Blended Cement',
  'UltraTech OPC': 'OPC 53 Grade Cement',
  'KCP Cement': 'OPC 53 Grade Cement',
  'Walker Cement': 'PPC Blended Cement',
  'Birla White': 'Acrylic Wall Putty',
  'Asian Paints (Emulsion)': 'Royal Emulsion Interior Paint',
  'ACC Primer': 'Royal Emulsion Interior Paint',
  'Apex Primer': 'WeatherCoat Exterior Paint',
  'Cooling Paints': 'WeatherCoat Exterior Paint',
  'Paint Brushes': 'Professional Paint Roller 9-Inch',
  '1/18 Wire (~1-1.5 sqmm)': 'FR PVC Insulated Wire 1.5 sqmm',
  'Wire 2.5 sqmm': 'FR PVC Insulated Wire 2.5 sqmm',
  'Wire 4.0 sqmm': 'FR PVC Insulated Wire 2.5 sqmm',
  '6A Switch': 'Penta 6A 1-Way Switch',
  '16A Switch': 'MCB 32A Double Pole',
  'MCB': 'MCB 32A Double Pole',
  'Ceiling Fan': 'High Speed Ceiling Fan 1200mm',
  '3/4 inch CPVC Pipe': 'CPVC SDR 11 Pipe 1-Inch',
  '1 inch CPVC Pipe': 'CPVC SDR 11 Pipe 1-Inch',
  'L Bend Fitting': 'Brass Ball Valve 1-Inch',
  'T Bend Fitting': 'Brass Ball Valve 1-Inch',
  '3 inch PVC Pipe': 'UPVC Schedule 40 Pipe 2-Inch',
  '4 inch PVC Pipe': 'UPVC Schedule 40 Pipe 2-Inch',
  '1000 L Tank': 'Triple Layer Water Tank 1000L',
};

const resolveProductNames = (names) =>
  [...new Set([...names].map((n) => LEGACY_PRODUCT_ALIASES[n] || n))];

// ── Construction Knowledge Base ───────────────────────────────────────────────
const KNOWLEDGE = {
  plastering: {
    keywords: ['plaster', 'plastering', 'ప్లాస్టర్', 'wall plaster', 'rendering'],
    en: `**Plastering Guide:**\n• Internal walls: Use cement:sand ratio of 1:4 (PPC cement recommended)\n• External walls: Use 1:3 ratio with waterproofing additive\n• Thickness: 12-15mm for internal, 15-20mm for external\n• Cure for minimum 7 days by keeping the surface moist\n• Use UltraTech PPC for best plastering results`,
    te: `ప్లాస్టరింగ్ గైడ్:\n• లోపలి గోడలు: సిమెంట్:ఇసుక నిష్పత్తి 1:4 (PPC సిమెంట్ ఉత్తమం)\n• బయటి గోడలు: 1:3 నిష్పత్తి వాటర్‌ప్రూఫింగ్‌తో\n• మందం: లోపల 12-15mm, బయట 15-20mm\n• కనీసం 7 రోజులు నీటితో క్యూరింగ్ చేయండి`,
    products: ['UltraTech PPC', 'Birla White'],
  },
  cement_mix: {
    keywords: ['cement mix', 'mix ratio', 'concrete', 'cement ratio', 'సిమెంట్', 'concrete mix', 'mortar'],
    en: `**Cement & Concrete Mix Ratios:**\n• M10 (Lean Mix): 1:3:6 — For foundations\n• M15 (Standard): 1:2:4 — For general construction\n• M20 (Structural): 1:1.5:3 — For RCC slabs, beams, columns\n• M25 (High Strength): 1:1:2 — For heavy load structures\n• For 1000 sq ft slab (5" thick): ~200 bags of cement, 40 cubic ft sand, 80 cubic ft aggregate\n• Always use OPC cement for structural work (UltraTech OPC recommended)`,
    te: `సిమెంట్ & కాంక్రీట్ మిక్స్ రేషియోలు:\n• M10: 1:3:6 — పునాదులకు\n• M15: 1:2:4 — సాధారణ నిర్మాణానికి\n• M20: 1:1.5:3 — RCC స్లాబ్‌లు, బీమ్‌లు\n• M25: 1:1:2 — భారీ భారం నిర్మాణాలకు\n• 1000 చ.అ. స్లాబ్‌కు: ~200 సిమెంటు సంచులు అవసరం`,
    products: ['UltraTech OPC', 'KCP Cement', 'Walker Cement'],
  },
  brick_laying: {
    keywords: ['brick', 'bricklaying', 'bonding pattern', 'ఇటుకలు', 'masonry', 'brick work'],
    en: `**Brick Laying & Bonding:**\n• English Bond: Alternating header and stretcher courses — strongest bond\n• Flemish Bond: Headers and stretchers in same course — decorative + strong\n• Stretcher Bond: All stretchers — used for partition walls\n• Mortar: Use 1:4 cement:sand ratio for brick mortar\n• Soak bricks in water for 2 hours before laying\n• Standard brick size: 230 x 110 x 75 mm\n• ~500 bricks per 100 sq ft for 9" wall`,
    te: `ఇటుక పనులు & బాండింగ్:\n• ఇంగ్లిష్ బాండ్: హెడర్ మరియు స్ట్రెచర్ మార్చి — బలమైన\n• ఫ్లెమిష్ బాండ్: అలంకార + బలమైన\n• మోర్టార్: 1:4 సిమెంట్:ఇసుక నిష్పత్తి\n• ఇటుకలను 2 గంటలు నీటిలో నానబెట్టండి`,
    products: ['KCP Cement', 'UltraTech PPC'],
  },
  waterproofing: {
    keywords: ['waterproof', 'waterproofing', 'leak', 'leakage', 'వాటర్‌ప్రూఫ్', 'seepage', 'water seepage', 'dampness'],
    en: `**Waterproofing Systems:**\n• Terrace: Apply polymer-modified cement coating\n• Bathroom: Use waterproofing membrane before tiling, especially at joints\n• Basement: External membrane + drainage + sump pump\n• Foundation: Bitumen coating on external face\n• Expansion joints: Use PU sealant\n• For old terraces: Clean + prime + 2 coats of elastomeric waterproofing\n• Always maintain slope (1:100) for water drainage`,
    te: `వాటర్‌ప్రూఫింగ్ వ్యవస్థలు:\n• టెర్రస్: పాలిమర్ సిమెంట్ కోటింగ్ వేయండి\n• బాత్రూమ్: టైలింగ్ ముందు మెంబ్రేన్ వాడండి\n• బేస్మెంట్: బయటి మెంబ్రేన్ + డ్రైనేజ్\n• ఎప్పుడూ నీటి ప్రవాహానికి వాలు (1:100) ఉంచండి`,
    products: ['UltraTech OPC', 'Birla White'],
  },
  flooring: {
    keywords: ['floor', 'flooring', 'tile', 'marble', 'granite', 'vitrified', 'ceramic', 'టైల్', 'నేల'],
    en: `**Flooring Guide:**\n• Vitrified tiles: Best for living areas, low maintenance, 60x60 or 80x80 cm\n• Ceramic tiles: Budget-friendly, good for bathrooms and kitchens\n• Marble: Premium look, needs regular polishing, avoid in kitchens\n• Granite: Extremely durable, ideal for high-traffic areas and staircases\n• Laying: Use 1:3 cement:sand bed + tile adhesive for vitrified\n• Grout: Use epoxy grout for bathrooms, cement grout for dry areas\n• Spacers: 2mm for rectified tiles, 3-5mm for rustic`,
    te: `ఫ్లోరింగ్ గైడ్:\n• విట్రిఫైడ్ టైల్స్: లివింగ్ ఏరియాలకు ఉత్తమం\n• సిరామిక్ టైల్స్: బడ్జెట్ ఫ్రెండ్లీ, బాత్రూమ్‌లకు\n• మార్బుల్: ప్రీమియం, క్రమం తప్పకుండా పాలిష్ అవసరం\n• గ్రానైట్: అత్యంత మన్నికైన, సిడిరి భాగాలకు`,
    products: ['UltraTech OPC', 'Birla White'],
  },
  paint: {
    keywords: ['paint', 'painting', 'primer', 'emulsion', 'పెయింట్', 'రంగు', 'distemper', 'texture'],
    en: `**Paint & Coating Guide:**\n• Interior: Use acrylic emulsion (Asian Paints Tractor Emulsion or Royale)\n• Exterior: Weather-resistant exterior emulsion with anti-fungal\n• Primer: Always apply 1 coat of primer before painting\n• Sequence: Putty (2 coats) → Primer (1 coat) → Emulsion (2-3 coats)\n• For new walls: Wait 28 days after plastering before painting\n• Anti-fungal: Use in high-humidity areas (bathrooms, kitchens)\n• Paint peeling causes: Moisture, poor primer, painting on damp wall`,
    te: `పెయింట్ & కోటింగ్ గైడ్:\n• లోపల: ఆక్రిలిక్ ఎమల్షన్ వాడండి\n• బయట: వెదర్-రెసిస్టెంట్ ఎక్స్‌టీరియర్ ఎమల్షన్\n• ప్రైమర్: పెయింట్ ముందు ఒక కోటు ప్రైమర్ తప్పనిసరి\n• క్రమం: పుట్టీ → ప్రైమర్ → ఎమల్షన్ (2-3 కోట్లు)\n• కొత్త గోడలు: ప్లాస్టరింగ్ తర్వాత 28 రోజులు వేచి ఉండండి`,
    products: ['Asian Paints (Emulsion)', 'ACC Primer', 'Apex Primer', 'Cooling Paints', 'Paint Brushes'],
  },
  cracks: {
    keywords: ['crack', 'cracked', 'wall crack', 'పగుళ్లు', 'structural crack', 'hairline'],
    en: `**Crack Analysis & Repair:**\n• Hairline cracks (<1mm): Non-structural. Fill with crack filler putty, then prime and paint\n• Settlement cracks (1-5mm): May indicate foundation issue. Monitor for 3 months\n• Structural cracks (>5mm, diagonal): SERIOUS — consult structural engineer immediately\n• Plaster cracks: Remove loose plaster, re-plaster with 1:3 mix, cure 7 days\n• Thermal cracks: Caused by heat expansion. Use flexible sealant\n• Prevention: Proper curing, expansion joints every 30m, wire mesh at junctions`,
    te: `పగుళ్ల విశ్లేషణ & మరమ్మత్తు:\n• హెయిర్‌లైన్ పగుళ్లు (<1mm): ప్రమాదకరం కాదు. క్రాక్ ఫిల్లర్ పుట్టీతో పూడ్చండి\n• సెటిల్‌మెంట్ పగుళ్లు (1-5mm): పునాది సమస్య. 3 నెలలు పర్యవేక్షించండి\n• స్ట్రక్చరల్ క్రాక్స్ (>5mm): తీవ్రమైన — ఇంజనీర్‌ను సంప్రదించండి`,
    products: ['Birla White', 'UltraTech PPC'],
  },
  roof: {
    keywords: ['roof', 'roofing', 'terrace', 'slab', 'పైకప్పు', 'roof repair', 'roof leak'],
    en: `**Roof & Terrace Repair:**\n• Slab casting: Use M20 mix (1:1.5:3), minimum 5" thickness for residential\n• Steel reinforcement: 8mm and 10mm TMT bars in both directions\n• Curing: Keep wet for 14-21 days minimum\n• Waterproofing: Apply 2 coats of polymer coating after curing\n• Roof tiles: Clay tiles last 50+ years, concrete tiles 30+ years\n• Leak repair: Identify source, chip plaster, apply waterproof coating, re-plaster`,
    te: `పైకప్పు & టెర్రస్ మరమ్మత్తు:\n• స్లాబ్: M20 మిక్స్ (1:1.5:3), కనీసం 5" మందం\n• స్టీల్: 8mm మరియు 10mm TMT బార్లు\n• క్యూరింగ్: కనీసం 14-21 రోజులు తడిగా ఉంచండి\n• వాటర్‌ప్రూఫింగ్: 2 కోట్లు పాలిమర్ కోటింగ్`,
    products: ['UltraTech OPC', 'KCP Cement'],
  },
  damp: {
    keywords: ['damp', 'moisture', 'seepage', 'efflorescence', 'తేమ', 'fungus', 'mold', 'mould'],
    en: `**Damp, Seepage & Efflorescence:**\n• Rising damp: Inject DPC (Damp Proof Course) at plinth level\n• Seepage through walls: Apply external waterproof coating\n• Efflorescence (white salt deposits): Brush off, apply dilute HCl acid wash, then seal\n• Anti-fungal treatment: Clean with bleach solution, apply anti-fungal primer\n• Bathroom seepage: Re-do waterproofing membrane + grouting\n• Prevention: Proper drainage slope, DPC at plinth, waterproofing on terraces`,
    te: `తేమ, ఊట & ఎఫ్లోరెసెన్స్:\n• రైజింగ్ డ్యాంప్: ప్లింత్ స్థాయిలో DPC ఇంజెక్ట్ చేయండి\n• గోడల ద్వారా ఊట: బయటి వాటర్‌ప్రూఫ్ కోటింగ్\n• ఎఫ్లోరెసెన్స్: బ్రష్ చేసి, ఆసిడ్ వాష్, సీల్ చేయండి\n• బాత్రూమ్ ఊట: వాటర్‌ప్రూఫింగ్ మెంబ్రేన్ మళ్లీ చేయండి`,
    products: ['Birla White', 'ACC Primer'],
  },
  electrical: {
    keywords: ['wire', 'wiring', 'switch', 'socket', 'mcb', 'electrical', 'ఎలక్ట్రికల్', 'fan', 'circuit'],
    en: `**Electrical Installation Guide:**\n• House wiring: Use 1.5 sqmm for lights, 2.5 sqmm for power sockets, 4.0 sqmm for ACs\n• Always use ISI-marked wires (Havells recommended)\n• MCB sizing: 6A for lights, 16A for power, 32A for AC circuits\n• Earthing: Essential for safety — use GI pipe earthing or plate earthing\n• Always use conduit pipes (PVC) for concealed wiring\n• Circuit breaker: Install separate MCBs for each circuit`,
    te: `ఎలక్ట్రికల్ ఇన్‌స్టలేషన్:\n• ఇంటి వైరింగ్: లైట్లకు 1.5 sqmm, సాకెట్లకు 2.5 sqmm, ACలకు 4.0 sqmm\n• ISI మార్క్ వైర్లు వాడండి (Havells ఉత్తమం)\n• MCB సైజింగ్: లైట్లకు 6A, పవర్‌కు 16A, AC కోసం 32A\n• ఎర్తింగ్: భద్రతకు తప్పనిసరి`,
    products: ['1/18 Wire (~1-1.5 sqmm)', 'Wire 2.5 sqmm', 'Wire 4.0 sqmm', '6A Switch', '16A Switch', 'MCB', 'Ceiling Fan'],
  },
  pipes: {
    keywords: ['pipe', 'plumbing', 'cpvc', 'pvc', 'fitting', 'పైపు', 'plumber'],
    en: `**Plumbing & Pipes Guide:**\n• Hot water: Use CPVC pipes (Ashirvad brand recommended)\n• Cold water supply: CPVC or uPVC pipes\n• Drainage: Use PVC pipes — 3" for bathroom, 4" for toilet\n• Fittings: L-bend for corners, T-bend for branch connections\n• Water tank: 1000L tank for family of 4-5 (200L per person per day)\n• Always test pressure before closing walls`,
    te: `ప్లంబింగ్ & పైపుల గైడ్:\n• వేడి నీరు: CPVC పైపులు (Ashirvad)\n• చల్లని నీరు: CPVC లేదా uPVC\n• డ్రైనేజ్: PVC — బాత్రూమ్‌కు 3", టాయిలెట్‌కు 4"\n• ట్యాంక్: 4-5 మంది కుటుంబానికి 1000L`,
    products: ['3/4 inch CPVC Pipe', '1 inch CPVC Pipe', 'L Bend Fitting', 'T Bend Fitting', '3 inch PVC Pipe', '4 inch PVC Pipe', '1000 L Tank'],
  },
  safety: {
    keywords: ['safety', 'site safety', 'precaution', 'helmet', 'భద్రత', 'ppe'],
    en: `**Construction Site Safety:**\n• PPE: Hard hat, safety boots, gloves, high-vis vest mandatory\n• Scaffolding: Check stability daily, use guardrails\n• Electrical work: Always switch off mains before working\n• Excavation: Shore trenches deeper than 4 feet\n• First aid kit: Must be available on site at all times\n• No work during thunderstorms or heavy rain`,
    te: `నిర్మాణ స్థల భద్రత:\n• PPE: హార్డ్ హ్యాట్, సేఫ్టీ బూట్లు, గ్లోవ్స్ తప్పనిసరి\n• స్కాఫోల్డింగ్: రోజూ స్థిరత్వం చెక్ చేయండి\n• ఎలక్ట్రికల్ పని: ముందు మెయిన్స్ ఆఫ్ చేయండి\n• ఫస్ట్ ఎయిడ్ కిట్: ఎప్పుడూ అందుబాటులో ఉండాలి`,
  },
  wood: {
    keywords: ['wood', 'timber', 'termite', 'చెక్క', 'wood treatment', 'polish'],
    en: `**Wood Treatment & Care:**\n• Termite prevention: Apply anti-termite chemical at foundation level\n• Wood polish: Use melamine or PU polish for doors and furniture\n• Teak wood: Best for doors and windows (most termite-resistant)\n• Plywood: Use marine plywood (BWP) for bathroom cabinets\n• Wood seasoning: Air-dry for 6 months or kiln-dry before use\n• Maintenance: Re-polish every 3-5 years`,
    te: `చెక్క చికిత్స & సంరక్షణ:\n• చెదపురుగు నివారణ: పునాది స్థాయిలో యాంటీ-టెర్మైట్ కెమికల్\n• టేకు: తలుపులు మరియు కిటికీలకు ఉత్తమం\n• ప్లైవుడ్: బాత్రూమ్ క్యాబినెట్లకు BWP మెరైన్ ప్లైవుడ్`,
  },
  corrosion: {
    keywords: ['rust', 'corrosion', 'iron', 'metal', 'తుప్పు', 'steel', 'rebar'],
    en: `**Metal & Iron Corrosion Prevention:**\n• TMT rebars: Apply anti-corrosive primer before embedding in concrete\n• Iron gates: Sand blast → zinc primer → enamel paint (2 coats)\n• Window grills: Use galvanized steel or apply regular paint every 2 years\n• Red oxide primer: Essential base coat for all metal surfaces\n• Concrete cover: Maintain minimum 25mm cover over rebars to prevent corrosion`,
    te: `లోహం & ఇనుము తుప్పు నివారణ:\n• TMT రీబార్లు: కాంక్రీట్‌లో ఉంచే ముందు యాంటీ-కరోసివ్ ప్రైమర్\n• ఇనుప గేట్లు: జింక్ ప్రైమర్ → ఎనామెల్ పెయింట్ (2 కోట్లు)\n• రెడ్ ఆక్సైడ్ ప్రైమర్: అన్ని లోహ ఉపరితలాలకు తప్పనిసరి`,
    products: ['ACC Primer', 'Apex Primer'],
  },
};

const GREETING_RE = /\b(hi|hello|hey|నమస్కారం|నమస్తే|హాయ్)\b/i;

// ── Main Query Processor ──────────────────────────────────────────────────────

const processNovaQuery = async (query) => {
  const q = query.toLowerCase();

  // Greeting shortcut
  if (GREETING_RE.test(q)) {
    return {
      en: "Hello! I'm Nova, your AI construction assistant at Vasavi Traders. I can help you with:\n• Cement mix ratios & material estimation\n• Plastering, brick laying & waterproofing\n• Paint selection, primers & coatings\n• Electrical wiring & plumbing\n• Crack analysis & repair\n• Flooring, roofing & damp treatment\n• Wood treatment & metal corrosion prevention\n• Construction site safety\n\nAsk me anything about construction!",
      te: "నమస్కారం! నేను నోవా, వసవి ట్రేడర్స్ AI నిర్మాణ సహాయకురాలిని. నిర్మాణం గురించి ఏదైనా అడగండి!",
      products: [],
    };
  }

  const matchedTopics = [];
  const recommendedProductNames = new Set();

  for (const data of Object.values(KNOWLEDGE)) {
    const matched = data.keywords.some((kw) => q.includes(kw.toLowerCase()));
    if (matched) {
      matchedTopics.push(data);
      data.products?.forEach((p) => recommendedProductNames.add(p));
    }
  }

  if (matchedTopics.length === 0) {
    return {
      en: `I understand you're asking about "${query}". I specialise in construction topics — please try asking about cement, plastering, waterproofing, paint, electrical, plumbing, flooring, or structural work.`,
      te: `"${query}" గురించి మీ ప్రశ్న అర్థమైంది. దయచేసి సిమెంట్, ప్లాస్టరింగ్, వాటర్‌ప్రూఫింగ్, పెయింట్, ఎలక్ట్రికల్, ప్లంబింగ్ వంటి అంశాల గురించి అడగండి.`,
      products: [],
    };
  }

  // Fetch live product details for recommendations
  let productDetails = [];
  if (recommendedProductNames.size > 0) {
    try {
      const resolvedNames = resolveProductNames(recommendedProductNames);
      const dbProducts = await prisma.product.findMany({
        where: { name: { in: resolvedNames } },
        include: { brand: true },
      });
      productDetails = dbProducts.map((p) => ({
        name: p.name,
        brand: p.brand?.name,
        price: formatCurrency(p.price),
        inStock: p.stockStatus === 'In Stock',
      }));
    } catch { /* non-critical — continue without recommendations */ }
  }

  let enResponse = matchedTopics.map((t) => t.en).join('\n\n');
  let teResponse = matchedTopics.map((t) => t.te).join('\n\n');

  if (productDetails.length > 0) {
    enResponse += `\n\n**📦 Recommended from Vasavi Traders:**\n`;
    enResponse += productDetails
      .map((p) => `• ${p.name} (${p.brand}) — ${p.price} ${p.inStock ? '✅ In Stock' : '❌ Out of Stock'}`)
      .join('\n');

    teResponse += `\n\n📦 వసవి ట్రేడర్స్ నుండి సిఫారసు:\n`;
    teResponse += productDetails
      .map((p) => `• ${p.name} (${p.brand}) — ${p.price} ${p.inStock ? '✅ స్టాక్‌లో ఉంది' : '❌ స్టాక్‌లో లేదు'}`)
      .join('\n');
  }

  return { en: enResponse, te: teResponse, products: productDetails };
};

module.exports = { processNovaQuery };
