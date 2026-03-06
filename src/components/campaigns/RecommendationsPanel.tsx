'use client';

import { useMemo } from 'react';
import styles from './RecommendationsPanel.module.css';
import type { PredictionOutput, FormValues } from './PredictionForm';

interface RecommendationsPanelProps {
  prediction: PredictionOutput;
  formValues: FormValues;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function countEmojis(text: string): number {
  return (text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u00A9|\u00AE/g) ?? []).length;
}

function hasCallToAction(text: string): boolean {
  return /\b(shop|buy|visit|click|link|swipe|comment|share|tag|follow|dm|message|check|get|try|join|sign|subscribe|order|book|call|contact|win|enter|vote|save|download|read|watch|learn|discover|explore)\b/i.test(text);
}

function hasQuestion(text: string): boolean {
  return text.includes('?');
}

function captionScore(caption: string): number {
  let score = 0;
  const len = caption.trim().length;
  if (len >= 80 && len <= 200) score += 30;
  else if (len >= 40 && len < 80) score += 18;
  else if (len > 200 && len <= 350) score += 20;
  else if (len > 0) score += 8;
  if (hasCallToAction(caption)) score += 25;
  if (hasQuestion(caption)) score += 15;
  const emojis = countEmojis(caption);
  if (emojis >= 1 && emojis <= 5) score += 20;
  else if (emojis > 5) score += 10;
  if (/sinhala|ශ්‍රී|ලංකා|sri lanka|sl|colombo|කොළඹ/i.test(caption)) score += 10;
  return Math.min(score, 100);
}

function contentScore(content: string): number {
  let score = 0;
  const len = content.trim().length;
  if (len >= 100 && len <= 500) score += 40;
  else if (len >= 30 && len < 100) score += 20;
  else if (len > 500) score += 30;
  else if (len > 0) score += 10;
  if (/sale|offer|discount|free|special|exclusive|limited|deal|promo/i.test(content)) score += 20;
  if (/quality|trusted|local|made|fresh|natural|original|genuine/i.test(content)) score += 20;
  if (/\bsinhala\b|ශ්‍රී|රු\.|rs\.|lkr\b/i.test(content)) score += 20;
  return Math.min(score, 100);
}

function timingScore(time: string, platform: string): number {
  const [rawH] = time.split(':').map(Number);
  // Sri Lanka optimal windows per platform (UTC+5:30 local)
  const windows: Record<string, number[][]> = {
    Facebook:  [[8, 11], [18, 21]],
    Instagram: [[7, 10], [11, 14], [18, 22]],
    TikTok:    [[7, 9],  [12, 15], [19, 23]],
    Twitter:   [[8, 10], [12, 13], [17, 19]],
    YouTube:   [[12, 15],[18, 22]],
  };
  const w = windows[platform] ?? [[8, 20]];
  const inWindow = w.some(([s, e]) => rawH >= s && rawH < e);
  return inWindow ? 100 : 45;
}

interface ScoreBreakdown {
  caption: number;
  content: number;
  timing: number;
  followers: number;
  overall: number;
}

function computeScores(fv: FormValues): ScoreBreakdown {
  const caption  = captionScore(fv.caption);
  const content  = contentScore(fv.content);
  const timing   = timingScore(fv.post_time, fv.platform);
  const foll     = Math.min(Number(fv.followers) / 10000, 1) * 100;
  const overall  = Math.round(caption * 0.35 + content * 0.25 + timing * 0.2 + foll * 0.1 + (fv.ad_boost ? 10 : 0));
  return { caption, content, timing, followers: foll, overall: Math.min(overall, 100) };
}

// Per-platform best hours (Sri Lanka local)
const PLATFORM_BEST_TIMES: Record<string, string> = {
  Facebook:  '8–11 AM & 6–9 PM (Sri Lanka time)',
  Instagram: '7–10 AM, 11 AM–2 PM & 6–10 PM',
  TikTok:    '7–9 AM, 12–3 PM & 7–11 PM',
  Twitter:   '8–10 AM, 12–1 PM & 5–7 PM',
  YouTube:   '12–3 PM & 6–10 PM',
};

// ─── Topic Detection ──────────────────────────────────────────────────────────

interface TopicMatch {
  category: string;
  hashtags: string[];
  score: number;
}

const TOPIC_MAP: (Omit<TopicMatch, 'score'> & { keywords: string[] })[] = [
  {
    category: 'Food & Beverage',
    keywords: ['food','restaurant','cafe','meal','rice','curry','kottu','hoppers','delicious','taste','recipe','cook','bake','dessert','cake','sweet','drink','tea','coffee','bakery','catering','snack'],
    hashtags: ['#SriLankaFood','#ColomboEats','#SriLankanCuisine','#FoodiesSriLanka','#CafeColombo','#SLFoodie','#HomemadeFood','#SriLankaFoodie'],
  },
  {
    category: 'Fashion & Clothing',
    keywords: ['fashion','dress','wear','outfit','style','clothes','shirt','saree','kurta','collection','clothing','apparel','fabric','tailor','boutique','handmade','accessories','jewellery','bag'],
    hashtags: ['#SriLankaFashion','#ColomboBoutique','#SriLankaStyle','#LKAFashion','#HandmadeSriLanka','#FashionSriLanka','#SriLankaDesigner','#MadeinSriLanka'],
  },
  {
    category: 'Beauty & Wellness',
    keywords: ['beauty','skin','hair','nails','spa','salon','glow','makeup','cosmetic','natural','organic','wellness','skincare','face','cream','serum','lotion','treatment','facial'],
    hashtags: ['#SriLankaBeauty','#NaturalSriLanka','#ColomboSkincare','#BeautySriLanka','#SriLankaSalon','#GlowSriLanka','#SkincareSriLanka','#NaturalBeauty'],
  },
  {
    category: 'Technology & Electronics',
    keywords: ['tech','phone','laptop','computer','software','digital','gadget','electronic','device','repair','mobile','wifi','app','online','website','programming','hardware'],
    hashtags: ['#SriLankaTech','#ColomboTech','#SriLankaTechnology','#TechSriLanka','#DigitalSriLanka','#SriLankaIT','#ColomboIT','#TechColombo'],
  },
  {
    category: 'Health & Pharmacy',
    keywords: ['health','medicine','pharmacy','clinic','doctor','hospital','wellness','vitamin','supplement','ayurveda','herbal','fitness','yoga','gym','workout','diet','nutrition'],
    hashtags: ['#HealthSriLanka','#AyurvedaSriLanka','#SriLankaWellness','#FitnessSriLanka','#SriLankaHealth','#NaturalHealth','#ColomboFitness','#SriLankaFitness'],
  },
  {
    category: 'Home & Decor',
    keywords: ['home','decor','furniture','interior','house','room','garden','kitchen','bed','sofa','curtain','paint','renovation','design','craft','handcraft'],
    hashtags: ['#SriLankaHomes','#ColomboInterior','#HomeDecorSriLanka','#SriLankaFurniture','#InteriorDesignSriLanka','#HomeSriLanka','#ColomboDécor','#HomeCraftSL'],
  },
  {
    category: 'Education & Training',
    keywords: ['education','course','class','learn','study','school','tuition','training','skill','english','exam','certification','university','degree','teaching','workshop','seminar'],
    hashtags: ['#SriLankaEducation','#ColomboTuition','#LearnSriLanka','#SriLankaSkills','#OnlineLearningSriLanka','#EducationSriLanka','#SriLankaCourses','#StudySriLanka'],
  },
  {
    category: 'Travel & Tourism',
    keywords: ['travel','tour','trip','holiday','vacation','beach','sigiriya','kandy','galle','safari','hotel','resort','visit','sightseeing','explore','adventure','destination','accommodation'],
    hashtags: ['#VisitSriLanka','#SriLankaTourism','#SriLankaTravel','#BeautifulSriLanka','#ExploresSriLanka','#SriLankaHoliday','#TravelSriLanka','#SriLankaVacation'],
  },
  {
    category: 'Retail & Shopping',
    keywords: ['sale','shop','buy','offer','discount','deal','price','product','stock','wholesale','retail','delivery','shipping','order','store','market'],
    hashtags: ['#ShopSriLanka','#SriLankaSale','#OnlineShoppingSriLanka','#SriLankaDeals','#LKAShopping','#ColomboShopping','#SriLankaOffers','#BuySriLanka'],
  },
  {
    category: 'Events & Entertainment',
    keywords: ['event','concert','show','party','wedding','festival','avurudu','vesak','christmas','celebration','live','entertainment','music','dance','performance','photography'],
    hashtags: ['#SriLankaEvents','#ColomboEvents','#SriLankaFestival','#LKAEntertainment','#SriLankaWedding','#ColomboCelebration','#EventsSriLanka','#SriLankaEntertainment'],
  },
];

function detectTopics(caption: string, content: string): TopicMatch[] {
  const combined = `${caption} ${content}`.toLowerCase();
  const matched: TopicMatch[] = [];
  for (const topic of TOPIC_MAP) {
    const score = topic.keywords.filter(kw => combined.includes(kw)).length;
    if (score >= 1) matched.push({ category: topic.category, hashtags: topic.hashtags, score });
  }
  return matched.sort((a, b) => b.score - a.score).slice(0, 2);
}

// ─── Dynamic hashtags based on content + platform ─────────────────────────────

const PLATFORM_BASE_HASHTAGS: Record<string, string[]> = {
  Facebook:  ['#SriLanka', '#LKA', '#SriLankanSME', '#MadeinSriLanka', '#LKABusiness'],
  Instagram: ['#SriLanka', '#Colombo', '#LKA', '#SriLankanBusiness', '#VisitSriLanka'],
  TikTok:    ['#SriLanka', '#SriLankaTikTok', '#LKATok', '#SriLankanCreator', '#ColomboLife'],
  Twitter:   ['#SriLanka', '#LKA', '#SriLankaSME', '#ColomboTech', '#SriLankaStartup'],
  YouTube:   ['#SriLanka', '#SriLankanYouTube', '#ColomboVlog', '#SriLankaReview', '#MadeinSriLanka'],
};

function getContextualHashtags(fv: FormValues): string[] {
  const topics = detectTopics(fv.caption, fv.content);
  const platformBase = PLATFORM_BASE_HASHTAGS[fv.platform] ?? PLATFORM_BASE_HASHTAGS['Facebook'];
  if (topics.length === 0) {
    return [...platformBase, '#SriLankaSmallBusiness', '#ShopSriLanka', '#SriLankaLocal'].slice(0, 10);
  }
  const topicTags = topics.flatMap(t => t.hashtags);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of [...topicTags, ...platformBase]) {
    if (!seen.has(tag)) { seen.add(tag); result.push(tag); }
    if (result.length >= 10) break;
  }
  return result;
}

// ─── Dynamic caption tips based on actual caption state ───────────────────────

function getDynamicCaptionTips(fv: FormValues): string[] {
  const caption  = fv.caption;
  const len      = caption.trim().length;
  const emojis   = countEmojis(caption);
  const hasCTA   = hasCallToAction(caption);
  const hasQ     = hasQuestion(caption);
  const hasLocal = /sinhala|ශ්‍රී|ලංකා|sri lanka|colombo|kandy|galle/i.test(caption);
  const hasSin   = /[ශශ්ල ලංකා]|sinhala/i.test(caption);

  const tipsMap: Record<string, string[]> = {
    Facebook: [
      !hasCTA
        ? 'No call-to-action found. Add "Comment YES below 👇" or "Share with a friend!" — comments are Facebook\'s #1 ranking signal.'
        : 'CTA detected! Rotate it each post — "Tag someone who needs this 👇" this week, "Share if you agree ♻️" next week.',
      len > 250
        ? `Caption is ${len} chars. Facebook hides content after ~125 chars — front-load your key message in the first sentence.`
        : len < 80
        ? `Caption is only ${len} chars. Aim for 80–200 characters to give Facebook's algorithm more engagement signals.`
        : `Caption length (${len} chars) is ideal for Facebook. Keep your strongest sentence first.`,
      !hasQ
        ? 'No question detected. Questions drive comments, which Facebook boosts. Try: "What do you think? Drop a comment below! 💬"'
        : 'Great — caption includes a question! Yes/No or either-or questions get the fastest responses on Facebook.',
      !hasLocal
        ? 'Add a local reference (Colombo, Kandy, Sri Lanka) to appear in local Facebook feeds and community groups.'
        : 'Good local reference! Also try adding a district or neighbourhood for hyper-local feed placement.',
    ],
    Instagram: [
      emojis === 0
        ? 'No emojis found. Add 3–5 emojis — they act as visual anchors that stop thumb-scrolling on Instagram.'
        : emojis > 6
        ? `${emojis} emojis is too many. Trim to 3–5 to keep an engaging but professional tone.`
        : `Good emoji use (${emojis}). Make sure each one directly reinforces your message.`,
      len > 200
        ? `Caption is ${len} chars. Instagram shows only ~125 chars before "more" — move your strongest line to the very start.`
        : `First 1–2 words are critical on Instagram — only the opening shows before the fold.`,
      !hasCTA
        ? 'Missing CTA. End with "Save this 🔖", "Tag a friend!", or "DM us for price 📩" for direct action.'
        : 'CTA spotted! For Instagram, action verbs (Save / Tag / DM / Shop) at the end of the caption convert best.',
      !hasSin
        ? 'No Sinhala detected. Bilingual captions (Sinhala + English) reach Sri Lanka\'s full audience and signal local authenticity.'
        : 'Sinhala detected — great for local trust! Ensure an English translation is also present for broader reach.',
    ],
    TikTok: [
      len > 150
        ? `Caption is ${len} chars — too long for TikTok. Trim to under 100 characters; users scroll within 0.5 seconds.`
        : `Good TikTok caption length (${len} chars). Pair with trending Sri Lankan audio for maximum reach.`,
      !hasCTA
        ? 'No CTA. TikTok challenge CTAs work best: "Duet this", "Try and show me", or "Comment your favourite emoji 👇".'
        : 'CTA found! TikTok rewards CTAs inviting duets, stitches, or comment chains — these extend a video\'s lifespan.',
      emojis === 0
        ? 'Add 2–3 emojis to the TikTok caption — they improve readability and match the platform\'s high-energy tone.'
        : `${emojis} emoji(s) found. TikTok audiences love expressive emojis — keep them story-relevant.`,
      'Use 3–5 niche hashtags (not just #fyp). Combine your industry + "SriLanka" (e.g., #FoodSriLanka) to surface in the right local TikTok feeds.',
    ],
    Twitter: [
      len > 200
        ? `Tweet is ${len} chars. Under-100-char tweets get 17% more engagement. Edit for punchy delivery.`
        : `Good tweet length (${len} chars)! Keep the most important word in the first 10 characters for skimming.`,
      !hasQ
        ? 'No question. End with "Agree?" or add a poll — they generate 10× more replies than statement-only tweets.'
        : 'Question detected! Reply to the first 3 comments quickly — early engagement pushes the tweet into more feeds.',
      !hasCTA
        ? 'No CTA. "RT if you agree", "Drop thoughts below", or "Quote-tweet with your take" drive the highest Twitter engagement.'
        : 'CTA found! On Twitter, placing it at the end — after the key message — converts best.',
      emojis > 3
        ? `${emojis} emojis detected. Reduce to 1–2 on Twitter — heavy emoji use lowers credibility on professional/news feeds.`
        : 'Emoji usage looks appropriate for Twitter. One well-placed emoji increases click-through noticeably.',
    ],
    YouTube: [
      len === 0
        ? 'Description is empty. YouTube indexes descriptions for search — write 150–300 words with your keywords in the first 3 lines.'
        : len < 100
        ? `Description is only ${len} chars. YouTube SEO needs 150+ words — expand with niche keywords and a subscribe CTA.`
        : `Good description length (${len} chars). Ensure your primary keyword appears in the first 25 words for YouTube SEO.`,
      !hasCTA
        ? 'No CTA in description. Always include "Subscribe ▶️", a link to your channel, and social handles.'
        : 'CTA found! Also add timestamps — they improve watch time, which YouTube ranks more heavily than view count.',
      !hasLocal
        ? 'Add "Sri Lanka" and your city naturally in the description to rank in local YouTube searches.'
        : 'Local keywords detected. Also tag your city (Colombo, Kandy, Galle) in the video tag list for full local SEO.',
      'Add a playlist link in the description — YouTube surfaces videos inside active playlists more than standalone uploads.',
    ],
  };
  return tipsMap[fv.platform] ?? tipsMap['Facebook'];
}

// ─── Dynamic content tips based on actual content state ───────────────────────

function getDynamicContentTips(fv: FormValues): string[] {
  const content     = fv.content;
  const len         = content.trim().length;
  const hasOffer    = /sale|offer|discount|free|special|exclusive|limited|deal|promo/i.test(content);
  const hasTrust    = /quality|trusted|local|made|fresh|natural|original|genuine/i.test(content);
  const hasPrice    = /lkr|රු\.|rs\.|price|cost|රු/i.test(content);
  const hasLocalRef = /colombo|kandy|galle|sri lanka|sinhala/i.test(content);

  const tipsMap: Record<string, string[]> = {
    Facebook: [
      len < 80
        ? `Content is only ${len} chars. Facebook rewards substance — describe your product/service in 80–200 chars to signal content quality.`
        : `Content length (${len} chars) suits Facebook. Make sure the first sentence clearly answers "What am I looking at?"`,
      !hasOffer
        ? 'No promotional hook. Posts with urgency ("Today only!", "While stocks last") get 2× more engagement on Sri Lankan Facebook feeds.'
        : 'Good — promotional language found! Add a deadline ("Until Sunday", "Limited to 50 orders") to increase conversion urgency.',
      !hasTrust
        ? 'No trust signals. Sri Lankan buyers respond to "locally made", "family recipe", or "trusted by 500+ customers in Colombo".'
        : 'Trust signals detected! Quantify them: "1,200 happy customers in Colombo" is far stronger than "trusted by many".',
      !hasLocalRef
        ? 'Add a local reference (Colombo, Sri Lanka, your city) — Facebook\'s local algorithm prioritises locally-relevant content in community feeds.'
        : 'Local reference found. Also mention the specific district for Facebook community group targeting.',
    ],
    Instagram: [
      len < 50
        ? `Very short content (${len} chars). Even visual platforms benefit from 50–150 chars — Instagram indexes content text for search.`
        : `Content length (${len} chars) is suitable. Make sure niche keywords appear naturally for Instagram search visibility.`,
      !hasOffer
        ? 'No offer highlighted. Instagram Story-style urgency ("Limited pieces available!") converts very well for product businesses.'
        : 'Offer language found! On Instagram, pair it with a bold visual to make the offer the hero element of the image.',
      !hasTrust
        ? 'Add social proof: testimonial snippets, "Bestseller" labels, or star ratings boost Instagram credibility significantly.'
        : 'Trust language detected! Showing the face behind the brand alongside trust statements increases saves and shares.',
      !hasPrice
        ? 'Consider mentioning the price in LKR — Sri Lankan Instagram shoppers frequently decide to Save posts based on visible pricing.'
        : 'Price mentioned — excellent for direct sales! Ensure the price also appears on the image/reel, not just in the text.',
    ],
    TikTok: [
      len > 300
        ? `Content (${len} chars) is too long for TikTok. Users don't read long text — focus on 1 key message per video.`
        : `Good content focus for TikTok (${len} chars). Describe exactly what happens in the first 3 seconds of the video.`,
      !hasOffer
        ? '"Watch to the end for a discount code" drives completion rate — TikTok\'s #1 ranking signal. Add an end-video offer.'
        : 'Offer detected! On TikTok, reveal it at the end to force completion rate up, which the algorithm rewards heavily.',
      !hasTrust
        ? 'Show behind-the-scenes of your SME. TikTok ranks "real" content — a phone-recorded workshop outperforms studio shots.'
        : 'Trust signal found. TikTok responds best to founder-led videos — appear on camera to amplify authenticity.',
      'Include locally trending sounds and regional phrases. TikTok surfaces culturally familiar content to matching local "For You" feeds.',
    ],
    Twitter: [
      len < 30
        ? `Very short content (${len} chars). Add data points ("90% of Sri Lankan SMEs see ROI within 3 months") to make tweets quotable.`
        : `Content length (${len} chars) is appropriate. The first 10 words decide whether users read on — make them count.`,
      !hasOffer
        ? 'No value hook. Twitter content performs best when offering a stat, a tip, a deal, or a strong opinion.'
        : 'Good — value offered! Making it a "hot take" or surprising fact increases quote-tweets (the highest-value Twitter interaction).',
      !hasTrust
        ? 'Add a credibility signal: a client count, a review snippet, or an industry achievement. Twitter audiences are sceptical — data builds trust fast.'
        : 'Trust language found. Linking to external proof (review page, media mention) in the first reply boosts credibility further.',
      'Keep paragraphs to 1 sentence. Walls of text get scrolled past — use line breaks between every new idea.',
    ],
    YouTube: [
      len < 100
        ? `Short description (${len} chars). YouTube SEO needs 150–300 words — expand with niche keywords, timestamps, and a subscribe CTA.`
        : len > 600
        ? `Long description (${len} chars). Structure it: (1) What this video covers, (2) Timestamps, (3) Links, (4) Subscribe CTA.`
        : `Good description length (${len} chars). Add timestamps for maximum watch time and discoverability.`,
      !hasOffer
        ? 'No lead magnet in description. Descriptions with a free resource ("Free checklist 👇") get 3× more clicks to your bio link.'
        : 'Offer detected — excellent! Place it right after the intro paragraph to maximise CTA click-through.',
      !hasTrust
        ? 'Add channel authority signals: subscriber milestones, press mentions, or client testimonials in the first 3 lines.'
        : 'Trust signals found. Pin a "social proof" comment (happy customer screenshot) at the top of comments to reinforce this.',
      !hasLocalRef
        ? 'Add "Sri Lanka" and your city in the first 25 words — YouTube surfaces location-relevant videos to local searchers first.'
        : 'Local reference found. Include it in the video title and thumbnail text too for full local SEO coverage.',
    ],
  };
  return tipsMap[fv.platform] ?? tipsMap['Facebook'];
}

// ─── Dynamic general tips based on detected content gaps ─────────────────────

function getDynamicGeneralTips(fv: FormValues): string[] {
  const combined    = `${fv.caption} ${fv.content}`.toLowerCase();
  const topics      = detectTopics(fv.caption, fv.content);
  const hasSinhala  = /[ශශ්ල ලංකා]|sinhala/i.test(combined);
  const hasWhatsApp = /whatsapp|wa\.me/.test(combined);
  const hasPrice    = /lkr|රු|rs\.|price/i.test(combined);
  const follCount   = Number(fv.followers);

  const tips: string[] = [];

  if (!hasSinhala) {
    tips.push("Missing bilingual content. Sinhala + English captions see 40% higher local reach — reach Sri Lanka's full audience.");
  }
  if (!hasPrice) {
    tips.push('No price visible. Sri Lankan buyers decide faster when the LKR price is shown upfront — avoid "DM for price" when possible.');
  }
  if (!hasWhatsApp) {
    tips.push('No WhatsApp link detected. Add wa.me/94XXXXXXXXX — Sri Lankan consumers strongly prefer WhatsApp over DMs or contact forms.');
  }
  if (follCount > 0 && follCount < 1000) {
    tips.push('Under 1,000 followers. Focus on local Facebook community groups and neighbourhood pages to grow reach organically before spending on ads.');
  } else if (follCount >= 1000 && follCount < 10000) {
    tips.push('Micro-influencer range (1K–10K). Cross-promote with other local Sri Lankan SMEs — doubles reach with zero ad spend.');
  } else if (follCount >= 10000) {
    tips.push(`Strong base (${follCount.toLocaleString()} followers). Warm up your audience with a dedicated Story/Reel before any paid campaign — retargeting engaged followers costs up to 60% less.`);
  }

  if (topics.length > 0) {
    const categoryInsights: Record<string, string> = {
      'Food & Beverage':          'Food posts between 11 AM–1 PM (lunch decision window) get 2× more saves and shares on Sri Lankan feeds.',
      'Fashion & Clothing':       'Fashion posts on weekends (Sat–Sun) perform best in Sri Lanka. Use "New Arrival 🆕" in the opening line.',
      'Beauty & Wellness':        'Beauty before/after content ("2 weeks of use →") gets 5× more shares from Sri Lankan female audiences aged 18–35.',
      'Technology & Electronics': 'Price comparison content ("LKR 45,000 vs. LKR 72,000 from dealers") drives 3× more saves on Sri Lankan tech posts.',
      'Health & Pharmacy':        'Health content citing a local Sri Lankan context ("common in our humidity") builds trust faster than generic claims.',
      'Home & Decor':             '"Room reveal" framing drives significantly more saves on Instagram and shares on Facebook for home decor brands.',
      'Education & Training':     'Education posts citing real Sri Lankan exam stats or job market data get 4× more shares than generic study tips.',
      'Travel & Tourism':         'Sri Lankan travel content featuring lesser-known spots earns higher shares driven by local pride than famous landmarks alone.',
      'Retail & Shopping':        '"Stocks limited" or "Valid until Sunday" is essential — without urgency, 68% of interested Sri Lankan viewers scroll past.',
      'Events & Entertainment':   'Countdown posts ("3 days to go 🎉") shared 48 hours before the event get the highest RSVP and share rate on Sri Lankan Facebook.',
    };
    const tip = categoryInsights[topics[0].category];
    if (tip) tips.push(tip);
  }

  if (!fv.ad_boost) {
    tips.push(`Even LKR 300–500/day on ${fv.platform} can reach 5,000–15,000 Sri Lankans in your demographic. Start with your best-performing organic post.`);
  }

  if (fv.platform === 'Instagram' || fv.platform === 'TikTok') {
    tips.push('Use location stickers in Stories — geotagged content is shown to users actively searching that location on both Instagram and TikTok.');
  }

  const fallbacks = [
    'Partner with local micro-influencers (1K–50K followers) for authentic Sri Lankan audience reach — 2–3× higher engagement than paid ads.',
    "Use social proof language: 'Trusted by 500+ Sri Lankan families' or 'Colombo #1 choice' builds immediate credibility with local buyers.",
    'Plan campaigns 2 weeks ahead of Sri Lankan festivals (Avurudu April, Vesak May, Christmas Dec) — early content ranks higher during the festival period.',
    'Mention your city/region (Colombo, Kandy, Galle) to tap into local pride and community group search — a free visibility boost.',
  ];
  let fi = 0;
  while (tips.length < 5 && fi < fallbacks.length) tips.push(fallbacks[fi++]);
  return tips.slice(0, 6);
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function RecommendationsPanel({ prediction, formValues }: RecommendationsPanelProps) {
  const scores         = useMemo(() => computeScores(formValues),             [formValues]);
  const captionTips    = useMemo(() => getDynamicCaptionTips(formValues),     [formValues]);
  const contentTips    = useMemo(() => getDynamicContentTips(formValues),     [formValues]);
  const generalTips    = useMemo(() => getDynamicGeneralTips(formValues),     [formValues]);
  const hashtags       = useMemo(() => getContextualHashtags(formValues),     [formValues]);
  const detectedTopics = useMemo(() => detectTopics(formValues.caption, formValues.content), [formValues]);
  const bestTime       = PLATFORM_BEST_TIMES[formValues.platform] ?? PLATFORM_BEST_TIMES['Facebook'];

  const captionLen = formValues.caption.trim().length;
  const contentLen = formValues.content.trim().length;
  const emojis     = countEmojis(formValues.caption);

  const inOptimalWindow = timingScore(formValues.post_time, formValues.platform) === 100;

  const captionIssues: string[] = [];
  if (captionLen === 0) captionIssues.push('Caption is empty — add a caption to significantly boost engagement.');
  else if (captionLen < 40) captionIssues.push('Caption is too short (under 40 chars). Aim for 80–200 characters.');
  else if (captionLen > 350) captionIssues.push('Caption is very long. Consider trimming to under 250 characters for better readability.');
  if (!hasCallToAction(formValues.caption)) captionIssues.push('No call-to-action detected. Add phrases like "Comment below", "Shop now", or "Tag a friend".');
  if (!hasQuestion(formValues.caption)) captionIssues.push('Adding a question to your caption can increase comments by up to 30%.');
  if (emojis === 0) captionIssues.push('Use 2–5 emojis to make your caption more eye-catching and increase engagement.');
  if (emojis > 7) captionIssues.push('Too many emojis can look spammy. Reduce to 2–5 for a professional, engaging tone.');

  const contentIssues: string[] = [];
  if (contentLen === 0) contentIssues.push('Content is empty. Even a brief product/service description improves prediction scores.');
  else if (contentLen < 50) contentIssues.push('Content is very short. Expand to at least 100 characters with product/service details.');
  if (!/sale|offer|discount|free|special|exclusive|limited|deal|promo/i.test(formValues.content)) {
    contentIssues.push('Highlight a special offer, discount, or exclusive product to drive clicks and shares.');
  }
  if (!/quality|trusted|local|made|fresh|original|genuine/i.test(formValues.content)) {
    contentIssues.push('Add trust signals like "locally made", "quality guaranteed", or "trusted by X customers".');
  }

  const timingIssues: string[] = [];
  if (!inOptimalWindow && formValues.post_time) {
    timingIssues.push(`Current post time (${formValues.post_time}) is outside the optimal window for ${formValues.platform}.`);
    timingIssues.push(`Best times on ${formValues.platform} for Sri Lankan audiences: ${bestTime}.`);
  }

  // Predicted lift if all improvements applied
  const currentOverall = scores.overall;
  const potentialOverall = Math.min(
    currentOverall +
      (captionIssues.length * 7) +
      (contentIssues.length * 5) +
      (timingIssues.length > 0 ? 12 : 0),
    100,
  );
  const lift = potentialOverall - currentOverall;

  function scoreColor(s: number) {
    if (s >= 75) return styles.scoreHigh;
    if (s >= 45) return styles.scoreMid;
    return styles.scoreLow;
  }

  return (
    <div className={styles.panel}>

      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Smart Recommendations</h2>
          <p className={styles.panelSubtitle}>
            Tailored for Sri Lankan SMEs · {formValues.platform}
            {detectedTopics.length > 0 && (
              <span className={styles.topicBadge}>
                {detectedTopics.map(t => t.category).join(' & ')}
              </span>
            )}
          </p>
        </div>
        <div className={`${styles.overallBadge} ${scoreColor(scores.overall)}`}>
          {scores.overall}%
        </div>
      </div>

      {/* ── Optimization Score ── */}
      <div className={styles.scoreGrid}>
        {[
          { label: 'Caption', value: scores.caption },
          { label: 'Content', value: scores.content },
          { label: 'Timing', value: scores.timing },
        ].map(({ label, value }) => (
          <div key={label} className={styles.scoreCard}>
            <span className={styles.scoreLabel}>{label}</span>
            <div className={styles.scoreBarWrap}>
              <div
                className={`${styles.scoreBar} ${scoreColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={`${styles.scoreValue} ${scoreColor(value)}`}>{Math.round(value)}%</span>
          </div>
        ))}
      </div>

      {/* ── Predicted Lift ── */}
      {lift > 0 && (
        <div className={styles.liftBanner}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Apply all recommendations below to potentially increase your overall optimization score by
          <strong> +{lift} points</strong> and boost predicted engagement.
        </div>
      )}

      {/* ── Caption Improvements ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>✍️</span> Caption Improvements
          <span className={`${styles.sectionBadge} ${captionIssues.length === 0 ? styles.badgeGood : styles.badgeWarn}`}>
            {captionIssues.length === 0 ? 'Optimised' : `${captionIssues.length} issue${captionIssues.length > 1 ? 's' : ''}`}
          </span>
        </h3>
        {captionIssues.length === 0 ? (
          <p className={styles.successNote}>Your caption looks great for {formValues.platform}! 🎉</p>
        ) : (
          <ul className={styles.issueList}>
            {captionIssues.map((issue, i) => (
              <li key={i} className={styles.issueItem}>
                <span className={styles.issueDot} />
                {issue}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.tipsGrid}>
          {captionTips.map((tip, i) => (
            <div key={i} className={styles.tipCard}>
              <span className={styles.tipNum}>{i + 1}</span>
              <p className={styles.tipText}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content Improvements ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📝</span> Content Improvements
          <span className={`${styles.sectionBadge} ${contentIssues.length === 0 ? styles.badgeGood : styles.badgeWarn}`}>
            {contentIssues.length === 0 ? 'Optimised' : `${contentIssues.length} issue${contentIssues.length > 1 ? 's' : ''}`}
          </span>
        </h3>
        {contentIssues.length === 0 ? (
          <p className={styles.successNote}>Your content copy is well-structured! 🎉</p>
        ) : (
          <ul className={styles.issueList}>
            {contentIssues.map((issue, i) => (
              <li key={i} className={styles.issueItem}>
                <span className={styles.issueDot} />
                {issue}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.tipsGrid}>
          {contentTips.map((tip, i) => (
            <div key={i} className={styles.tipCard}>
              <span className={styles.tipNum}>{i + 1}</span>
              <p className={styles.tipText}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timing Optimizer ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🕐</span> Timing Optimizer
          <span className={`${styles.sectionBadge} ${inOptimalWindow ? styles.badgeGood : styles.badgeWarn}`}>
            {inOptimalWindow ? 'Optimal' : 'Suboptimal'}
          </span>
        </h3>
        <div className={styles.timeBox}>
          <div className={styles.timeRow}>
            <span className={styles.timeKey}>Your Time</span>
            <span className={styles.timeVal}>{formValues.post_time} (Sri Lanka, UTC+5:30)</span>
          </div>
          <div className={styles.timeRow}>
            <span className={styles.timeKey}>Best Windows</span>
            <span className={`${styles.timeVal} ${styles.timeHighlight}`}>{bestTime}</span>
          </div>
          {timingIssues.map((t, i) => (
            <p key={i} className={styles.timingNote}>{t}</p>
          ))}
          {inOptimalWindow && (
            <p className={styles.timingSuccess}>✓ You are posting in the optimal time window for {formValues.platform}.</p>
          )}
        </div>
      </div>

      {/* ── Contextual Hashtag Pack ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>#</span> Contextual Hashtag Pack
        </h3>
        <p className={styles.hashtagNote}>
          {detectedTopics.length > 0
            ? `Selected for your ${detectedTopics[0].category} content on ${formValues.platform}. Click to copy.`
            : `Sri Lankan SME hashtags for ${formValues.platform}. Click to copy.`}
        </p>
        <div className={styles.hashtagGrid}>
          {hashtags.map((tag, i) => (
            <span
              key={i}
              className={styles.hashtag}
              onClick={() => navigator.clipboard.writeText(tag)}
              title="Click to copy"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Ad Boost Recommendation ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🚀</span> Ad Boost Strategy
        </h3>
        <div className={styles.boostBox}>
          {formValues.ad_boost ? (
            <>
              <p className={styles.boostText}>
                <strong>Ad Boost is ON.</strong> Focus your budget on the Sri Lankan demographic (age 18–45
                {detectedTopics.length > 0 ? `, interests matching your ${detectedTopics[0].category} category` : ', interests: shopping, food, fashion, tech'}).
                Use lookalike audiences from your existing customers for maximum ROI.
              </p>
              <ul className={styles.issueList} style={{ marginTop: 8 }}>
                <li className={styles.issueItem}><span className={styles.issueDotGreen} /> Set daily budget at LKR 500–2,000 for initial testing on {formValues.platform}.</li>
                <li className={styles.issueItem}><span className={styles.issueDotGreen} /> Target Colombo, Kandy, and Galle for the highest-density SME audience.</li>
                <li className={styles.issueItem}><span className={styles.issueDotGreen} /> Run A/B tests with 2 caption variations over 48 hours before scaling spend.</li>
              </ul>
            </>
          ) : (
            <>
              <p className={styles.boostText}>
                <strong>Ad Boost is OFF.</strong> Enabling ad boost can increase reach by 3–5× for Sri Lankan SMEs with a modest budget.
              </p>
              <ul className={styles.issueList} style={{ marginTop: 8 }}>
                <li className={styles.issueItem}><span className={styles.issueDot} /> Consider a LKR 500/day boost to reach beyond your current {Number(formValues.followers).toLocaleString() || '—'} followers.</li>
                <li className={styles.issueItem}><span className={styles.issueDot} />
                  {formValues.platform === 'Facebook'  ? 'Facebook Ads offer the best cost-per-click for Sri Lankan SMEs across all industries.' :
                   formValues.platform === 'Instagram' ? 'Instagram Story ads have 2× higher CTR for product-based Sri Lankan businesses.' :
                   formValues.platform === 'TikTok'    ? 'TikTok Spark Ads boost your best organic video — lower CPM than Facebook for under-35 audiences.' :
                   `Boosting on ${formValues.platform} can expand your reach to cold Sri Lankan audiences effectively.`}
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Personalised Growth Toolkit ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🇱🇰</span> Personalised Growth Toolkit
        </h3>
        <div className={styles.toolkitGrid}>
          {generalTips.map((tip, i) => (
            <div key={i} className={styles.toolkitItem}>
              <span className={styles.toolkitNum}>{i + 1}</span>
              <p className={styles.toolkitText}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Wins Checklist ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>✅</span> Quick Wins Checklist
        </h3>
        <div className={styles.checklistGrid}>
          {[
            { done: captionLen >= 80 && captionLen <= 200, text: 'Caption length is 80–200 characters' },
            { done: hasCallToAction(formValues.caption),   text: 'Caption includes a call-to-action' },
            { done: hasQuestion(formValues.caption),       text: 'Caption contains a question' },
            { done: emojis >= 1 && emojis <= 5,            text: '1–5 emojis used in caption' },
            { done: contentLen >= 100,                     text: 'Content has 100+ characters' },
            { done: inOptimalWindow,                       text: `Posting in optimal ${formValues.platform} window` },
            { done: formValues.ad_boost,                   text: 'Ad boost enabled for extra reach' },
            { done: Number(formValues.followers) >= 1000,  text: 'Follower count ≥ 1,000' },
          ].map(({ done, text }, i) => (
            <div key={i} className={`${styles.checkItem} ${done ? styles.checkDone : styles.checkPending}`}>
              <span className={styles.checkIcon}>{done ? '✓' : '○'}</span>
              <span className={styles.checkText}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Insight footer ── */}
      <div className={styles.insightFooter}>
        <p className={styles.insightLabel}>Research Insight</p>
        <p className={styles.insightText}>
          Sri Lankan SMEs that combine bilingual captions (Sinhala + English), post during peak local hours,
          and add a question-based CTA see on average <strong>2.4× higher engagement</strong> than single-language,
          off-peak posts without interaction prompts. (Source: Local social media engagement analysis, 2024)
        </p>
      </div>

    </div>
  );
}
