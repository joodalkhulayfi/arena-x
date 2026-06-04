import { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Wand2, MapPin, Award, ShoppingBag, Users, Sparkles, 
  Play, RotateCcw, Share2, Plus, Volume2, VolumeX, CheckCircle, Flame, 
  Trophy, Cpu, Zap, Compass, Copy, ArrowRight, Shield, Star, Info,
  Camera, CameraOff, AlertCircle, Home, Globe
} from 'lucide-react';
import { PlayerAvatar, PlayerStats, GameBlueprint, LiveMission, ShopItem, LeaderboardUser } from './types';

// Web Audio API Sound Synthesizer for high fidelity retro-future SFX
const playSynthSound = (soundType: 'beep' | 'laser' | 'coin' | 'success' | 'powerup' | 'engine' | 'explosion') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    switch (soundType) {
      case 'beep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case 'laser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;
      }
      case 'coin': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.25);
        break;
      }
      case 'success': {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
        });
        break;
      }
      case 'explosion': {
        // Noise buffer simulation
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noise.stop(ctx.currentTime + 0.3);
        break;
      }
      case 'powerup': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        break;
      }
    }
  } catch (err) {
    console.warn("Audio Context not allowed yet:", err);
  }
};

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: 'suit_neon_obsidian', name: 'بدلة زجاج الأوبسيديان المتوهج', category: 'suit', price: 180, description: 'انعكاسات مغناطيسية وردية وحافة زرقاء عاكسة متناهية الدقة.', iconName: 'Shirt' },
  { id: 'suit_desert_nomad', name: 'وشاح بدو السيبرانية ٣.٠', category: 'suit', price: 90, description: 'عباءة صحراوية مطرزة بخلايا الطاقة الضوئية الذهبية لمقاومة رياح طويق.', iconName: 'Shirt' },
  { id: 'veh_falcon_cruiser', name: 'مركبة الصقر طويق السحابية', category: 'vehicle', price: 250, description: 'مركبة معلقة مغناطيسياً، ممتازة لتفادي الصخور البركانية في القدية للسباقات.', iconName: 'Rocket' },
  { id: 'veh_wave_flyer', name: 'فلاير المياه التوربيني الهجين', category: 'vehicle', price: 150, description: 'للانزلاق الفائق ومطاردة الكنوز في مدينة الألعاب المائية المتوهجة.', iconName: 'Rocket' },
  { id: 'effect_laser_glow', name: 'هالة النبض الكهرومغناطيسي الأرجواني', category: 'effect', price: 80, description: 'تأثير إشعاعي خلاب يحط بالبدلة أثناء الجري وجمع النقاط.', iconName: 'Sparkles' },
];

const PREBUILT_GAMES = [
  // 1. مدينة سباقات القدية
  {
    id: 'motorsport_the_blade',
    title: 'تحدي "ذا بليد" المعلق 70م 🏎️',
    prompt: 'تحدي سباق سيارات الفورمولا الكهرومغناطيسية السريعة عبر منعطف "ذا بليد" المرتفع 70 متراً فوق مسرح القدية الجماهيرى الاستثنائي.',
    district: 'مدينة السباقات',
    creator: 'كابتن_ت Tilke',
    rating: 4.9,
    playersCount: 4230,
    scoringSystem: '200 عملة لكل حلقة مغناطيسية تعبرها على ارتفاع منعطف "ذا بليد".',
    winCondition: 'اجتياز المنعطفات الـ 21 في أقل من 50 ثانية مع الحفاظ على سلامة المحرك الجانبي.',
    obstacles: ['تداخل مغناطيسي', 'رياح المنعطف الصاعدة', 'سيارات الصيانة الآلية'],
    mapTheme: 'سماء سيبرانية تفاعلية متوهجة تنعكس على جبال طويق الحمراء فوق مسار ليزري عالي الارتفاع.'
  },
  {
    id: 'motorsport_108m_track',
    title: 'سباق مضمار الاندفاع الارتفاعي 108م 📈',
    prompt: 'سباق سرعة كارتنج كهرومغناطيسي على مضمار يتميز بفروق ارتفاع عمودية تصل لـ 108 أمتار، محاكياً مسار سباق الفورمولا 1 الحقيقي بالقدية.',
    district: 'مدينة السباقات',
    creator: 'أسطورة_السرعة_Wurz',
    rating: 4.8,
    playersCount: 3890,
    scoringSystem: '150 نقطة لكل خلية تسريع توربينية ذكية تمر عليها المركبة على المضمار.',
    winCondition: 'إنهاء دورتين كاملتين بمعدل ثبات ركض لا يقل عن 80% دون تحطيم ممتص الصدمات الكهرومغناطيسي.',
    obstacles: ['سقوط شاهق بمقدار 108م', 'منحنيات جيوفيزيائية صخرية', 'موجات ارتدادية مغناطيسية'],
    mapTheme: 'مضمار سيبراني مشرق يشق الصخور الصحراوية الوعرة مع حواف حماية نيون فوسفورية دائرية.'
  },
  // 2. جرف طويق والمغامرات الجبلية
  {
    id: 'adventure_falcons_flight',
    title: 'أفعوانية "رحلة الصقر" الأسرع عالمياً 🦅',
    prompt: 'أسرع وأطول قطار ملاهي بالعالم بسرعة 250 كم/س عبر جرف جبل طويق الشاهق مع صدمات كهرومغناطيسية وتغيرات جاذبية في الهواء.',
    district: 'جرف المغامرات طويق',
    creator: 'مغامر_القمة_الشرقي',
    rating: 4.9,
    playersCount: 7320,
    scoringSystem: '50 نقطة لكل حلقة نيون طائرة ترصدها أثناء الهبوط العمودي الحاد الخاطف للأنفاس.',
    winCondition: 'الحفاظ على مستويات ثبات العتاد البصري وتحمل قوى تسارع تصل لـ 4G بكفاءة فائقة.',
    obstacles: ['جيوب الهواء الدوارة', 'صدمات الجاذبية العكسية', 'الرياح الجبلية المفاجئة'],
    mapTheme: 'جرف جبلي صخري مهيب يسقط عمودياً بارتفاع 200م تكسوه حبال النيون المتوهجة والمسارات الحلزونية المستحيلة.'
  },
  // 3. ساحة الرياضات الإلكترونية
  {
    id: 'esports_neon_coliseum',
    title: 'بطولة الميتافيرس للاستاد الأكبر 5300 مقعد 🎯',
    prompt: 'معركة تكتيكية جماهيرية داخل الاستاد المغلق الأضخم للشرق الأوسط المجهز بـ 5300 مقعد ومؤثرات شاشات ممتدة تملأ سقف القبة الهلالية بالقدية.',
    district: 'ساحة الرياضات الإلكترونية',
    creator: 'رياضي_السيبرانية_القدية',
    rating: 4.8,
    playersCount: 5120,
    scoringSystem: '100 نقطة لكل فوز في رهان جماهيري أو تحدي تصويب سيبراني.',
    winCondition: 'البقاء كآخر لاعب صامد في الحلبة متجاوزاً موجات التداخل المغناطيسي خلال 3 دقائق.',
    obstacles: ['منصات حماية هوائية', 'موجات كهرومغناطيسية متحركة', 'رياح جبلية شاهقة بارتفاع 200م'],
    mapTheme: 'ملعب النخبة الفائق بتصميم تكنولوجي فريد، محفوف بمقاعد تفاعلية هولوجرامية وشاشات LED بانورامية عملاقة مع سحب الغيوم الطافية.'
  },
  {
    id: 'future_drone_airshow',
    title: 'عرض طائرات الميتافيرس الكوني ٢٠٣٤ ✈️',
    prompt: 'قيادة مركبة طائرة نفاثة معلقة فوق ستاد الأمير محمد بن سلمان الشهير للاحتفال المونديالي بعروض طيران هولوجرامية استثنائية.',
    district: 'المنطقة المستقبلية 2034',
    creator: 'طيار_الميتافيرس_القدية',
    rating: 4.8,
    playersCount: 4210,
    scoringSystem: '200 نقطة لكل حلقة نيون دائرية دقيقة تخترقها طائرتك السيبرانية النفاثة.',
    winCondition: 'اجتياز المسار الجوي الكامل والوصول لـ 12 حلقة متصلة بنجاح دون لمس هياكل الاستاد الزجاجية.',
    obstacles: ['انقباض حلقات الطاقة المفاجئ', 'شهب عروض الألعاب النارية لـ 2034', 'درونات المراقبة الأمنية الطائرة'],
    mapTheme: 'منظر جوي بانورامي خلاب 360 درجة ينظر لأسفل على استاد القدية المعلق الفاخر ومضيئ بحبال الليزر الفيروزية.'
  }
];

const translations: Record<string, Record<string, string>> = {
  ar: {
    title: "أرينا إكس | ARENA X",
    subtitle: "بوابة القدية الذكية للمستقبل. صمم مستويات مخصصة بالذكاء الاصطناعي والعب تحديات الواقع المعزز في كوكب الترفيه الحي.",
    tagline: "مبتكر الذكاء الاصطناعي وبوابة الواقع المعزز",
    liveStatus: "نشط 🟢",
    rank: "الرتبة",
    coins: "العملات",
    fame: "الشهرة",
    customiseChar: "تهيئة الشخصية السيبرانية 🦾",
    customiseCharDesc: "صمم رمزك الفريد للتفاعل مع الدوائر وعاير ترددات النيون الخاصة بك وفق قوة الجاذبية في جرف طويق العظيم.",
    charName: "المعرف السيبراني:",
    charColor: "ضبط تردد طاقة البدلة:",
    charSuit: "دروع الحماية التكتيكية المعيارية:",
    charAcc: "خوذة الواقع المعزز الهولوغرافية المدارية:",
    enterArena: "الملف جاهز، دخول خارطة القدية!",
    qiddiyaReady: "القدية جاهزة لفتح كاميرا هاتفك وتشغيل تحديات الواقع المعزز في بيئة حقيقية.",
    openCamera: "فتح الكاميرا للمعايرة الحية للواقع المعزز",
    cameraOn: "تم رصد وتحميل الكاميرا الفيزيائية بنجاح",
    cameraErrorMsg: "⚠️ تعذر الوصول لكاميرا الهاتف الحقيقية (بسبب أذونات المتصفح أو سياسات النظام). لضمان استمرار المتعة، قمنا بتنفيذ المحاكي الافتراضي الذكي للواقع المعزز لجمع النقاط والعملات في القدية.",
    completed: "اكتمل تحدي الواقع المعزز بنجاح!",
    earnedRewards: "لقد رصدت واقتنصت بنجاح نقاط طاقة ومكافآت القدية المباشرة!",
    arCheckpointsCol: "نقاط الـ AR التي تم جمعها:",
    cancelLens: "إلغاء العدسة والعودة للمحاكاة",
    home: "الرئيسية 🏠"
  },
  en: {
    title: "ARENA X | ARENA X",
    subtitle: "The smart Qiddiya portal of the future. Design custom levels with AI and play augmented reality (AR) challenges in the live entertainment capital.",
    tagline: "AI Creator & Augmented Reality Portal",
    liveStatus: "Active 🟢",
    rank: "Rank",
    coins: "Coins",
    fame: "Fame",
    customiseChar: "Configure Cybernetic Character 🦾",
    customiseCharDesc: "Design your unique exoplastic avatar to interact with circuits and calibrate your neon threads according to the gravity of Tuwaiq cliffs.",
    charName: "Cybernetic Identifier:",
    charColor: "Tune suit energy frequency:",
    charSuit: "Modular tactical armored plating:",
    charAcc: "Orbital holographic AR visor:",
    enterArena: "Profile Ready, Enter Qiddiya Map!",
    qiddiyaReady: "Qiddiya is ready to launch your phone camera and render AR challenges in mixed reality.",
    openCamera: "Open live camera for AR calibration",
    cameraOn: "Physical hardware camera successfully detected",
    cameraErrorMsg: "⚠️ Could not access your physical hardware camera (usually due to browser permissions or system policies). For your uninterrupted fun, we have automatically activated the highly precise Qiddiya AR virtual simulator to collect points and coins.",
    completed: "AR Challenge Completed Successfully!",
    earnedRewards: "You have successfully synchronized and conquered Qiddiya live checkpoints!",
    arCheckpointsCol: "AR checkpoints collected:",
    cancelLens: "Cancel lens and return to simulation",
    home: "Home 🏠"
  },
  zh: {
    title: "ARENA X | 竞技场 X",
    subtitle: "未来的智能基迪亚传送门。使用AI设计自定义关卡，并在现场娱乐星球中畅玩增强现实 (AR) 挑战项目。",
    tagline: "AI 创作者与增强现实传送门",
    liveStatus: "在线 🟢",
    rank: "军衔",
    coins: "霓虹币",
    fame: "名望值",
    customiseChar: "配置您的赛博角色 🦾",
    customiseCharDesc: "设计您独特的变性人替身以与赛道互动，并根据图怀克悬崖的重力校准您的霓虹能量线。",
    charName: "网络身份标识:",
    charColor: "调整战衣能量频率:",
    charSuit: "模块化战术装甲外壳:",
    charAcc: "轨道全息 AR 虚拟面罩:",
    enterArena: "个人资料就绪，进入基迪亚星图！",
    qiddiyaReady: "基迪亚已准备好开启您的手机相机，并在混合现实中渲染AR挑战。",
    openCamera: "开启实时相机进行 AR 校准",
    cameraOn: "成功检测到物理相机硬件",
    cameraErrorMsg: "⚠️ 无法访问您的物理相机硬件 (通常由于浏览器权限或系统策略所致)。为了让您不间断地玩乐，我们已自动激活高精度基迪亚 AR 虚拟模拟器来收集积分和代币。",
    completed: "AR 挑战成功完成！",
    earnedRewards: "您已成功定位并征服基迪亚实景航点！",
    arCheckpointsCol: "AR 能量收集进度:",
    cancelLens: "关闭相机并切换回全景模拟",
    home: "主页 🏠"
  },
  es: {
    title: "ARENA X - Qiddiya",
    subtitle: "Portal inteligente Qiddiya del futuro. Diseña niveles personalizados con IA y juega desafíos AR en el planeta live-entertainment.",
    tagline: "Creador IA y Portal de Realidad Aumentada",
    liveStatus: "Activo 🟢",
    rank: "Rango",
    coins: "Monedas",
    fame: "Fama",
    customiseChar: "Configurar Personaje Cibernético 🦾",
    customiseCharDesc: "Diseña tu avatar exoplástico único para interactuar con los circuitos y calibra tus de neón según la gravedad de los acantilados de Tuwaiq.",
    charName: "Identificador cibernético:",
    charColor: "Afinar frecuencia de energía del traje:",
    charSuit: "Enchapado blindado táctico modular:",
    charAcc: "Visor AR holográfico orbital:",
    enterArena: "¡Perfil listo, Entrar al mapa de Qiddiya!",
    qiddiyaReady: "Qiddiya está lista para abrir tu cámara de móvil y renderizar desafíos AR con realidad mixta.",
    openCamera: "Abrir la cámara en vivo para la calibración AR",
    cameraOn: "Cámara real física detectada con éxito",
    cameraErrorMsg: "⚠️ No se pudo acceder a tu cámara de hardware (comúnmente por permisos del navegador o políticas de sistema). Para que sigas divirtiéndose, activamos automáticamente el simulador virtual AR Qiddiya de alta precisión para recolectar puntos y monedas.",
    completed: "¡Desafío AR completado con éxito!",
    earnedRewards: "¡Has sincronizado con éxito los puntos de control en Qiddiya!",
    arCheckpointsCol: "Puntos AR recolectados:",
    cancelLens: "Cancelar lente y volver",
    home: "Inicio 🏠"
  }
};

const getTranslatedShopItem = (item: any, lang: string) => {
  const translationsMap: Record<string, { name: Record<string, string>, description: Record<string, string> }> = {
    'suit_neon_obsidian': {
      name: {
        ar: 'بدلة زجاج الأوبسيديان المتوهج',
        en: 'Neon Obsidian Glowing Suit',
        zh: '发光黑曜岩高分子超能防电战衣',
        es: 'Traje Radiante de Vidrio de Obsidiana'
      },
      description: {
        ar: 'انعكاسات مغناطيسية وردية وحافة زرقاء عاكسة متناهية الدقة.',
        en: 'Pink electromagnetic reflections with ultra-precise responsive cyan tracer borders.',
        zh: '粉色磁约束等离子反光，点缀高保真冷光流仙航道边线。',
        es: 'Reflejos electromagnéticos rosados con bordes de neón cian.'
      }
    },
    'suit_desert_nomad': {
      name: {
        ar: 'وشاح بدو السيبرانية ٣.٠',
        en: 'Desert Cyber Nomad Cape 3.0',
        zh: '图怀克数字荒野游侠大红披风 3.0',
        es: 'Capa de Nómada del Desierto 3.0'
      },
      description: {
        ar: 'عباءة صحراوية مطرزة بخلايا الطاقة الضوئية الذهبية لمقاومة رياح طويق.',
        en: 'Golden solar energy cells woven directly into lightweight fabric to resist extreme wind drafts.',
        zh: '采用轻巧高回弹尼龙经纬交织金色硅光伏微动力，轻松滑行抗衡十二级沙暴。',
        es: 'Capa desértica armada con nano-celdas solares doradas para resistir tormentas.'
      }
    },
    'veh_falcon_cruiser': {
      name: {
        ar: 'مركبة الصقر طويق السحابية',
        en: 'Tuwaiq Falcon Aerial Cruiser',
        zh: '图怀克悬空机械猎鹰高能飞车',
        es: 'Crucero Volador Halcón Tuwaiq'
      },
      description: {
        ar: 'مركبة معلقة مغناطيسياً، ممتازة لتفادي الصخور البركانية في القدية للسباقات.',
        en: 'Active magnetic suspension flight, unmatched maneuverability to dodge rocky obstacles.',
        zh: '内置反重力辅助线圈，能实现百分之一秒转向，闪避迎风砸来的熔岩陨石。',
        es: 'Vuelo de suspensión electromagnética, perfecto para esquivar impactos rocosos.'
      }
    },
    'veh_wave_flyer': {
      name: {
        ar: 'فلاير المياه التوربيني الهجين',
        en: 'Wave Flyer Turbo Hybrid',
        zh: '水动力极速双体螺旋悬浮飞翼',
        es: 'Aerodeslizador Acuático Turbo Híbrido'
      },
      description: {
        ar: 'للانزلاق الفائق ومطاردة الكنوز في مدينة الألعاب المائية المتوهجة.',
        en: 'Optimized hydro-boost propulsion to track and fish out deep AR jewels.',
        zh: '配备超音速高压水底推进舱，便于在水波表层捕获水滴AR金币。',
        es: 'Propulsión acuática de alta velocidad para recolectar gemas sumergidas.'
      }
    },
    'effect_laser_glow': {
      name: {
        ar: 'هالة النبض الكهرومغناطيسي الأرجواني',
        en: 'Purple Quantum Pulse Aura',
        zh: '量子雷云电涌紫色尊奢光环特效',
        es: 'Aura Cuántica de Pulso Electro'
      },
      description: {
        ar: 'تأثير إشعاعي خلاب يحط بالبدلة أثناء الجري وجمع النقاط.',
        en: 'Splendid pulsing halo around your character during runs and point collection.',
        zh: '当机甲在场上滑跑或碰集水晶时，贴身伴随产生梦幻冷光紫电涟漪环绕。',
        es: 'Precioso halo pulsante que rodea tu armadura al correr y recolectar tesoros.'
      }
    }
  };

  const trans = translationsMap[item.id];
  if (!trans) return item;
  return {
    ...item,
    name: trans.name[lang] || item.name,
    description: trans.description[lang] || item.description
  };
};

const getTranslatedPrebuiltGame = (game: any, lang: string) => {
  const translationsMap: Record<string, {
    title: Record<string, string>,
    prompt: Record<string, string>,
    scoringSystem: Record<string, string>,
    winCondition: Record<string, string>,
    obstacles: Record<string, string[]>,
    mapTheme: Record<string, string>
  }> = {
    'motorsport_the_blade': {
      title: {
        ar: 'تحدي "ذا بليد" المعلق 70م 🏎️',
        en: '"The Blade" Suspension Challenge 70m 🏎️',
        zh: '“巨刃”悬空70米极速挑战赛 🏎️',
        es: 'Desafío Suspendido "The Blade" 70m 🏎️'
      },
      prompt: {
        ar: 'تحدي سباق سيارات الفورمولا الكهرومغناطيسية السريعة عبر منعطف "ذا بليد" المرتفع 70 متراً فوق مسرح القدية الجماهيرى الاستثنائي.',
        en: 'Electromagnetic Formula racecar speed run on the unique elevated "The Blade" track hanging 70 meters Qiddiya’s spectacular performance stage.',
        zh: '极速电磁方程式赛车竞速挑战，跨越悬跨于基迪亚绚丽大舞台上方70米处的“巨刃”高空轨道。',
        es: 'Carrera de Fórmula electromagnética en la pista elevada "The Blade", suspendida a 70 metros del gran escenario de Qiddiya.'
      },
      scoringSystem: {
        ar: '200 عملة لكل حلقة مغناطيسية تعبرها على ارتفاع منعطف "ذا بليد".',
        en: '200 coins for every magnetic ring crossed high on "The Blade" curve.',
        zh: '在“巨刃”高空弯道上每穿过一个电磁波环即可赚取200个代币。',
        es: '200 monedas por cada anillo electromagnético cruzado en la altura de "The Blade".'
      },
      winCondition: {
        ar: 'اجتياز المنعطفات الـ 21 في أقل من 50 ثانية مع الحفاظ على سلامة المحرك الجانبي.',
        en: 'Clear all 21 curves in under 50 seconds while preserving thruster turbine status.',
        zh: '在50秒以内跑完所有21道急弯，同时不损坏侧备推进发动机。',
        es: 'Superar las 21 curvas complejos en menos de 50 segundos protegiendo los alternadores.'
      },
      obstacles: {
        ar: ['تداخل مغناطيسي', 'رياح المنعطف الصاعدة', 'سيارات الصيانة الآلية'],
        en: ['Magnetic Interference', 'Elevated Updraft Winds', 'Robotic Service Cruisers'],
        zh: ['磁场偏转干扰', '弯道低空上升气流', '自动巡防工程机甲'],
        es: ['Interferencia Magnética', 'Viento Ascendente Cruzado', 'Drones Robot de Mantenimiento']
      },
      mapTheme: {
        ar: 'سماء سيبرانية تفاعلية متوهجة تنعكس على جبال طويق الحمراء فوق مسار ليزري عالي الارتفاع.',
        en: 'Interactive glowing cyber sky reflecting over red Tuwaiq mountains above a high-altitude laser pathway.',
        zh: '动感霓虹夜空，高空激光轨道流光溢彩，倒映在壮丽的赤红图怀克绝壁群。',
        es: 'Cielo cibernético interactivo y brillante reflejado sobre las montañas rojas de Tuwaiq en pista láser.'
      }
    },
    'motorsport_108m_track': {
      title: {
        ar: 'سباق مضمار الاندفاع الارتفاعي 108م 📈',
        en: 'Vertical Rush Track 108m 📈',
        zh: '纵向爬升108米急速赛道 📈',
        es: 'Pista de Impulso Vertical 108m 📈'
      },
      prompt: {
        ar: 'سباق سرعة كارتنج كهرومغناطيسي على مضمار يتميز بفروق ارتفاع عمودية تصل لـ 108 أمتار، محاكياً مسار سباق الفورمولا 1 الحقيقي بالقدية.',
        en: 'Electromagnetic kart speedway racing simulating Qiddiya’s actual F1 track, featuring dramatic 108-meter vertical elevation drops.',
        zh: '沉浸式模拟基迪亚真实F1赛车轨道，在垂直爬升/下坠达108米的高能环形轨道上风驰电掣。',
        es: 'Carrera de karting electromagnética que imita la pista real de F1 en Qiddiya, con caídas verticales de 108 metros.'
      },
      scoringSystem: {
        ar: '150 نقطة لكل خلية تسريع توربينية ذكية تمر عليها المركبة على المضمار.',
        en: '150 points for every smart turbo boost pad crossed on the track.',
        zh: '车身碾过跑道上任意一个涡轮增能格点即可连击斩获150分积分。',
        es: '150 puntos por cada celda de propulsión rápida que cruce tu bólido.'
      },
      winCondition: {
        ar: 'إنهاء دورتين كاملتين بمعدل ثبات ركض لا يقل عن 80% دون تحطيم ممتص الصدمات الكهرومغناطيسي.',
        en: 'Complete 2 full laps with at least 80% run stability without breaking the magnetic bumper.',
        zh: '跑完两整圈，保持平均行车稳定性不低于80%，且保全合金缓冲前翼。',
        es: 'Completar 2 vueltas completas manteniendo 80% de estabilidad y parachoques intacto.'
      },
      obstacles: {
        ar: ['سقوط شاهق بمقدار 108م', 'منحنيات جيوفيزيائية صخرية', 'موجات ارتدادية مغناطيسية'],
        en: ['Extreme 108m Drop-offs', 'Geophysical Cliff Corners', 'Magnetic Shock Backwaves'],
        zh: ['108米高空大垂直俯冲', '地质急弯断崖', '强磁力滞重回涌电波'],
        es: ['Caídas libres de 108m', 'Curvas de geofísica rocosa', 'Ondas de rebote magnético']
      },
      mapTheme: {
        ar: 'مضمار سيبراني مشرق يشق الصخور الصحراوية الوعرة مع حواف حماية نيون فوسفورية دائرية.',
        en: 'Broad vibrant cyber-track splitting desert canyons bordered by phosphor neon guardrails.',
        zh: '宽阔炫目赛道纵贯沙岩大峡谷，两侧饰以环状磷光绿色护盾。',
        es: 'Pista de neón que esculpe el cañón desértico con barreras de seguridad color fósforo.'
      }
    },
    'adventure_falcons_flight': {
      title: {
        ar: 'أفعوانية "رحلة الصقر" الأسرع عالمياً 🦅',
        en: "Falcon's Flight: World's Fastest Coaster 🦅",
        zh: '“猎鹰游隼自由俯冲”环球最速过山车 🦅',
        es: 'Montaña Rusa "Falcon\'s Flight" Más Rápida del Mundo 🦅'
      },
      prompt: {
        ar: 'أسرع وأطول قطار ملاهي بالعالم بسرعة 250 كم/س وسقوط عمودي 198 متراً بمحاذاة جرف جبل طويق العظيم بالقدية.',
        en: "The world's fastest and tallest roller coaster, reaching 250 km/h with an incredible 198-meter vertical dive down the cliffs of Tuwaiq.",
        zh: '举世瞩目的超高超速重力过山车，时速飙升至250公里/小时，伴随198米近乎垂直的大跌落滑跑。',
        es: 'La montaña rusa más rápida y alta del mundo a 250 km/h con caída vertical de 198 metros bordeando el acantilado.'
      },
      scoringSystem: {
        ar: '300 نقطة لكل ريشة طاقة صقر ذهبية هولوغرامية تعترض مسار القطار أثناء السقوط الحر.',
        en: '300 points for every holographic golden falcon feather caught during freefall.',
        zh: '惊险坠地瞬间，每收集到一枚悬在气流里的金色全息猎鹰羽毛即可加300金。',
        es: '300 puntos por cada pluma de halcón dorada que recojas en caída libre.'
      },
      winCondition: {
        ar: 'البقاء ممسكاً بمقود الاتزان التوربيني بزاوية سقوط 90 درجة بالفعالية الكاملة.',
        en: 'Maintain structural equilibrium controls during the full 90-degree gravity plunge.',
        zh: '在呈90度的极限超正角垂直坠落阶段，稳控陀螺仪，达成100%全向飞行。',
        es: 'Mantener la orientación y el equilibrio durante el descenso gravitacional de 90 grados.'
      },
      obstacles: {
        ar: ['سرعة 250 كم/س الخارقة', 'سقوط عمودي 198م', 'طيور هولوغرامية جانحة'],
        en: ['Extreme 250 km/h Velocity', '198m Vertical Abyss', 'Stray Holographic Birds'],
        zh: ['250码高负荷地推阻力', '198米瞬发垂直深渊', '全息流萤离群候鸟'],
        es: ['Súper velocidad a 250 km/h', 'Caída vertical de 198m', 'Pájaros de neón extraviados']
      },
      mapTheme: {
        ar: 'خيوط شمس الغروب الذهبية على واجهة جبل طويق المهيب، مع مسار معدني يلتوي عبر الهاوية.',
        en: 'Golden sunset rays tracing the sheer face of majestic Tuwaiq mountains with metal loops.',
        zh: '夕阳倾泻而下，染红巍然屹立的图怀克峭壁，钢铁大回环轨道贴于绝壁之上。',
        es: 'Reflejos dorados del ocaso sobre el imponente acantilado de Tuwaiq con rieles de acero.'
      }
    },
    'adventure_tuwaiq_climbing': {
      title: {
        ar: 'تحدي مغامرة جرف الصقور والانزلاق 🧗',
        en: 'Tuwaiq Peaks Climb & Zipline Adventure 🧗',
        zh: '图怀克峭壁攀岩与高空滑索 🧗',
        es: 'Reto de Escalada y Tirolesa en Tuwaiq 🧗'
      },
      prompt: {
        ar: 'لعبة مغامرات جبلية وتسلق حقيقي لجبال طويق، والتحليق بالـ Zipline لجمع قطعة طاقة الصخور المشعة بالقدية.',
        en: 'Climb the majestic cliffs of Tuwaiq, then launch on an AR Zipline flight to harvest radioactive mountain crystals.',
        zh: '虚拟真实世界结合的峭壁徒手攀岩游戏，结合滑索在大跨度陡壑间梭行收集荧光能晶底质。',
        es: 'Aventura de montaña y escalada extrema en Tuwaiq con tirolesa para recolectar cristales de energía.'
      },
      scoringSystem: {
        ar: '120 نقطة لكل بلورة مشعة تقتنصها من الفتحات الصخرية أثناء انزلاقك بالـ Zipline.',
        en: '120 points for every radiant crystal plucked from rocky fissures during your zipline slide.',
        zh: '在体验超速索道时，从周边裸露怪石缝里探身抓取紫色结晶能晶奖120点。',
        es: '120 puntos de premio por cada gema radiactiva extraída de la pared del cañón.'
      },
      winCondition: {
        ar: 'تأمين 8 بلورات جبلية والوصول بأمان لنقطة الهبوط المغناطيسية على الحافة السفلى.',
        en: 'Secure 8 highland crystals and safe touchdown at the base magnetic terminal.',
        zh: '集齐8颗高纯结晶，并平稳在断崖下部安全磁吸降落港挂靠减速。',
        es: 'Recolectar 8 gemas mágicas y llegar enteros a la plataforma de aterrizaje.'
      },
      obstacles: {
        ar: ['رياح جبلية جانيبية شديدة', 'صخور متساقطة متخلخلة', 'مسارات تزحلق صخرية خشنة'],
        en: ['Fierce Mountain Side Winds', 'Loose Falling Gravel', 'Coarse Mountain Slide Paths'],
        zh: ['突发十级剧烈横向风', '极度松散易坠碎石崖', '高粗糙度滑坡障碍道'],
        es: ['Fuertes vientos de ladera', 'Grava y rocas inestables', 'Pendientes áridas resbaladizas']
      },
      mapTheme: {
        ar: 'صخور رملية طبيعية حمراء ممتزجة بخطوط ليزر بنفسجية تضيء شعاب الوديان العميقة.',
        en: 'Natural red sandstone structures layered with purple laser grids cutting deep canyons.',
        zh: '浑然天成的奇特红沙岩地质，点缀纵横交错的霓虹紫色激光防线。',
        es: 'Formaciones naturales de arena roja con líneas láser violeta cruzando los abismos.'
      }
    },
        'esports_neon_coliseum': {
      title: {
        ar: 'بطولة الميتافيرس للاستاد الأكبر 5300 مقعد 🎯',
        en: '5,300-Seat Esports Dome Metaverse Tournament 🎯',
        zh: '5300座超级全息电竞馆对抗赛 🎯',
        es: 'Torneo de Metaverso en el Estadio de Esports de 5,300 Asientos 🎯'
      },
      prompt: {
        ar: 'معركة تكتيكية جماهيرية داخل الاستاد المغلق الأضخم للشرق الأوسط المجهز بـ 5300 مقعد ومؤثرات شاشات ممتدة تملأ سقف القبة الهلالية بالقدية.',
        en: 'Tactical team battle inside the Middle East’s largest enclosed stadium equipped with 5,300 seats and expansive screens filling Qiddiya’s dome roof.',
        zh: '在配备5,300个坐席的中东最大室内场馆展开一轮惊心动魄的超级立体对抗，巨幅屏幕点亮整个半月穹顶。',
        es: 'Batalla táctica en equipo en el estadio cubierto más grande de Medio Oriente equipado con 5,300 asientos y pantallas panorámicas.'
      },
      scoringSystem: {
        ar: '100 نقطة لكل فوز في رهان جماهيري أو تحدي تصويب سيبراني.',
        en: '100 points for every arena win or cyber shooting challenge success.',
        zh: '每夺取一次竞技场战斗胜利或完成虚拟射击挑战加100分。',
        es: '100 puntos por cada victoria en la arena o desafío de tiro cibernético.'
      },
      winCondition: {
        ar: 'البقاء كآخر لاعب صامد في الحلبة متجاوزاً موجات التداخل المغناطيسي خلال 3 دقائق.',
        en: 'Survive as the last standing player dodging magnetic interference waves for 3 minutes.',
        zh: '在磁偏转电涌侵袭中坚持存活3分钟，成为竞技场上最后的赢家。',
        es: 'Sobrevivir como el último jugador eludiendo las interferencias magnéticas durante 3 minutes.'
      },
      obstacles: {
        ar: ['منصات حماية هوائية', 'موجات كهرومغناطيسية متحركة', 'رياح جبلية شاهقة بارتفاع 200م'],
        en: ['Modular shield barriers', 'Pulsing electromagnetic waves', '200m high altitude wind gusts'],
        zh: ['动态模块化阻能网', '电磁振荡电涌纹波', '200米海拔极限大风载荷'],
        es: ['Barreras de escudo modulares', 'Ondas electromagnéticas pulsantes', 'Ráfagas de viento a 200m de altura']
      },
      mapTheme: {
        ar: 'ملعب النخبة الفائق بتصميم تكنولوجي فريد، محفوف بمقاعد تفاعلية هولوجرامية وشاشات LED بانورامية عملاقة مع سحب الغيوم الطافية.',
        en: 'Elite futuristic stadium layout with virtual interactive holographic seats and monster LED screens surrounded by floating low-altitude clouds.',
        zh: '梦幻阶梯观众席环绕无缝超巨三维投影，下有云朵轻拂草坪边缘。',
        es: 'Estadio de súper tecnología con butacas holográficas y pantallas LED gigantes suspendidas entre nubes reales.'
      }
    },
    'future_drone_airshow': {
      title: {
        ar: 'عرض طائرات الميتافيرس الكوني ٢٠٣٤ ✈️',
        en: '2034 Cosmic Drone Lightshow Pilot ✈️',
        zh: '2034爆款科技无人机星空大汇演 ✈️',
        es: 'Espectáculo Aéreo de Drones Metaverso 2034 ✈️'
      },
      prompt: {
        ar: 'قيادة مركبة طائرة نفاثة معلقة فوق ستاد الأمير محمد بن سلمان الشهير للاحتفال المونديالي بعروض طيران هولوجرامية استثنائية.',
        en: 'Pilot a high-speed jet above the signature Prince Mohammed bin Salman Stadium to synchronize spectacular celebratory holographic drone arrays.',
        zh: '成为特技飞行员，驾驶超能战机在大球场上空穿行，编织震撼的世纪灯光大秀。',
        es: 'Pilota una nave de propulsión a chorro sobre el gran estadio para desatar espectaculares coreografías de drones.'
      },
      scoringSystem: {
        ar: '200 نقطة لكل حلقة نيون دائرية دقيقة تخترقها طائرتك السيبرانية النفاثة.',
        en: '200 points for every precise neon quantum ring successfully threaded by your aircraft.',
        zh: '喷气飞翼精准咬合穿过任意一道霓虹炫光加速环，可稳得200分。',
        es: '200 puntos por cada aro de luz calibrada que cruces con tu nave.'
      },
      winCondition: {
        ar: 'اجتياز المسار الجوي الكامل والوصول لـ 12 حلقة متصلة بنجاح دون لمس هياكل الاستاد الزجاجية.',
        en: 'Clear the full aerial corridor through 12 consecutive checkpoints without brushing the stadium structures.',
        zh: '安全绕行整座大楼，不蹭伤钛合金外壳的情况下连续冲跃12道霓虹环。',
        es: 'Completar la ruta pasando por 12 aros de energía sin colisionar con el estadio.'
      },
      obstacles: {
        ar: ['انقباض حلقات الطاقة المفاجئ', 'شهب عروض الألعاب النارية لـ 2034', 'درونات المراقبة الأمنية الطائرة'],
        en: ['Sudden Neon Bar Shrinkages', '2034 Festive Firework Blazes', 'Static Defense Security Patrols'],
        zh: ['不规则收缩的高感能量门', '大庆典流星礼花爆炸流', '网路协防安全伴飞飞艇'],
        es: ['Contracción repentina del aro', 'Chispas de pirotecnia festiva', 'Drones patrulla de seguridad']
      },
      mapTheme: {
        ar: 'منظر جوي بانورامي خلاب 360 درجة ينظر لأسفل على استاد القدية المعلق الفاخر ومضيئ بحبال الليزر الفيروزية.',
        en: '360 panoramic birds-eye perspective looking down on the illuminated hanging Qiddiya stadium with bright turquoise laser lines.',
        zh: '俯视高科技悬空大球场的俯视视角，四周缀满美如极光的青金石激光彩带。',
        es: 'Vista de ojo de águila panorámica de 360 grados sobre el lujoso coliseo suspendido en Qiddiya.'
      }
    }
  };

  const trans = translationsMap[game.id];
  if (!trans) return game;
  return {
    ...game,
    title: trans.title[lang] || game.title,
    prompt: trans.prompt[lang] || game.prompt,
    scoringSystem: trans.scoringSystem[lang] || game.scoringSystem,
    winCondition: trans.winCondition[lang] || game.winCondition,
    obstacles: trans.obstacles[lang] || game.obstacles,
    mapTheme: trans.mapTheme[lang] || game.mapTheme
  };
};

const getTranslatedLiveMission = (mission: any, lang: string) => {
  if (!mission) return null;
  const translationMap: Record<string, {
    name: Record<string, string>,
    description: Record<string, string>,
    prompt?: Record<string, string>
  }> = {
    "عاصفة النقاء: سباق الاندماج المغناطيسي": {
      name: {
        ar: "عاصفة النقاء: سباق الاندماج المغناطيسي",
        en: "Purity Storm: Magnetic Core Integration",
        zh: "纯洁风暴：磁通量堆融合极速赛",
        es: "Tormenta de Pureza: Fusión Magnética"
      },
      description: {
        ar: "تم استشعار موقعك بنجاح في حلبة القدية لسباقات الفورمولا! تفعيل وضع المحاكاة البصرية الكاميرا المفتوحة الآن.",
        en: "Your location was successfully matched with the Speed City F1 Track! Initializing real camera tracking simulation now.",
        zh: "您的物理陀螺仪坐标已完美锁定基迪亚F1急速赛场！开启运动透视追踪模式。",
        es: "¡Tu ubicación coincide con la pista de Fórmula F1 en Speed City! Iniciando cámara con mapeo de espacio real."
      }
    },
    "إعصار طويق المائي: كنز الغوص العميق": {
      name: {
        ar: "إعصار طويق المائي: كنز الغوص العميق",
        en: "Tuwaiq Aqua Monsoon: Abyssal Coral Hunt",
        zh: "图怀克科技水流：深潜拾珍珠挑战",
        es: "Monzón Acuático Tuwaiq: Caza del Arrecife"
      },
      description: {
        ar: "تم مطابقة إحداثياتك الحالية في قلب مدينة ألعاب القدية المائية الكبرى. المياه مشفرة هولوغرافياً!",
        en: "Your GPS coordinates match the heart of Qiddiya Aquatics Park. Deep sea layers have been calibrated!",
        zh: "物理坐标匹配在基迪亚深水特技落水区中心。全景环境参数加载成功！",
        es: "Tus coordenadas GPS coinciden con el parque acuático de Qiddiya. ¡Espacio de agua hibridado!"
      }
    },
    "سقوط الصقر الحر: تحدي رياح طويق الصاعدة": {
      name: {
        ar: "سقوط الصقر الحر: تحدي رياح طويق الصاعدة",
        en: "Falcon Freefall: Ascent Winds of Tuwaiq",
        zh: "猎鹰俯冲滑翔：图怀克上升热气流考验",
        es: "Vuelo Halcón: Vientos Ascendentes de Tuwaiq"
      },
      description: {
        ar: "أنت تقف الآن أمام قمم جبل طويق الشامخة بالقدية. تفعيل مستشعر الارتفاع والرياح ذهنياً لرحلة AR خارقة.",
        en: "You are standing on top of the majestic cliffs of Tuwaiq. Activating elevation altitude sensors for an incredible AR flight.",
        zh: "玩家已登上图怀克群峰巍峨的虚实结合区。激活高度感检测，开启自由飞翔AR界面。",
        es: "Te encuentras sobre la majestuosa cima de los acantilados de Tuwaiq. Activando lecturas de sensor de altitud."
      }
    }
  };

  const key = Object.keys(translationMap).find(k => k === mission.name || mission.name?.includes(k));
  if (key) {
    const entry = translationMap[key];
    return {
      ...mission,
      name: entry.name[lang] || mission.name,
      description: entry.description[lang] || mission.description,
      arCheckpoints: mission.arCheckpoints.map((cp: any, idx: number) => {
        const cpNames: Record<string, any> = {
          "عاصفة النقاء: سباق الاندماج المغناطيسي": [
            ["خلية الطاقة الاندماجية #1", "Fusion Battery Core #1", "聚变氢能电芯 #1", "Fusible de Fusión #1"],
            ["المسرّع التوربيني الهولوغرافي #2", "Holographic Turbo Charger #2", "全息涡轮增压罐 #2", "Turbocargador Holográfico #2"],
            ["حلقة تفادي العائق الضوئي #3", "Neon Light Obstacle Node #3", "霓虹避让避障球 #3", "Nodo de Evasión de Neón #3"]
          ],
          "إعصار طويق المائي: كنز الغوص العميق": [
            ["الصدفة المشفرة الفضية #1", "Silver Cryptic Shell #1", "白银加密贝壳 #1", "Caracola Encriptada de Plata #1"],
            ["نواة التسارع التوربيني المائي #2", "Hydro Propulsion Core #2", "水能涡轮反冲核心 #2", "Núcleo Impulsor Hídrico #2"],
            ["جوهرة الشلال المتوهجة #3", "Glowing Waterfall Jewel #3", "激流水流荧光闪石 #3", "Gema Brillante de la Cascada #3"]
          ],
          "سقوط الصقر الحر: تحدي رياح طويق الصاعدة": [
            ["تيار الهواء الصاعد الأول", "Thermal Draft Lift #1", "热气流上升涌风 #1", "Soplido Térmico de Viento #1"],
            ["ريشة طاقة الصقر الأسطورية #2", "Mythical Falcon Golden Blade #2", "神话黄金猎鹰翎羽 #2", "Pluma Dorada del Halcón #2"],
            ["طاقة قمة جبل الصقر #3", "Falcon Peak Zenith Power #3", "猎鹰绝顶时空水晶 #3", "Energía de Cúspide del Halcón #3"]
          ]
        };
        const customCpEntry = cpNames[key];
        const cpNameResult = customCpEntry && customCpEntry[idx] 
          ? (lang === 'ar' ? customCpEntry[idx][0] : lang === 'en' ? customCpEntry[idx][1] : lang === 'zh' ? customCpEntry[idx][2] : customCpEntry[idx][3])
          : cp.name;
        return {
          ...cp,
          name: cpNameResult
        };
      })
    };
  }

  if (lang !== 'ar') {
    return {
      ...mission,
      name: lang === 'en' ? `Qiddiya Urgent Event: ${mission.name}` : lang === 'zh' ? `基迪亚限时特发事件：${mission.name}` : `Evento Especial Qiddiya: ${mission.name}`,
      description: lang === 'en' ? "Simulated live event matched via GPS satellite tracking. Camera and visual elements calibrated." : lang === 'zh' ? "GPS卫星通联并解算出的一起虚实结合实景AR体验活动。探针传感器和姿态传感器已就绪。" : "Desafío especial sincronizado por satélite GPS y rastreadores móviles.",
      arCheckpoints: mission.arCheckpoints.map((cp: any, idx: number) => ({
        ...cp,
        name: lang === 'en' ? `Holo Target ${String.fromCharCode(65 + idx)}` : lang === 'zh' ? `全息光能节点 ${String.fromCharCode(65 + idx)}` : `Nodo Holográfico ${String.fromCharCode(65 + idx)}`
      }))
    };
  }

  return mission;
};

const getTranslatedAssistantText = (text: string, lang: string) => {
  if (lang === 'ar') return text;
  
  if (text.includes('أهلاً بك يا بطل') || text.includes('بوابة القدية المستقبلية')) {
    if (lang === 'en') return "Welcome to ARENA X, champion! The intelligent metaverse portal of Qiddiya. Build custom games with AI instantly or participate in live GEO-located AR quests!";
    if (lang === 'zh') return "欢迎，勇士！这里是基迪亚未来世界ARENA X大堂。轻触按钮即刻用AI构筑三维挑战，或是到实地点位捕集时空AR水晶！";
    return "¡Bienvenido a ARENA X, campeón! El portal metavérsico inteligente de Qiddiya. Crea niveles con IA al instante o asume misiones AR con tu GPS real.";
  }

  if (text.includes('عمل رائع وفوز أسطوري') || text.includes('عملة نيونية')) {
    const scoreMatch = text.match(/سجلت (\d+) نقطة/);
    const score = scoreMatch ? scoreMatch[1] : '1000';
    const fameMatch = text.match(/\+(\d+) شهرة/);
    const fame = fameMatch ? fameMatch[1] : '100';
    const coinsMatch = text.match(/\+(\d+) عملة/);
    const coins = coinsMatch ? coinsMatch[1] : '50';

    if (lang === 'en') return `Fantastic run and legendary win! You recorded a high score of ${score} pts. Earned +${fame} Fame and +${coins} Neon Coins 🪙!`;
    if (lang === 'zh') return `终极试玩圆满完胜！您获得了高达 ${score} 分。累计充能了 +${fame} 点段位声望，并提取 +${coins} 霓虹代币奖励 🪙！`;
    return `¡Absolutamente espectacular! Lograste una marca de ${score} puntos. Sincronizaste +${fame} reputación de Fama y +${coins} Monedas de Neón 🪙!`;
  }

  if (text.includes('مبارك تفعيل خوذة التحكم الافتراضية') || text.includes('مبارك تفعيل خوذة') || text.includes('هدية ترحيبية')) {
    if (lang === 'en') return "Avatar synced and neural helmet connected! You received a welcome credit of 100 Neon Gems as Qiddiya's newest explorer! 🚀";
    if (lang === 'zh') return "已成功通过网络双向校准验证！您已获得 100 霓虹尊享开荒币充值！ 🚀";
    return "¡Sincronización completa, casco de exploración enlazado! ¡Recibiste un bono de bienvenida de 100 gemas para comprar equipamiento! 🚀";
  }

  if (text.includes('انتهى من تشكيل لعبتك المبتكرة') || text.includes('مذهل بحق')) {
    if (lang === 'en') return "Brilliant! Qiddiya AI 'KAYAN' finished generating your interactive blueprint! Use the button below to test play on your screen.";
    if (lang === 'zh') return "不胜赞叹！AI已编译并对齐了您构思的三维战境！该游戏现已被正式载入大厅，随时可以点击开启试玩！";
    return "¡Excelente! La IA 'KAYAN' completó la modulación de tu entorno virtual. El plano ya está disponible para demostración interactiva en el vestíbulo.";
  }

  if (text.includes('صفقة ممتازة') || text.includes('اشتريت عتاد القدية')) {
    if (lang === 'en') return "Splendid purchase! The item has been unlocked and stored in your inventory locker, ready to be worn immediately!";
    if (lang === 'zh') return "交易成功！该全息数字战甲已被收入藏品柜，您可以随时配置到分身！";
    return "¡Trato exquisito! El artículo se ha desbloqueado en tu arsenal cibernético y está listo para ser utilizado en cualquier momento.";
  }

  return text;
};

const mapDistrictToLanguage = (district: string, lang: string) => {
  const map: Record<string, Record<string, string>> = {
    motorsport: {
      ar: 'مدينة سباقات القدية',
      en: 'Qiddiya Speed City',
      zh: '吉迪亚赛车城',
      es: 'Ciudad del Motor Qiddiya'
    },
    adventure: {
      ar: 'جرف طويق والمغامرات الجبلية',
      en: 'Tuwaiq Cliffs & Adventure',
      zh: '图怀克悬崖探险区',
      es: 'Acantilados de Tuwaiq'
    },
    esports: {
      ar: 'ساحة الألعاب الإلكترونية المفتوحة',
      en: 'Open Esports & Gaming Arena',
      zh: '电子竞技超级斗技馆',
      es: 'Arena Abierta de Esports'
    },
    aquatics: {
      ar: 'منتزه الألعاب المائية المتوهجة',
      en: 'Glowing Aqua Theme Park',
      zh: '全景发光水上世界',
      es: 'Parque de Juegos Acuáticos'
    },
    future: {
      ar: 'ستاد كأس العالم والمنطقة المستقبلية 2034',
      en: 'Future of Qiddiya & World Cup 2034',
      zh: '2034世界杯与未来星轨场馆',
      es: 'Copa Mundial 2034 y Futura Qiddiya'
    }
  };
  return map[district]?.[lang] || map[district]?.[lang] || district;
};

const getTranslatedStatsTitle = (title: string, lang: string) => {
  if (title.includes('مبتدئ') || title.includes('Principiante') || title.includes('Beginner') || title.includes('初级')) {
    return lang === 'ar' ? 'مبتدئ القدية 🔰' : lang === 'en' ? 'Qiddiya Beginner 🔰' : lang === 'zh' ? '特区初级试炼者 🔰' : 'Principiante Qiddiya 🔰';
  }
  if (title.includes('مصمم') || title.includes('Designer') || title.includes('设计')) {
    return lang === 'ar' ? 'مصمم الميتافيرس 🛠️' : lang === 'en' ? 'Metaverse Designer 🛠️' : lang === 'zh' ? '元界空间设计家 🛠️' : 'Diseñador del Metaverso 🛠️';
  }
  if (title.includes('مبدع') || title.includes('Creator') || title.includes('巨匠')) {
    return lang === 'ar' ? 'مبدع المحاكاة الثنائية 🧠' : lang === 'en' ? 'Dual Simulation Creator 🧠' : lang === 'zh' ? '超构模拟器巨匠 🧠' : 'Creador de Simulaciones 🧠';
  }
  return lang === 'ar' ? 'أسطورة القدية 🏆' : lang === 'en' ? 'Qiddiya Legend 🏆' : lang === 'zh' ? '至尊基迪亚传奇 🏆' : 'Leyenda de Qiddiya 🏆';
};

export default function App() {
  // Navigation & User Language settings
  const [language, setLanguage] = useState<'ar' | 'en' | 'zh' | 'es'>(() => {
    const saved = localStorage.getItem('arena_x_lang');
    return (saved as any) || 'ar';
  });

  const changeLanguage = (lang: 'ar' | 'en' | 'zh' | 'es') => {
    setLanguage(lang);
    localStorage.setItem('arena_x_lang', lang);
  };

  const t = (key: keyof typeof translations.ar) => {
    return translations[language][key] || translations.ar[key] || '';
  };

  const getTranslatedTitle = (title: string) => {
    if (language === 'ar') return title;
    if (title === '🏆 أسطورة القدية' || title === 'أسطورة القدية') {
      return language === 'en' ? 'Legend of Qiddiya' : language === 'zh' ? '基迪亚传奇' : 'Leyenda de Qiddiya';
    }
    if (title === 'مبدع' || title === 'صانع') {
      return language === 'en' ? 'Creator' : language === 'zh' ? '创作者' : 'Creador';
    }
    return language === 'en' ? 'Explorer' : language === 'zh' ? '玩家' : 'Explorador';
  };

  // Navigation & User configuration State
  const [avatar, setAvatar] = useState<PlayerAvatar | null>(() => {
    const saved = localStorage.getItem('arena_x_avatar');
    return saved ? JSON.parse(saved) : null;
  });

  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('arena_x_stats');
    if (saved) return JSON.parse(saved);
    return {
      coins: 120,
      fame: 150,
      title: 'مبتدئ',
      createdGamesCount: 0,
      level: 1,
      unlockedAssets: ['none']
    };
  });

  const [activeTab, setActiveTab] = useState<'map' | 'creator' | 'play' | 'live-ar' | 'shop' | 'leaderboard'>('map');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('motorsport');
  
  // Custom game creator states
  const [gamePrompt, setGamePrompt] = useState('');
  const [createdGames, setCreatedGames] = useState<GameBlueprint[]>(() => {
    const saved = localStorage.getItem('arena_x_blueprints');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGenre, setSelectedGenre] = useState('سباق سيارات مستقبلي');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeBlueprint, setActiveBlueprint] = useState<GameBlueprint | null>(null);

  // AR GPS states
  const [gpsSimulatedZone, setGpsSimulatedZone] = useState<string>('منطقة الفورمولا');
  const [liveMission, setLiveMission] = useState<LiveMission | null>(null);
  const [loadingMission, setLoadingMission] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Play simulator states
  const [playSimActive, setPlaySimActive] = useState(false);
  const [simulatingGameTitle, setSimulatingGameTitle] = useState('');
  const [gameScore, setGameScore] = useState(0);
  const [carX, setCarX] = useState(50); // percentage 10-90
  const [obstaclesList, setObstaclesList] = useState<{ id: number; x: number; y: number; type: string }[]>([]);
  const [gemList, setGemList] = useState<{ id: number; x: number; y: number }[]>([]);
  const [simGameOver, setSimGameOver] = useState(false);
  const [simGameTime, setSimGameTime] = useState(15); // seconds countdown for fast intense fun

  // Setup Avatar temporary states
  const [tempName, setTempName] = useState('لاعب_طويق');
  const [tempColor, setTempColor] = useState('#ec4899'); // Fuchsia
  const [tempSuit, setTempSuit] = useState('cyber_suit');
  const [tempAccessory, setTempAccessory] = useState('holographic_visor');

  // AI assistant conversational bubble
  const [assistantText, setAssistantText] = useState('أهلاً بك يا بطل في أرينا إكس! بوابة القدية المستقبلية الذكية. صمم ألعابك بالذكاء الاصطناعي فورياً، أو التقط تحديات الـ AR والموقع الجغرافي الحي!');

  // Persist State
  useEffect(() => {
    if (avatar) {
      localStorage.setItem('arena_x_avatar', JSON.stringify(avatar));
    }
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('arena_x_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('arena_x_blueprints', JSON.stringify(createdGames));
  }, [createdGames]);

  // Handle GPS simulated zone change
  useEffect(() => {
    if (activeTab === 'live-ar') {
      fetchLiveMission(gpsSimulatedZone);
    }
  }, [gpsSimulatedZone]);

  // Handle camera stream logic
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((e) => {
          console.warn("Camera failed to load, falling back to simulated panoramic overlay.", e);
          setCameraStream(null);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  // Game simulator logic
  useEffect(() => {
    let interval: any = null;
    if (playSimActive && !simGameOver && simGameTime > 0) {
      interval = setInterval(() => {
        // Countdown
        setSimGameTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSimVictory();
            return 0;
          }
          return prev - 1;
        });

        // Spawn obstacles and gems
        setObstaclesList(prev => {
          // move down
          const updated = prev.map(o => ({ ...o, y: o.y + 10 })).filter(o => o.y < 100);
          if (Math.random() < 0.25) {
            updated.push({ id: Date.now() + Math.random(), x: Math.floor(Math.random() * 80) + 10, y: 0, type: ['صخرة رملية', 'ليزر نيون', 'بركان'][Math.floor(Math.random() * 3)] });
          }
          return updated;
        });

        setGemList(prev => {
          const updated = prev.map(g => ({ ...g, y: g.y + 10 })).filter(g => g.y < 100);
          if (Math.random() < 0.3) {
            updated.push({ id: Date.now() + Math.random(), x: Math.floor(Math.random() * 80) + 10, y: 0 });
          }
          return updated;
        });

      }, 250);
    }
    return () => clearInterval(interval);
  }, [playSimActive, simGameOver, simGameTime]);

  // Check game collision
  useEffect(() => {
    if (playSimActive && !simGameOver) {
      // Check gems collect
      gemList.forEach(gem => {
        if (Math.abs(gem.x - carX) < 10 && gem.y > 80 && gem.y < 95) {
          playSynthSound('coin');
          setGameScore(s => s + 100);
          setGemList(g => g.filter(item => item.id !== gem.id));
        }
      });
      // Check obstacle hit
      obstaclesList.forEach(obs => {
        if (Math.abs(obs.x - carX) < 8 && obs.y > 82 && obs.y < 95) {
          playSynthSound('explosion');
          setGameScore(s => Math.max(0, s - 50));
          // Crash penalty
          setObstaclesList(o => o.filter(item => item.id !== obs.id));
        }
      });
    }
  }, [carX, gemList, obstaclesList, playSimActive, simGameOver]);

  const handleSimVictory = () => {
    setActiveTab('map');
    playSynthSound('success');
    const gainedCoins = Math.floor(gameScore / 2) + 50;
    const gainedFame = 100;
    
    setStats(prev => {
      const newCoins = prev.coins + gainedCoins;
      const newFame = prev.fame + gainedFame;
      let newTitle = prev.title;
      if (newFame >= 3000) newTitle = 'أسطورة القدية';
      else if (newFame >= 1500) newTitle = 'مبدع';
      else if (newFame >= 500) newTitle = 'مصمم';
      return {
        ...prev,
        coins: newCoins,
        fame: newFame,
        title: newTitle,
        level: Math.floor(newFame / 500) + 1
      };
    });

    setAssistantText(`عمل رائع وفوز أسطوري! لقد سجلت ${gameScore} نقطة في لعبتك. كسبت طاقة إيجابية قدرها +${gainedFame} شهرة و +${gainedCoins} عملة نيونية 🪙!`);
    setPlaySimActive(false);
  };

  const handleCreateAvatar = () => {
    playSynthSound('success');
    const initializedAvatar: PlayerAvatar = {
      name: tempName,
      avatarColor: tempColor,
      suitStyle: tempSuit,
      accessory: tempAccessory
    };
    setAvatar(initializedAvatar);
    setStats(prev => ({
      ...prev,
      coins: prev.coins + 100,
      fame: prev.fame + 50
    }));
    setAssistantText(`مبارك تفعيل خوذة التحكم الافتراضية يا ${tempName}! لقد حصلت على هدية ترحيبية بقيمة 100 عملة أرينا كأول بطل واعد بالقدية! 🚀`);
  };

  // Generate game blueprint via AI API
  const handleGenerateGame = async () => {
    if (!gamePrompt.trim()) return;
    playSynthSound('beep');
    setGenerationLoading(true);
    setGenerationStep(1);

    const steps = [
      "جاري فحص جغرافية كثبان طويق بالقدية وتضاريسها...",
      "كيان تبني معايير اللياقة الفيزيائية ونظام الصدمات المائي الكهرومغناطيسي...",
      "توليد خوارزمية نقاط الفوز والعقبات ومفاتيح العبور الخمس هولوغرافياً...",
      "ربط واجهة الواقع المعزز AR ومخرجات كأس العالم 2034 وسرعة معالم القدية..."
    ];

    const timer = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= 4) {
          clearInterval(timer);
          return 4;
        }
        playSynthSound('beep');
        return prev + 1;
      });
    }, 1500);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${selectedGenre}: ${gamePrompt}`,
          district: mapDistrictToArabic(selectedDistrict),
          lang: language
        })
      });
      const data = await res.json();
      
      const newBlue: GameBlueprint = {
        id: Date.now().toString(),
        title: data.title || "تحدي سباق طويق النيوني",
        prompt: gamePrompt,
        district: mapDistrictToArabic(selectedDistrict),
        mapTheme: data.mapTheme || "مسار معلق بجبال القدية والأنفاق المضيئة بالوردي النيوني.",
        storyLine: data.storyLine || "أنت البطل المختار لاستعراض قوة التسارع في حافة جبل طابق المستقبلي.",
        trackPath: data.trackPath || ["خط المغادرة", "ممر العواصف", "جرف الصقور المعلق", "بوابة القدية الكبرى"],
        obstacles: data.obstacles || ["صخور تتدحرج بسرعة", "بوابات كشف الطاقة", "رياح معطلة عشوائية"],
        scoringSystem: data.scoringSystem || "10 نقاط لكل برميل كهرومغناطيسي تجمعه في الزمن المحدد.",
        winCondition: data.winCondition || "تخطي كافة المعالم الأربعة قبل اكتمال دقيقة وخمس ثوان.",
        creator: avatar?.name || "صانع_مجهول",
        rating: 5.0,
        playersCount: 1,
        soundEffects: data.soundEffects || ["ترهيم دبه توربينية رقمية", "إنذار المساعد كيان"],
        createdAt: new Date().toLocaleDateString('ar-EG')
      };

      setCreatedGames(prev => [newBlue, ...prev]);
      setActiveBlueprint(newBlue);
      setStats(prev => ({
        ...prev,
        createdGamesCount: prev.createdGamesCount + 1,
        coins: prev.coins + 50,
        fame: prev.fame + 75
      }));
      playSynthSound('success');
      setAssistantText(`مذهل بحق! الذكاء الاصطناعي "كيان" انتهى من تشكيل لعبتك المبتكرة "${newBlue.title}"! تتوفر اللعبة الآن للاختبار المباشر والنشر للمجتمع!`);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerationLoading(false);
      setGenerationStep(0);
    }
  };

  // Fetch Live AR Location based GPS activities
  const fetchLiveMission = async (zone: string) => {
    setLoadingMission(true);
    try {
      const res = await fetch('/api/gemini/live-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: zone,
          playerUpgrade: stats.title,
          lang: language
        })
      });
      const data = await res.json();
      setLiveMission(data);
      playSynthSound('powerup');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMission(false);
    }
  };

  // Handle AR Point Collection Clicked
  const handleCollectARPoint = (pointId: string) => {
    if (!liveMission) return;
    playSynthSound('coin');
    
    const updatedCheckpoints = liveMission.arCheckpoints.map(cp => {
      if (cp.id === pointId) {
        return { ...cp, collected: true };
      }
      return cp;
    });

    setLiveMission({
      ...liveMission,
      arCheckpoints: updatedCheckpoints
    });

    // Check if fully collected and complete mission
    const allCollected = updatedCheckpoints.every(cp => cp.collected);
    if (allCollected) {
      setTimeout(() => {
        playSynthSound('success');
        setStats(prev => {
          const newCoins = prev.coins + (liveMission.coinsReward || 150);
          const newFame = prev.fame + (liveMission.pointsReward || 200);
          let newTitle = prev.title;
          if (newFame >= 3000) newTitle = 'أسطورة القدية';
          else if (newFame >= 1500) newTitle = 'مبدع';
          else if (newFame >= 500) newTitle = 'مصمم';
          
          return {
            ...prev,
            coins: newCoins,
            fame: newFame,
            title: newTitle,
            level: Math.floor(newFame / 500) + 1
          };
        });

        setAssistantText(`مهبرر! قمت بمسح المنطقة بالواقع المعزز واقتناص كافة نقاط طاقة "${liveMission.name}" بنجاح! مبروك الحصول على مكافأة مادية +${liveMission.coinsReward} عملة و +${liveMission.pointsReward} نقطة شهرة!`);
        setLiveMission(null);
        setCameraActive(false);
      }, 400);
    }
  };

  // Launch Play Mini Game Simulator View
  const handleLaunchSimulator = (gameTitle: string) => {
    playSynthSound('powerup');
    setSimulatingGameTitle(gameTitle);
    setCarX(50);
    setGameScore(0);
    setSimGameOver(false);
    setSimGameTime(15);
    setObstaclesList([
      { id: 1, x: 25, y: 15, type: 'عقبة نيون' },
      { id: 2, x: 70, y: 45, type: 'صخرة طويق الطائرة' }
    ]);
    setGemList([
      { id: 3, x: 50, y: 30 },
      { id: 4, x: 10, y: 60 }
    ]);
    setPlaySimActive(true);
  };

  const mapDistrictToArabic = (distId: string) => {
    switch (distId) {
      case 'motorsport': return 'مدينة السباقات';
      case 'adventure': return 'جرف المغامرات طويق';
      case 'esports': return 'ساحة الرياضات الإلكترونية';
      case 'aquatics': return 'مدينة ألعاب مائية';
      case 'future': return 'المنطقة المستقبلية 2034';
      default: return 'مدينة القدية الافتراضية';
    }
  };

  const mapDistrictToEnglish = (distId: string) => {
    switch (distId) {
      case 'motorsport': return 'Qiddiya Speed Park';
      case 'adventure': return 'Tuwaiq Adventure Cliff';
      case 'esports': return 'E-Sports Arena';
      case 'aquatics': return 'Glowing Water Park';
      case 'future': return 'World Cup Future Zone 2034';
      default: return 'Virtual Qiddiya City';
    }
  };

  const mapDistrictToChinese = (distId: string) => {
    switch (distId) {
      case 'motorsport': return '赛车极速特区';
      case 'adventure': return '图怀克探险胜地';
      case 'esports': return '电竞至尊名人堂';
      case 'aquatics': return '闪耀水上乐园';
      case 'future': return '2034世界杯未来区';
      default: return '基迪亚虚拟星图';
    }
  };

  const mapDistrictToSpanish = (distId: string) => {
    switch (distId) {
      case 'motorsport': return 'Parque de Velocidad';
      case 'adventure': return 'Acantilado de Aventuras';
      case 'esports': return 'Arena Esports';
      case 'aquatics': return 'Parque Acuático Inteligente';
      case 'future': return 'Zona Futura Mundial 2034';
      default: return 'Ciudad Virtual de Qiddiya';
    }
  };

  // Handle Buy Shop items
  const handleBuyItem = (item: ShopItem) => {
    if (stats.coins < item.price) {
      playSynthSound('explosion');
      alert("عملات النيون المتوفرة لديك غير كافية لامتلاك هذا العتاد الأسطوري!");
      return;
    }
    // Debit coins & add to inventory
    playSynthSound('success');
    setStats(prev => ({
      ...prev,
      coins: prev.coins - item.price,
      unlockedAssets: [...prev.unlockedAssets, item.id]
    }));
    setAssistantText(`صفقة ممتازة! لقد اشتريت عتاد القدية "${item.name}" للاستعراض داخل أرينا إكس وعاد بدلتك للتحديث الفوري!`);
  };

  // Equip Item from shop / wardrobe
  const handleEquipWardrobe = (itemId: string, category: 'suit' | 'accessory') => {
    playSynthSound('beep');
    if (category === 'suit') {
      let colorGlow = tempColor;
      if (itemId === 'suit_neon_obsidian') colorGlow = '#f43f5e'; // Deep pink glow
      if (itemId === 'suit_desert_nomad') colorGlow = '#f97316'; // Desert orange
      setAvatar(prev => prev ? { ...prev, suitStyle: itemId, avatarColor: colorGlow } : null);
    } else {
      setAvatar(prev => prev ? { ...prev, accessory: itemId } : null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070318] text-slate-100 overflow-x-hidden selection:bg-pink-600 selection:text-white pb-12 relative">
      
      {/* Background Cyber Glow Gradients Representing Qiddiya Brand (Pink, Turquoise, deep Purple) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#06b6d4]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Persistent Global Cyber Header - Language Switcher */}
      <div className="relative z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300 font-mono uppercase">
              {language === 'ar' ? 'البوابة الذكية لـ أرينا إكس نشطة حالياً 🟢' : 'ARENA X LIVE QUANTUM LINK CONNECTED 🟢'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 rounded-xl p-1 shadow-inner">
            <div className="flex items-center gap-1 px-2.5 text-[10px] font-extrabold text-slate-450 font-mono">
              <Globe className="w-3.5 h-3.5 text-pink-500 animate-spin [animation-duration:15s]" />
              <span className="hidden md:inline">{language === 'ar' ? 'تغيير اللغة:' : 'LANGUAGE:'}</span>
            </div>
            
            {[
              { code: 'ar', label: 'العربية 🇸🇦' },
              { code: 'en', label: 'English 🇬🇧' },
              { code: 'zh', label: '中文 🇨🇳' },
              { code: 'es', label: 'Español 🇪🇸' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => { playSynthSound('beep'); changeLanguage(lang.code as any); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 cursor-pointer ${
                  language === lang.code 
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-[#06b6d4] text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screen 1: Customize Avatar and Welcome */}
      {!avatar ? (
        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-[#06b6d4] bg-clip-text text-transparent">أرينا إكس | ARENA X</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900/40 border border-purple-500/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(236,72,153,0.1)]">
            
            {/* Visual Customization Workspace */}
            <div className="flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-l border-slate-700/50 pb-6 lg:pb-0 lg:pl-8">
              <span className="text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4">
                {language === "ar" ? "معاينة البدلة الهولوغرامية الفورية" : "Hologram Suit Live Preview"}
              </span>
              
              {/* Dynamic Animated Avatar SVG Viewer */}
              <div className="relative w-72 h-72 flex items-center justify-center bg-slate-950/70 border-4 border-slate-800 rounded-2xl p-4 overflow-hidden mb-6 group shadow-inner">
                {/* Visual grid behind avatar */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                
                {/* Floating energy rings */}
                <div className="absolute inset-0 border border-dashed border-pink-500/20 rounded-full animate-spin [animation-duration:12s]" />
                <div className="absolute w-44 h-44 border border-cyan-500/25 rounded-full animate-pulse" />

                <svg className="w-48 h-48 drop-shadow-[0_0_15px_var(--glow-color)] transition-all duration-300" style={{ '--glow-color': tempColor } as any} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Digital Cape */}
                  {tempAccessory === 'digital_cape' && (
                    <path d="M15 45L5 80L35 70M85 45L95 80L65 70" stroke={tempColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.9" />
                  )}
                  
                  {/* Hovering Drone companion */}
                  <g className="animate-bounce [animation-duration:3s]">
                    <circle cx="80" cy="20" r="5" fill="#06b6d4" />
                    <line x1="80" y1="20" x2="80" y2="28" stroke="#06b6d4" strokeWidth="1" />
                    <path d="M72 17H88" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Robot suit armor body */}
                  <path d="M30 65C30 55 40 50 50 50C60 50 70 55 70 65V90H30V65Z" fill="#111827" stroke={tempColor} strokeWidth="2.5" />
                  
                  {/* Suit chest core energy detailing */}
                  {tempSuit === 'cyber_suit' && (
                    <polygon points="50,55 58,68 42,68" fill={tempColor} className="animate-pulse" />
                  )}
                  {tempSuit === 'neon_outflow' && (
                    <path d="M40 75H60M42 62H58M45 68H55" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
                  )}
                  {tempSuit === 'retro_tech' && (
                    <rect x="42" y="60" width="16" height="16" rx="2" stroke="#a855f7" strokeWidth="2" />
                  )}
                  {tempSuit === 'desert_nomad' && (
                    <path d="M35 52 L50 85 L65 52" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                  )}

                  {/* Cyber neck and base */}
                  <rect x="45" y="42" width="10" height="8" rx="1" fill="#1f2937" stroke={tempColor} />

                  {/* Helmeted Head */}
                  <rect x="35" y="16" width="30" height="26" rx="8" fill="#1f2937" stroke={tempColor} strokeWidth="2.5" />
                  
                  {/* Dynamic visor */}
                  {tempAccessory === 'holographic_visor' ? (
                    <g>
                      <rect x="38" y="22" width="24" height="8" rx="2" fill="#020617" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="42" y1="26" x2="58" y2="26" stroke="#06b6d4" strokeWidth="2" className="animate-pulse" />
                    </g>
                  ) : tempAccessory === 'gravity_helmet' ? (
                    <g>
                      {/* Translucent bubble */}
                      <circle cx="50" cy="28" r="21" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="4 2" />
                      <circle cx="50" cy="27" r="8" fill={tempColor} />
                    </g>
                  ) : (
                    // Simple glowing matrix eyes
                    <g>
                      <circle cx="44" cy="28" r="2.5" fill={tempColor} />
                      <circle cx="56" cy="28" r="2.5" fill={tempColor} />
                    </g>
                  )}
                </svg>
              </div>

              {/* Action */}
              <button 
                onClick={handleCreateAvatar}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-lg py-4 px-6 rounded-xl transition duration-300 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] cursor-pointer"
              >
                <Zap className="w-5 h-5 animate-pulse" />
                {t("enterArena")}
              </button>
            </div>

            {/* Customization controls form */}
            <div className="flex flex-col justify-between py-2 col-span-1">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-l from-slate-100 to-pink-300 bg-clip-text text-transparent mb-5 border-r-4 border-pink-500 pr-3">
                  {language === "ar" ? "مواصفات البطل الرقمية" : "Fighter Digital Configurations"}
                </h3>

                {/* Input Name */}
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 font-semibold mb-2">{t("charName")}</label>
                  <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={16}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-4 py-3 text-lg font-bold text-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50" 
                  />
                  <div className="flex gap-2 mt-2">
                    {['بطل_القدية', 'سيبر_صقر', 'نيون_طويق', 'Qiddiya_Hero'].map(name => (
                      <button 
                        key={name}
                        onClick={() => { playSynthSound('beep'); setTempName(name); }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700/60 cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cyber Colors Vibe */}
                <div className="mb-5">
                  <label className="block text-xs text-slate-400 font-semibold mb-2">{t("charColor")}</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { hex: '#ec4899', labelAr: 'وردي القدية', labelEn: 'Qiddiya Pink' },
                      { hex: '#06b6d4', labelAr: 'أزرق مائي', labelEn: 'Cyber Aquatics' },
                      { hex: '#f97316', labelAr: 'غروب طويق', labelEn: 'Tuwaiq Sunset' },
                      { hex: '#a855f7', labelAr: 'سیبر بنفسجي', labelEn: 'Cyber Violet' }
                    ].map(col => (
                      <button 
                        key={col.hex}
                        onClick={() => { playSynthSound('beep'); setTempColor(col.hex); }}
                        className={`flex flex-col items-center p-2 rounded-lg border text-center transition cursor-pointer ${tempColor === col.hex ? 'bg-slate-800 border-pink-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                      >
                        <span className="w-5 h-5 rounded-full mb-1" style={{ backgroundColor: col.hex }} />
                        <span className="text-[10px] font-bold text-slate-300">{language === "ar" ? col.labelAr : col.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suit style option */}
                <div className="mb-5">
                  <label className="block text-xs text-slate-400 font-semibold mb-2">{t("charSuit")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cyber_suit', labelAr: 'البدلة الكونية السيبرانية', labelEn: 'Cosmic Cyber Armor', descAr: 'نظام دروع كهرومغناطيسي', descEn: 'Electromagnetic suit' },
                      { id: 'neon_outflow', labelAr: 'توهج التدفق النيوني', labelEn: 'Neon Flow Gasket', descAr: 'خطوط طاقية دقيقة سريعة', descEn: 'Velocity micro neon lines' },
                      { id: 'retro_tech', labelAr: 'التقنية العتيقة العريضة', labelEn: 'Tuwaiq Classic Retro', descAr: 'ألعاب طويق الكلاسيكية', descEn: 'Tuwaiq vintage pixel engine' },
                      { id: 'desert_nomad', labelAr: 'بدو طويق الرقمية ٣.٠', labelEn: 'Desert Tuwaiq Nomad', descAr: 'ممر كثبان ضد الأعاصير', descEn: 'Durable sandstorm explorer' }
                    ].map(suit => (
                      <button 
                        key={suit.id}
                        onClick={() => { playSynthSound('beep'); setTempSuit(suit.id); }}
                        className={`p-3 rounded-lg border text-right transition cursor-pointer ${tempSuit === suit.id ? 'bg-slate-800/80 border-pink-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                      >
                        <p className="text-xs font-bold">{language === "ar" ? suit.labelAr : suit.labelEn}</p>
                        <p className="text-[10px] text-slate-400">{language === "ar" ? suit.descAr : suit.descEn}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessory Options */}
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-2">{t("charAcc")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'holographic_visor', labelAr: 'النظار الهيدروجيني النبضي', labelEn: 'Hydrogen Scanner Visor', descAr: 'تتبع الكنوز وتحليل التضاريس', descEn: 'Scans landscapes & treasures' },
                      { id: 'gravity_helmet', labelAr: 'خوذة نيو-طويق الكروية', labelEn: 'Neo-Tuwaiq Grav Helmet', descAr: 'تعديل الجاذبية وحماية', descEn: 'Alters local gravity field' },
                      { id: 'digital_cape', labelAr: 'العباءة العائمة الطائرة', labelEn: 'Floating Cyber Cape', descAr: 'التحليق فوق الكثبان الرملية', descEn: 'Soars above sand dunes' },
                      { id: 'none', labelAr: 'بدون إضافات تذكر', labelEn: 'No Attachments', descAr: 'خيار الوزن الخفيف فائق الانسيابية', descEn: 'Lightweight high aerodynamic option' }
                    ].map(acc => (
                      <button 
                        key={acc.id}
                        onClick={() => { playSynthSound('beep'); setTempAccessory(acc.id); }}
                        className={`p-3 rounded-lg border text-right transition cursor-pointer ${tempAccessory === acc.id ? 'bg-slate-800/80 border-[#06b6d4]' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                      >
                        <p className="text-xs font-bold">{language === "ar" ? acc.labelAr : acc.labelEn}</p>
                        <p className="text-[10px] text-slate-400">{language === "ar" ? acc.descAr : acc.descEn}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      ) : (
        
        // MAIN GAME METAVERSE INTERACTIVE HUB
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          
          {/* Top Global Status Navigation Ribbon with Qiddiya Palette Theme */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-purple-500/30 rounded-2xl p-4 mb-8 backdrop-blur shadow-lg">
            
            {/* Left side: Avatar mini visual status & titles */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="w-14 h-14 bg-slate-950 border-2 border-pink-500 rounded-xl relative overflow-hidden flex items-center justify-center pt-2">
                <div className="absolute inset-0 bg-pink-500/10 animate-pulse" />
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
                  <path d="M30 65C30 55 40 50 50 50C60 50 70 55 70 65" stroke={avatar.avatarColor} strokeWidth="4" />
                  <rect x="35" y="16" width="30" height="26" rx="8" fill="#1f2937" stroke={avatar.avatarColor} strokeWidth="4" />
                </svg>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">{avatar.name}</span>
                  <span className="text-[10px] bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                    {language === 'ar' ? 'المستوى' : language === 'en' ? 'Level' : language === 'zh' ? '段位等级' : 'Nivel'} {stats.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mt-1">
                  <Award className="w-4 h-4 text-pink-500" />
                  <span>{language === 'ar' ? 'الرتبة: ' : language === 'en' ? 'Rank: ' : language === 'zh' ? '设计荣誉: ' : 'Rango: '}</span>
                  <span className="text-white bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-cyan-500/30 px-2">
                    {getTranslatedStatsTitle(stats.title, language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Live Coins and Legend progression */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6 w-full lg:w-auto justify-items-center">
              
               {/* Arena Coins container to purchase assets */}
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-yellow-500/40 rounded-xl px-4 py-2 text-right">
                <div className="bg-yellow-500/20 text-yellow-400 p-1.5 rounded-lg animate-bounce">
                  <span className="text-lg font-extrabold block">🪙</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('coins')}</span>
                  <span className="text-lg font-black text-yellow-400 font-mono tracking-wider">{stats.coins}</span>
                </div>
              </div>

              {/* Fame points container */}
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-pink-500/40 rounded-xl px-4 py-2 text-right">
                <div className="bg-pink-500/20 text-pink-400 p-1.5 rounded-lg animate-pulse">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">{t('fame')}</span>
                  <span className="text-lg font-black text-pink-400 font-mono tracking-wider">{stats.fame}</span>
                </div>
              </div>

              {/* Games count block */}
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-950/80 border border-purple-500/40 rounded-xl px-4 py-2 text-right">
                <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {language === 'ar' ? 'ألعابك الفريدة' : language === 'en' ? 'Your Games' : language === 'zh' ? '创客构想数' : 'Mis Creaciones'}
                  </span>
                  <span className="text-lg font-black text-purple-400 font-mono">{stats.createdGamesCount}</span>
                </div>
              </div>

            </div>

            {/* Right side: Modern active tab switcher */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
              {[
                { tag: 'map', icon: Home, label: language === 'ar' ? 'الرئيسية 🏠' : language === 'en' ? 'Home 🏠' : language === 'zh' ? '星图首页 🏠' : 'Inicio 🏠' },
                { tag: 'creator', icon: Wand2, label: language === 'ar' ? 'صناعة لعبة بالـ AI' : language === 'en' ? 'Create AI Game 🦾' : language === 'zh' ? 'AI 游戏梦工厂' : 'Creador de IA 🦾' },
                { tag: 'live-ar', icon: MapPin, label: language === 'ar' ? 'المستشعر الجيولوجي وAR' : language === 'en' ? 'GEO Sensor & AR 🛰️' : language === 'zh' ? 'AR 实景扫描仪' : 'Sensor AR 🛰️' },
                { tag: 'shop', icon: ShoppingBag, label: language === 'ar' ? 'متجر النيون' : language === 'en' ? 'Neon Shop 🪙' : language === 'zh' ? '霓虹商城' : 'Bazar de Neón 🪙' },
                { tag: 'leaderboard', icon: Users, label: language === 'ar' ? 'لوحة الأساطير' : language === 'en' ? 'Leaderboard 🏆' : language === 'zh' ? '至尊名人堂' : 'Tabla de Líderes 🏆' }
              ].map(tab => (
                <button
                  key={tab.tag}
                  onClick={() => { playSynthSound('beep'); setActiveTab(tab.tag as any); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${activeTab === tab.tag ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-[#06b6d4] text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]' : 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* SENSOR GPS FLOATING NOTIFICATION BANNER */}
          <div className="bg-gradient-to-r from-pink-900/40 via-purple-950/30 to-blue-900/40 border border-pink-500/30 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <p className="text-xs font-bold text-slate-200 text-right">
                <span className="text-cyan-400">
                  {language === 'ar' ? '🛰️ محاكي القمر الاصطناعي GPS الذكي: ' : language === 'en' ? '🛰️ Smart GPS Satellite Simulator: ' : language === 'zh' ? '🛰️ 智能卫星三维追踪雷达: ' : '🛰️ Posicionamiento de Satélite GPS: '}
                </span> 
                 {language === 'ar' ? 'أنت متواجد بنجاح في ' : language === 'en' ? 'You are successfully inside ' : language === 'zh' ? '您已成功进入基迪亚 ' : 'Sincronizado con éxito en '} <span className="bg-pink-600/20 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded font-mono">{gpsSimulatedZone}</span>. {language === 'ar' ? 'تم توفير حدث مباشر AR بالقرب منك!' : language === 'en' ? 'Live AR event ready nearby!' : language === 'zh' ? '附近已就地感应并生成实时虚拟AR遭遇关卡！' : '¡Evento AR listo cerca de tu huella!'}
              </p>
            </div>
            <button 
              onClick={() => { setActiveTab('live-ar'); playSynthSound('powerup'); }}
              className="text-xs bg-slate-950 hover:bg-pink-900/20 text-pink-400 hover:text-pink-300 border border-pink-500/30 px-4 py-1.5 rounded-lg transition font-extrabold cursor-pointer animate-pulse"
            >
              {language === 'ar' ? 'افتح لوحة المسح الـ AR 🎯' : language === 'en' ? 'Open AR Scan Panel 🎯' : language === 'zh' ? '开启全息AR实景探测 🎯' : 'Abrir Radar AR 🎯'}
            </button>
          </div>

          {/* Main Grid: LEFT COLUMN (Interaction Canvas), RIGHT COLUMN (KAYAN AI Copilot and Actions) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* COLUMN 1 & 2 & 3: Interactive Visual Canvas Area */}
            <div className="lg:col-span-3">
              
              {/* TAB 1: WORLD MAP IN QIDDIYA CITADEL */}
              {activeTab === 'map' && (
                <div className="space-y-6">
                  
                  {/* Hero Title & Info Section */}
                  <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800 text-right">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2 text-right">
                      <Compass className="w-6 h-6 text-[#06b6d4] animate-spin [animation-duration:5s]" />
                      {language === 'ar' ? 'ميتافيرس القدية: خريطة السيطرة والتحديات' : language === 'en' ? 'Qiddiya Metaverse: Domination Map & Live Challenges' : language === 'zh' ? '吉迪亚元宇宙主控星图极其综合挑战' : 'Metatarso de Qiddiya: Mapa de Dominación y Retos'}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed text-right">
                      {language === 'ar' ? 'اختر المنطقة التي ترغب في استكشافها هولوغرافياً. تفعيل GPS بأي منطقة سيفتح لك مهمة تتبع AR خاصة في هاتفك لمواجهة معالم طويق في اللياقة والسرعة والذكاء الاصطناعي!' : language === 'en' ? 'Select the district you wish to explore holographically. Calibrating GPS to any zone will unlock a unique mobile-ready AR tracking mission based in real-world Qiddiya structures.' : language === 'zh' ? '请在全息影像面板上点选基迪亚特区。在任何行政区模拟就地GPS接入，您的智能设备都将解密并渲染当地独特的物理AR地标 and 竞速冒险任务。' : 'Selecciona el distrito que deseas explorar. Alternar el módulo de posicionamiento GPS en cualquier cuadrante disparará un reto de rastreo AR exclusivo en tu teléfono para desafiar tus reflejos.'}
                    </p>
                  </div>

                  {/* Interactive Styled Grid Representation of Qiddiya Map */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[
                      {
                        id: 'motorsport',
                        label: language === 'ar' ? 'مدينة سباقات القدية' : language === 'en' ? 'Qiddiya Speed Park' : language === 'zh' ? '基迪亚赛车极速特区' : 'Circuito de Carreras de Qiddiya',
                        color: 'from-orange-500 to-pink-600',
                        glow: 'rgba(249,115,22,0.15)',
                        border: 'border-orange-500/40',
                        gpsZone: 'منطقة الفورمولا',
                        desc: 'أطول مضمار سريع، محركات سيارة طائرة كهرومغناطيسية وحلبات غبار بركاني.',
                        presetGamesCount: 12
                      },
                      {
                        id: 'adventure',
                        label: 'جرف طويق والمغامرات الجبلية',
                        color: 'from-yellow-500 to-pink-500',
                        glow: 'rgba(236,72,153,0.15)',
                        border: 'border-pink-500/40',
                        gpsZone: 'جرف الصقور والمغامرات',
                        desc: 'تسلق المنحدرات الشاهقة، وتحديات الصقور الطائرة وريشة خلايا الطاقة الرملية.',
                        presetGamesCount: 8
                      },
                      {
                        id: 'esports',
                        label: 'ساحة الرياضات الإلكترونية',
                        color: 'from-purple-600 to-[#06b6d4]',
                        glow: 'rgba(168,85,247,0.15)',
                        border: 'border-purple-500/40',
                        gpsZone: 'صالة الميتافيرس للألعاب',
                        desc: 'مصنع المبدعين الرقمي، دمج الترفيه الذكي وبطولات الكبار المتزامنة.',
                        presetGamesCount: 22
                      },
                      {
                        id: 'aquatics',
                        label: 'منتزه الألعاب المائية المتوهجة',
                        color: 'from-[#06b6d4] to-blue-600',
                        glow: 'rgba(6,182,212,0.15)',
                        border: 'border-cyan-500/40',
                        gpsZone: 'مدينة الألعاب المائية',
                        desc: 'منزلقات هيدروليكية ذكية متصلة بكاميرات الواقع المعزز ومكعبات الكنوز.',
                        presetGamesCount: 14
                      },
                      {
                        id: 'future',
                        label: 'ستاد كأس العالم والمنطقة المستقبلية 2034',
                        color: 'from-pink-500 via-purple-600 to-[#06b6d4]',
                        glow: 'rgba(236,72,153,0.25)',
                        border: 'border-pink-500/30',
                        gpsZone: 'ملعب النيون ٢٠٣٤',
                        desc: 'ضربات ترجيح مكهربة هولوغرامية تحت سماء دائرية متموجة.',
                        presetGamesCount: 19
                      }
                    ].map(dist => (
                      <div 
                        key={dist.id}
                        onClick={() => { playSynthSound('beep'); setSelectedDistrict(dist.id); }}
                        className={`cursor-pointer rounded-2xl p-5 border text-right transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-[230px] ${selectedDistrict === dist.id ? `bg-slate-900 border-pink-500 shadow-[0_0_25px_${dist.glow}]` : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800'}`}
                      >
                        {/* Decorative background visual accent mapping colors */}
                        <div className={`absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r ${dist.color}`} />
                        
                        <div>
                          <div className="flex items-center justify-between mb-3 pt-2">
                            <span className="text-[10px] uppercase font-black bg-slate-800 text-[#06b6d4] px-2.5 py-1 rounded border border-slate-700/60">
                              {dist.presetGamesCount} ألعاب حيّة
                            </span>
                            <MapPin className={`w-5 h-5 ${selectedDistrict === dist.id ? 'text-pink-500' : 'text-slate-600'}`} />
                          </div>

                          <h3 className="text-lg font-black text-white">{dist.label}</h3>
                          <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-3">{dist.desc}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-800/80">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              playSynthSound('powerup');
                              setGpsSimulatedZone(dist.gpsZone);
                            }}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded transition duration-200 cursor-pointer ${gpsSimulatedZone === dist.gpsZone ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'}`}
                          >
                            🛰️ محاكاة المجد الجغرافي هنا
                          </button>
                          
                          <span className="text-xs text-pink-400 font-bold hover:underline">استكشاف الألعاب ←</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Games available in the selected district */}
                  <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800 mt-6 text-right">
                    <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                      <Gamepad2 className="text-[#06b6d4]" />
                      {language === 'ar' ? (
                        <>الألعاب الجاهزة للعب الفوري في <span className="text-pink-400 font-black">[{mapDistrictToArabic(selectedDistrict)}]</span></>
                      ) : language === 'en' ? (
                        <>Instant Playable Games in <span className="text-pink-400 font-black">[{mapDistrictToEnglish(selectedDistrict)}]</span></>
                      ) : language === 'zh' ? (
                        <>可供立即畅玩的游戏 &gt; <span className="text-pink-400 font-black">[{mapDistrictToChinese(selectedDistrict)}]</span></>
                      ) : (
                        <>Juegos Disponibles para Jugar en <span className="text-pink-400 font-black">[{mapDistrictToSpanish(selectedDistrict)}]</span></>
                      )}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mix of presets and user designed games */}
                      {[
                        ...createdGames.filter(g => g.district === mapDistrictToArabic(selectedDistrict)),
                        ...PREBUILT_GAMES.filter(g => g.district === mapDistrictToArabic(selectedDistrict)).map(g => getTranslatedPrebuiltGame(g, language))
                      ].length === 0 ? (
                        <div className="col-span-2 text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 p-4">
                          <p className="text-slate-400 text-sm">
                            {language === 'ar' ? 'لم يقم اللاعبون بإنشاء ألعاب مخصصة في هذا القطاع بعد.' : language === 'en' ? 'No custom games have been created in this sector yet.' : language === 'zh' ? '该特区内尚未有玩家设计自定义关卡。' : 'No se han creado juegos personalizados en este sector.'}
                          </p>
                          <small className="text-[#06b6d4] font-semibold mt-2 block">
                            {language === 'ar' ? 'كن صانع التاريخ الأول وانقر زر "صناعة لعبة بالـ AI"! 🪄' : language === 'en' ? 'Be the first pioneer and click "Create AI Game"! 🪄' : language === 'zh' ? '成为首位开创者，点击“AI 游戏梦工厂”创造历史！ 🪄' : '¡Sé el pionero y haz clic en "Creador de IA"! 🪄'}
                          </small>
                        </div>
                      ) : (
                        [
                          ...createdGames.filter(g => g.district === mapDistrictToArabic(selectedDistrict)),
                          ...PREBUILT_GAMES.filter(g => g.district === mapDistrictToArabic(selectedDistrict)).map(g => getTranslatedPrebuiltGame(g, language))
                        ].map(game => (
                          <div 
                            key={game.id} 
                            className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-pink-500/50 transition"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-mono font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {game.rating}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {language === 'ar' ? `اللاعبين: ${game.playersCount}` : language === 'en' ? `Players: ${game.playersCount}` : language === 'zh' ? `玩家数: ${game.playersCount}` : `Jugadores: ${game.playersCount}`}
                                </span>
                              </div>
                              <h4 className="text-md font-bold text-slate-100">{game.title}</h4>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {language === 'ar' ? 'فكرتها: ' : language === 'en' ? 'Concept: ' : language === 'zh' ? '游戏概念: ' : 'Concepto: '}
                                {game.prompt}
                              </p>
                              <p className="text-[10px] text-pink-400 mt-2">
                                {language === 'ar' ? 'المخترع: ' : language === 'en' ? 'Creator: ' : language === 'zh' ? '创作者: ' : 'Creador: '}
                                @{game.creator}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-cyan-400 font-bold">
                                {language === 'ar' ? 'مكسب: +120 عملة' : language === 'en' ? 'Earn: +120 Coins' : language === 'zh' ? '奖励: +120 霓虹币' : 'Premio: +120 Monedas'}
                              </span>
                              <button 
                                onClick={() => handleLaunchSimulator(game.title)}
                                className="flex items-center gap-1 text-xs bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold px-4 py-1.5 rounded-lg transition shadow-md cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                {language === 'ar' ? 'العب الآن' : language === 'en' ? 'Play Now' : language === 'zh' ? '开始玩乐' : 'Jugar Ahora'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: AI PROMPT GAME BUILDER ENGINE */}
              {activeTab === 'creator' && (
                <div className="space-y-6">
                  
                  {/* Informative Header */}
                  <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800 text-right">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                      <Wand2 className="w-6 h-6 text-pink-500 animate-pulse" />
                      بناء الألعاب بالواقع السيبراني والذكاء الاصطناعي
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      بكبسة زر وبدون تعلم لغات البرمجة المعقدة. اكتب لـ "كيان" فكرتك وسيتكفل النموذج الذكي ببناء بيئة التضاريس، العقبات، مسارات الكنوز، والتأثيرات النيونية في ثوانٍ!
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 md:p-8 text-right space-y-6">
                    
                    {/* Theme and location configuration block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">القطاع والمنطقة المقترحة للتجربة</label>
                        <select 
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="motorsport">مدينة سباقات القدية (مضمار كهرومغناطيسي)</option>
                          <option value="adventure">جرف طويق (ارتفاعات وصقور ورمال)</option>
                          <option value="esports">ساحة الألعاب الإلكترونية المفتوحة</option>
                          <option value="aquatics">مدينة ألعاب مائية عائمة هيدروليكية</option>
                          <option value="future">مستقبل القدية الفائق وكأس العالم 2034</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">تصنيف ومحرك اللعبة الأساسي</label>
                        <select 
                          value={selectedGenre}
                          onChange={(e) => setSelectedGenre(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="سباق سيارات مستقبلي">سباق سيارات طائرة وطاقة نيونية</option>
                          <option value="مغامرة وتجميع الكنوز">بحث عن الصدف واللآلئ الواقع افتراضي</option>
                          <option value="كرة قدم خارقة للجاذبية">ضربات كورة إلكترونية تشتعل بالبرق</option>
                          <option value="بيت رعب وغموض سعودي">بيت وحوش فلكلوري بمجسات رقمية</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Prompt core input */}
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">اكتب اللعبة التي تحلم بها باللغة العربية الفصحى أو العامية:</label>
                      <textarea 
                        value={gamePrompt}
                        onChange={(e) => setGamePrompt(e.target.value)}
                        placeholder="مثال: أبغى لعبة سباق سيارات حمضية بين جبال طويق مع انفجارات كهرومغناطيسية وعقبات صخرية تتدحرج من القمة..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-pink-500/80 font-medium"
                      />
                      
                      <div className="flex flex-wrap gap-2 mt-4 items-center">
                        <span className="text-xs text-slate-500">أفكار مقترحة لتبدأ بها:</span>
                        {[
                          "تحدي كنز هيدرو-مائي تحت شلالات القدية السحيقة وتفادي كرات الليزر",
                          "طيران كهرومغناطيسي على حافة المنحدر بحثاً عن صقور نيون طائرة",
                          "دوري كرة قدم كأس العالم ٢٠٣٤ بضربات برق تفجر عوائق الحارس",
                        ].map((idea, id) => (
                          <button 
                            key={id}
                            onClick={() => { playSynthSound('beep'); setGamePrompt(idea); }}
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-pink-300 px-3 py-1.5 rounded-lg border border-slate-800 transition text-right truncate max-w-[400px] cursor-pointer"
                          >
                            + {idea}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generation Button */}
                    <button 
                      onClick={handleGenerateGame}
                      disabled={generationLoading || !gamePrompt}
                      className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-lg py-4 rounded-xl transition duration-300 shadow-[0_0_25px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center gap-3 cursor-pointer"
                    >
                      {generationLoading ? (
                        <>
                          <RotateCcw className="w-5 h-5 animate-spin" />
                          جاري البناء الذكي هولوغرافياً...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                          تشييد المخطط الهندسي التفاعلي بالـ AI 🪄
                        </>
                      )}
                    </button>

                  </div>

                  {/* LOADING GRAPHICS SCENARIO */}
                  {generationLoading && (
                    <div className="bg-slate-950/90 rounded-2xl p-8 border border-pink-500/30 text-center space-y-4">
                      <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-pink-500 animate-spin" />
                        <div className="absolute inset-3 rounded-full border-4 border-cyan-500 animate-pulse" />
                      </div>
                      
                      <h4 className="text-xl font-extrabold text-white">كيان والذكاء الاصطناعي يبنيان الملاعب الآن</h4>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        نقوم بحقن تضاريس جبال طويق، ونضع كود العقبات لتفادي الاصطدامات الحركية وتوليد بوابات طاقة نيون ذكية...
                      </p>

                      <div className="max-w-xs mx-auto space-y-1.5 pt-4">
                        {[
                          "تحليل رغبات اللعبة والربط بالقمر الاصطناعي 🛰️",
                          "بناء مجسمات الكنوز والجاذبية في مضمار مائي 💦",
                          "تركيب خطة النقاط وأصوات الانفصال التخيلي 🔊",
                          "تصنيف قواعد التحدي وكتابة كود الألعاب 🕹️"
                        ].map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 justify-center text-xs">
                            <span className={`w-2.5 h-2.5 rounded-full ${generationStep > idx ? 'bg-pink-500 shadow-glow' : 'bg-slate-700'}`} />
                            <span className={generationStep > idx ? 'text-pink-400 font-bold' : 'text-slate-500'}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DISPLAY BLUEPRINT SCHEMATIC ON SUCCESSFUL GENERATION */}
                  {activeBlueprint && !generationLoading && (
                    <div className="bg-slate-900/80 border-2 border-cyan-500/50 rounded-2xl p-6 md:p-8 text-right relative overflow-hidden backdrop-blur shadow-[0_0_40px_rgba(6,182,212,0.15)]">
                      {/* Blueprint Grid Watermark background */}
                      <div className="absolute inset-0 bg-[#06b6d4]/5 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-4 gap-4">
                          <div>
                            <span className="text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full uppercase tracking-wider">
                              مخطط الميتافيرس الرقمي النشط 📐
                            </span>
                            <h3 className="text-2xl md:text-3xl font-black text-cyan-400 mt-2">{activeBlueprint.title}</h3>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                playSynthSound('beep');
                                navigator.clipboard.writeText(JSON.stringify(activeBlueprint, null, 2));
                                alert("تم نسخ كود المخطط اللعبة لمشاركته مع رفقائك وتجربته جماعياً!");
                              }}
                              className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg border border-slate-800 cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 text-[#06b6d4]" />
                              مشاركة مع الأصدقاء
                            </button>
                            <button 
                              onClick={() => {
                                playSynthSound('coin');
                                alert("لعبتك المخصصة تم حقنها في لوحة التحديات الأسبوعية وكسبت ميزة الشهرة!");
                              }}
                              className="text-xs bg-pink-500 hover:bg-pink-600 text-white font-extrabold px-3 py-2 rounded-lg shadow cursor-pointer"
                            >
                              نشر للقدية 🚀
                            </button>
                          </div>
                        </div>

                        {/* Story plotline */}
                        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800">
                          <h4 className="text-xs font-black text-[#06b6d4] uppercase mb-1">حبكة القصة الترفيهية الفائقة</h4>
                          <p className="text-sm text-slate-300 leading-relaxed font-semibold">{activeBlueprint.storyLine}</p>
                        </div>

                        {/* Key checkpoints visual flow path */}
                        <div>
                          <h4 className="text-xs font-black text-[#06b6d4] uppercase mb-3">مسار البوابة ونقاط التفتيش الجغرافية (Checkpoints)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {activeBlueprint.trackPath.map((pathName, index) => (
                              <div key={index} className="bg-slate-950/85 border border-slate-800 rounded-lg p-3 text-center">
                                <span className="text-[10px] bg-cyan-900/40 text-cyan-400 border border-cyan-500/25 w-6 h-6 rounded-full inline-flex items-center justify-center font-mono font-bold mb-2">
                                  0{index + 1}
                                </span>
                                <h5 className="text-xs font-semibold text-slate-200">{pathName}</h5>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mid grid parameters details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Obstacles traps list */}
                          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                            <h4 className="text-xs font-black text-pink-500 uppercase mb-3 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" />
                              عوائق البيئة والمخاطر المبرمجة
                            </h4>
                            <ul className="space-y-2">
                              {activeBlueprint.obstacles.map((obs, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                  {obs}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Sound Profiles */}
                          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                            <h4 className="text-xs font-black text-[#06b6d4] uppercase mb-3 flex items-center gap-1.5">
                              <Cpu className="w-4 h-4" />
                              المؤثرات الصوتية والبيئية الرقمية
                            </h4>
                            <ul className="space-y-2">
                              {activeBlueprint.soundEffects.map((sound, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  {sound}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Winning Rules details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 rounded-xl p-4 border border-slate-850">
                          <div>
                            <h4 className="border-r-2 border-yellow-500 pr-2 text-xs font-bold text-yellow-500">نظام احتساب النقاط</h4>
                            <p className="text-xs text-slate-300 mt-1">{activeBlueprint.scoringSystem}</p>
                          </div>
                          <div>
                            <h4 className="border-r-2 border-emerald-500 pr-2 text-xs font-bold text-emerald-400">شروط الفوز المطلق</h4>
                            <p className="text-xs text-slate-300 mt-1">{activeBlueprint.winCondition}</p>
                          </div>
                        </div>

                        {/* Test Play Trigger Button */}
                        <div className="pt-4 flex justify-between items-center bg-slate-950/90 rounded-xl p-4 border border-slate-800">
                          <div>
                            <p className="text-xs font-bold text-white">هل أنت جاهز لتجربة لعبتك التي قمت ببرمجتها هولوغرافياً؟</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">سجل نقاط فوز مدهشة واشحن عجزك من عملات النيون!</p>
                          </div>
                          <button 
                            onClick={() => handleLaunchSimulator(activeBlueprint.title)}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer animate-bounce"
                          >
                            <Gamepad2 className="w-4 h-4" />
                            اختبار اللمس في المتصفح 🎮
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: LIVE GPS SCANS & AR ARTIFACTS CAPTURE RADAR */}
              {activeTab === 'live-ar' && (
                <div className="space-y-6">
                  
                  {/* Informative description */}
                  <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800 text-right">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-[#06b6d4]" />
                      رادار الكشف الجغرافي والواقع المعزّز AR بالقدية حية
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      نظام التتبع يفتح نافذة الكاميرا الخاصة بك ويلتقط إدماج الموقع بالجي بي إس. اجمع الكرات الطائرة النيونية ثلاثية الأبعاد التي يحقنها الذكاء الاصطناعي في بيئتك لكسب مكافآت الشهرة وعملات التطوير!
                    </p>
                  </div>

                  {/* Simulator coordinate switches for debug/fun */}
                  <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-right">
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-3">اختر موقع وقوفك الحالي بالقدية لمحاكاة الحدث</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button 
                        onClick={() => { playSynthSound('beep'); setGpsSimulatedZone('منطقة الفورمولا'); }}
                        className={`text-xs font-bold py-2 px-3 rounded-lg border transition ${gpsSimulatedZone === 'منطقة الفورمولا' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                        🏎️ حلبة سباقات السرعة (Formula 1)
                      </button>
                      <button 
                        onClick={() => { playSynthSound('beep'); setGpsSimulatedZone('مدينة الألعاب المائية'); }}
                        className={`text-xs font-bold py-2 px-3 rounded-lg border transition ${gpsSimulatedZone === 'مدينة الألعاب المائية' ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#06b6d4]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                        💦 حديقة المياه العائلية
                      </button>
                      <button 
                        onClick={() => { playSynthSound('beep'); setGpsSimulatedZone('جرف الصقور والمغامرات'); }}
                        className={`text-xs font-bold py-2 px-3 rounded-lg border transition ${gpsSimulatedZone === 'جرف الصقور والمغامرات' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                        🗻 قمة ومنحدر المغامرات بـ طويق
                      </button>
                    </div>
                  </div>

                  {/* Real-time AR Camera Sandbox Area */}
                  {loadingMission ? (
                    <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                      <RotateCcw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-300">كيان تحقن إحداثيات طويق في رادار عدسة الكاميرا...</p>
                    </div>
                  ) : liveMission ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
                      
                      {/* Live AR Camera overlay stream */}
                      <div className="relative h-[380px] bg-slate-950 flex items-center justify-center overflow-hidden">
                        
                        {cameraActive ? (
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                          />
                        ) : (
                          // High-tech virtual radar graphic background for fallback
                          <div className="absolute inset-0 bg-[#090514] opacity-80 flex flex-col items-center justify-center">
                            <div className="absolute w-80 h-80 rounded-full border border-pink-500/10 animate-ping" />
                            <div className="absolute w-60 h-60 rounded-full border border-[#06b6d4]/20 animate-pulse" />
                            <div className="absolute w-40 h-40 rounded-full border border-purple-500/30" />
                            <div className="absolute w-20 h-20 rounded-full border border-[#06b6d4]/45 flex items-center justify-center">
                              <Compass className="w-8 h-8 text-[#06b6d4] animate-spin" />
                            </div>
                            {/* Satellite scope scanning lines */}
                            <div className="absolute w-full h-0.5 bg-cyan-500/30 top-1/2 left-0 animate-bounce" />
                          </div>
                        )}

                        {/* Interactive floating AR checkpoints layout */}
                        <div className="absolute inset-0 pointer-events-none">
                          {liveMission.arCheckpoints.map(cp => {
                            if (cp.collected) return null;
                            return (
                              <button 
                                key={cp.id}
                                onClick={() => handleCollectARPoint(cp.id)}
                                className="absolute pointer-events-auto p-4 flex flex-col items-center group cursor-pointer focus:outline-none transition transform hover:scale-110"
                                style={{ top: `${cp.y}%`, left: `${cp.x}%` }}
                              >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 p-0.5 animate-bounce shadow-[0_0_15px_rgba(236,72,153,0.8)]">
                                  <div className="w-full h-full rounded-full bg-[#070318] flex items-center justify-center">
                                    <span className="text-xl">💎</span>
                                  </div>
                                </div>
                                <span className="text-[9px] bg-slate-950/90 text-white font-bold px-1.5 py-0.5 rounded border border-pink-500/30 mt-1 whitespace-nowrap">
                                  {cp.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Top-right real location sensor UI overlay */}
                        <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-850 p-3 rounded-xl text-right max-w-xs backdrop-blur pointer-events-none">
                          <p className="text-[10px] text-emerald-400 font-extrabold flex items-center justify-end gap-1.5">
                            🛰️ القمر الاصطناعي متصل بنجاح
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          </p>
                          <h5 className="text-xs font-black text-white mt-1">القدية {liveMission.zone}</h5>
                          <p className="text-[9px] text-slate-400 mt-0.5">مسح الكفاءة الحجمية: 100%</p>
                        </div>

                        {/* Camera Toggle Button Overlay */}
                        <button 
                          onClick={() => { playSynthSound('beep'); setCameraActive(!cameraActive); }}
                          className="absolute bottom-4 left-4 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 font-bold cursor-pointer transition shadow-lg"
                        >
                          {cameraActive ? (
                            <>
                              <CameraOff className="w-4 h-4 text-pink-500" />
                              إغلاق البث والكاميرا الواقعية
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-cyan-400" />
                              تشغيل الكاميرا الحقيقية ومطابقة الموقع
                            </>
                          )}
                        </button>

                      </div>

                      {/* Briefing text of the AR Task */}
                      <div className="p-5 border-t border-slate-800 text-right bg-slate-950">
                        <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          الموجات المتوفرة بالمكان
                        </span>
                        <h4 className="text-lg font-black text-pink-400 mt-2">{liveMission.name}</h4>
                        <p className="text-slate-300 text-xs leading-relaxed mt-1">{liveMission.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-900/80">
                          <div>
                            <p className="text-[11px] text-slate-400 font-bold">باقي لجمع الكنز من الكاميرا:</p>
                            <p className="text-xs text-[#06b6d4] font-semibold mt-0.5">
                              {liveMission.arCheckpoints.filter(c => !c.collected).length} نقاط طاقة سابحة في تضاريس الغرفة أو الموقع!
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-xs bg-slate-900 text-cyan-400 font-black border border-cyan-500/20 py-1.5 px-3 rounded-lg">
                              جوائز: +{liveMission.coinsReward} 🪙
                            </span>
                            <span className="text-xs bg-slate-900 text-[#06b6d4] font-black border border-[#06b6d4]/20 py-1.5 px-3 rounded-lg">
                              {language === 'ar' ? `شهرة: +${liveMission.pointsReward} 🔥` : language === 'en' ? `Fame: +${liveMission.pointsReward} 🔥` : language === 'zh' ? `段位声望: +${liveMission.pointsReward} 🔥` : `Fama: +${liveMission.pointsReward} 🔥`}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                      <p className="text-slate-400">
                        {language === 'ar' ? 'لا يوجد حدث واقع معزّز متاح في موقعك الجغرافي المحدد حالياً.' : language === 'en' ? 'No active AR events detected in your GPS simulated zone.' : language === 'zh' ? '当前的GPS位置附近暂未激活任何AR虚拟互动关卡。' : 'No se detectaron eventos AR activos en tu zona GPS.'}
                      </p>
                      <button 
                        onClick={() => fetchLiveMission(gpsSimulatedZone)}
                        className="text-xs text-pink-500 font-extrabold underline block mt-2 mx-auto cursor-pointer"
                      >
                        {language === 'ar' ? 'اضغط هنا لإعادة معايرة الموقع 🛰️' : language === 'en' ? 'Click here to recalibrate sensors 🛰️' : language === 'zh' ? '点击此处重新校准雷达卫星 🛰️' : 'Recalibrar señal de satélite 🛰️'}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: NEON ACCENTS SHOPPING MALL */}
              {activeTab === 'shop' && (
                <div className="space-y-6">
                  
                  {/* Decorative Banner */}
                  <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800 text-right">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-[#a855f7]" />
                      {language === 'ar' ? 'متجر النيون والأوبسيديان الفريد بالقدية' : language === 'en' ? 'Qiddiya Obsidian & Neon Custom Wardrobe' : language === 'zh' ? '吉迪亚极致光脉与黑曜原件商城' : 'Bazar de Neón y Obsidiana de Qiddiya'}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {language === 'ar' ? 'أنفِق العملات التي جنيتها من تصميم ألعاب ناجحة وصناعة فعاليات GPS لشراء مركبات أسرع، وألوان ليزر هولوغرامية، وديكورات للترويج للعبتك في أرينا القدية!' : language === 'en' ? 'Spend your earned neon coins from successful AI blueprints and GPS missions to buy high-speed flying gliders, purple quant lasers, and premium suit skins!' : language === 'zh' ? '在此兑换您在AI创作或AR探险中筹措的精币！换购高机动飞车、电离子脉冲光环，甚至更帅气的限定战服。' : '¡Gasta tus monedas de neón para adquirir vehículos más rápidos, destellos de luz cuánticos y personalizaciones de traje único!'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {DEFAULT_SHOP_ITEMS.map((item) => {
                      const translatedItem = getTranslatedShopItem(item, language);
                      const isUnlocked = stats.unlockedAssets.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-[#06b6d4] px-2.5 py-0.5 rounded font-bold uppercase">
                                {item.category === 'suit' 
                                  ? (language === 'ar' ? 'بدل سيبرانية' : language === 'en' ? 'Cyber Suit' : language === 'zh' ? '赛博战服' : 'Traje Cibernético') 
                                  : item.category === 'vehicle' 
                                    ? (language === 'ar' ? 'مركبات طائرة' : language === 'en' ? 'Glider Vehicle' : language === 'zh' ? '高空飞车' : 'Vehículo Volador') 
                                    : (language === 'ar' ? 'تأثيرات الهالة' : language === 'en' ? 'Aura Effects' : language === 'zh' ? '全息光环' : 'Efectos de Aura')}
                              </span>
                              
                              <span className="text-sm font-black text-yellow-400 font-mono tracking-wider">
                                🪙 {item.price}
                              </span>
                            </div>

                            <h4 className="text-[15px] font-black text-slate-100">{translatedItem.name}</h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{translatedItem.description}</p>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-900 flex gap-2">
                            {isUnlocked ? (
                              <>
                                <button 
                                  onClick={() => handleEquipWardrobe(item.id, item.category === 'suit' ? 'suit' : 'accessory')}
                                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-extrabold text-xs py-2 rounded-xl transition cursor-pointer"
                                >
                                  {language === 'ar' ? 'تجهيز / ارتداء البدلة الآن ✅' : language === 'en' ? 'Equip Gear Now ✅' : language === 'zh' ? '装备此皮肤 ✅' : 'Equipar Skin ✅'}
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleBuyItem(item)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow cursor-pointer"
                              >
                                {language === 'ar' ? `شراء بـ ${item.price} عملة` : language === 'en' ? `Buy for ${item.price} Coins` : language === 'zh' ? `购买首领装备 ${item.price} 币` : `Comprar por ${item.price} Monedas`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB 5: LEADERBOARDS & CHAMPIONSHIP VOTE */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  
                  {/* Informative Header */}
                  <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800 text-right">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      منصة صانعي المحتوى ولجنة التحكيم الكبرى
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      يصوت اللاعبون على تصاميم ومخرجات نظرائهم. كل أسبوع يقدم الذكاء الاصطناعي "كيان" موضوعاً تنافسياً، والألعاب الحائزة على أعلى تقييم تفوز بريشة طويق الزمردية وجوائز بمكاسب تصل 50,000 عملة!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right">
                    
                    {/* Creators weekly challenge box */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
                      <span className="text-[10px] bg-red-600/20 text-red-400 font-black px-3 py-1 rounded-full uppercase border border-red-500/30">
                        التحدي الأسبوعي النشط 🏆
                      </span>
                      <h3 className="text-xl font-extrabold text-white mt-3">اصنع مغامرة سباق تدعم كأس العالم 2034!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2">
                        صمم مخططاً بالذكاء الاصطناعي يحتوي على كرات النيون الذهبية والتحكم بالحارس الرقمي واستعرض معالم القدية المستقبلية مع تفجيرات مغناطيسية على المدرج.
                      </p>

                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mt-5 space-y-3">
                        <h4 className="text-xs font-black text-cyan-400">صوت للمبدعين الحاليين:</h4>
                        
                        <div className="space-y-2">
                          {[
                            { title: "سباق هيدرو-كرة كهرومغناطيسي 2034", creator: "سيبر_رونالدو_١٠", votes: 342 },
                            { title: "الألعاب الزجاجية في جرف طويق", creator: "بنت_طويق_الأصيلة", votes: 290 }
                          ].map((voteGame, id) => (
                            <div key={id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-slate-200">{voteGame.title}</h5>
                                <p className="text-[10px] text-slate-500">المخترع: @{voteGame.creator}</p>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  playSynthSound('coin');
                                  setStats(prev => ({ ...prev, coins: prev.coins + 15 }));
                                  alert(`تم التصفيات بنجاح! كسبت +15 عملة نيون لتطوير عتادك ولدعمك مبدعي القدية!`);
                                }}
                                className="text-[11px] bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold py-1 px-3.5 rounded hover:opacity-90 cursor-pointer"
                              >
                                👍 {voteGame.votes} تصويت
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Creators Leaders list */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-lg font-black text-white mb-4">أفضل مبدعي الميتافيرس بالقدية</h3>
                      
                      <div className="space-y-3">
                        {[
                          { rank: 1, name: "أسطورة_طويق_٧٧", title: "أسطورة القدية", famePoints: 4890, gamesCreated: 34, avatar: "#ec4899" },
                          { rank: 2, name: "سيبراني_حائل_٢٠", title: "مبدع", famePoints: 2980, gamesCreated: 18, avatar: "#06b6d4" },
                          { rank: 3, name: "ولد_الرياض_المستقبلي", title: "مبدع", famePoints: 1720, gamesCreated: 9, avatar: "#a855f7" }
                        ].map((user) => (
                          <div key={user.rank} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black bg-slate-950 text-yellow-400 w-6 h-6 rounded-full flex items-center justify-center">
                                {user.rank}
                              </span>
                              
                              <div>
                                <h5 className="text-xs font-black text-white">@{user.name}</h5>
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold border border-slate-700">
                                  {user.title}
                                </span>
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <p className="text-xs font-black text-pink-400">{user.famePoints} نقطة شهرة</p>
                              <p className="text-[9px] text-slate-400">الألعاب المصممة: {user.gamesCreated}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* COLUMN 4: THE FLOATING smart AI assistant "كيان" */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-right space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06b6d4]/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Kayan hologram vector avatar bubble */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-slate-900 border-2 border-[#06b6d4] rounded-full relative overflow-hidden flex items-center justify-center group mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
                  <div className="absolute inset-0 bg-[#06b6d4]/10" />
                  
                  {/* Robotic Kayan Eyes and Matrix face mask vector */}
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
                    <line x1="20" y1="50" x2="80" y2="50" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />
                    {/* Glowing robot shape */}
                    <circle cx="50" cy="40" r="15" stroke="#06b6d4" strokeWidth="3" fill="#111827" />
                    <circle cx="45" cy="40" r="2.5" fill="#06b6d4" className="animate-ping" />
                    <circle cx="55" cy="40" r="2.5" fill="#06b6d4" />
                    <path d="M40 70 L50 90 L60 70 Z" stroke="#06b6d4" strokeWidth="2" fill="#030712" />
                  </svg>
                </div>
                
                <h4 className="text-lg font-black text-[#06b6d4]">المساعد الذكي "كيان" 🤖</h4>
                <span className="text-[10px] bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30 px-2 py-0.5 rounded-full font-bold mt-1">
                  ذكاء القدية الاصطناعي النشط
                </span>
              </div>

              {/* Chat speech bubble */}
              <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl relative">
                <div className="absolute top-4 -right-1.5 w-3.5 h-3.5 bg-slate-900 border-t border-r border-slate-800/80 rotate-45 transform" />
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {assistantText}
                </p>
              </div>

              {/* Smart Assistant predefined question triggers */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <p className="text-[10px] text-slate-400 font-bold mb-2">توجيه ذكي فوري من كيان:</p>
                <button 
                  onClick={() => {
                    playSynthSound('beep');
                    setAssistantText("ما رأيك فكرة لعبة سباق مركبات مغناطيسية على حافة جبل طويق حيث تتغير قوة الجاذبية فجأة ويكون عليك جمع لآلئ نيون حمراء والوصول قبل نفاذ شحن المركبة؟ انسخ هذا واكتبه في خانة الـ AI!");
                  }}
                  className="w-full text-right text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-pink-300 p-2.5 rounded-lg border border-slate-850 block cursor-pointer"
                >
                  💡 اقترحي علي فكرة لعبة لسباق السيارات
                </button>
                <button 
                  onClick={() => {
                    playSynthSound('beep');
                    setAssistantText("نظام الرتب في القدية يعكس مهارتك البرمجية والابتكار: مبتدئ (من 0 إلى 500)، مصمم (500 إلى 1500)، مبدع (1500 إلى 3000)، وأخيرًا أسطورة القدية للذين يشيدون ألعاباً يلعبها الجميع!");
                  }}
                  className="w-full text-right text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-[#06b6d4] p-2.5 rounded-lg border border-slate-850 block cursor-pointer"
                >
                  📜 كيف أرتقي برتبتي لتصبح 'أسطورة'؟
                </button>
              </div>

            </div>

          </div>

          {/* ACTIVE PLAY INTEGRATED MINI GAME SIMULATOR ARCADE CABINET */}
          {playSimActive && (
            <div className="fixed inset-0 bg-[#03010b]/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="w-full max-w-xl bg-slate-950 border-4 border-pink-500 rounded-3xl overflow-hidden relative shadow-[0_0_60px_rgba(236,72,153,0.5)]">
                
                {/* Header ribbon */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-center border-b-4 border-slate-900">
                  <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                    <Gamepad2 className="animate-bounce" />
                    المحاكي التفاعلي المتكامل: {simulatingGameTitle}
                  </h3>
                  <p className="text-[10px] text-pink-100 font-semibold mt-0.5">
                     استخدم أزرار الشاشة أو الأسهم باللوحة يميناً ويساراً لتوجيه المركبة وتفادي العقبات!
                  </p>
                </div>

                {/* Score and Countdown bar details */}
                <div className="grid grid-cols-2 bg-slate-900 border-b border-slate-800 text-center p-3 font-mono font-black">
                  <div className="border-l border-slate-800 text-yellow-400 text-md">
                    🪙 النقاط المحرزة: {gameScore}
                  </div>
                  <div className="text-pink-400 text-md animate-pulse">
                    ⏱️ الوقت المتبقي: {simGameTime} ثوان
                  </div>
                </div>

                {/* Active Interactive Game Area */}
                <div className="relative h-[300px] bg-[#0c0722] overflow-hidden">
                  
                  {/* Cyber vertical light road paths */}
                  <div className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-cyan-500/25 border-dashed border-r border-cyan-500/10" />
                  <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-cyan-500/25 border-dashed border-r border-cyan-500/10" />
                  <div className="absolute top-0 bottom-3 w-full bg-[linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:100%_20px] pointer-events-none" />

                  {/* Falling Obstacles (rocks, lasers, volcanic debris) */}
                  {obstaclesList.map(obs => (
                    <div 
                      key={obs.id} 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 p-2"
                      style={{ top: `${obs.y}%`, left: `${obs.x}%` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-red-500 to-yellow-600 flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-spin">
                        ☄️
                      </div>
                      <span className="text-[8px] bg-red-950 border border-red-500/40 text-red-200 px-1 py-0.5 rounded whitespace-nowrap block mt-1">
                        {obs.type}
                      </span>
                    </div>
                  ))}

                  {/* Falling collectable Energy gems */}
                  {gemList.map(gem => (
                    <div 
                      key={gem.id} 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 p-2 text-xl animate-pulse"
                      style={{ top: `${gem.y}%`, left: `${gem.x}%` }}
                    >
                      💎
                    </div>
                  ))}

                  {/* Player Character Vehicle at Bottom */}
                  <div 
                    className="absolute bottom-6 transform -translate-x-1/2 flex flex-col items-center transition-all duration-150"
                    style={{ left: `${carX}%` }}
                  >
                    {/* Retro Hovercar SVG style representing client avatar style colors */}
                    <div className="p-0.5">
                      <svg className="w-12 h-12 drop-shadow-[0_0_10px_#ec4899]" viewBox="0 0 100 100" fill="none">
                        <polygon points="50,15 20,80 80,80" fill="#1e1b4b" stroke={avatar.avatarColor} strokeWidth="5" />
                        <rect x="42" y="60" width="16" height="15" rx="2" fill={avatar.avatarColor} />
                        <line x1="50" y1="15" x2="50" y2="80" stroke={avatar.avatarColor} strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-[9px] bg-slate-950 text-[#06b6d4] font-black px-2 py-0.5 rounded border border-[#06b6d4]/40 whitespace-nowrap">
                      {avatar.name}
                    </span>
                  </div>

                </div>

                {/* Mobile Keyboard / Screen Controls on simulator */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-4">
                  <button 
                    onMouseDown={() => { playSynthSound('beep'); setCarX(prev => Math.max(15, prev - 12)); }}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-700 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                  >
                    ← انعطاف لليسار
                  </button>
                  <button 
                    onMouseDown={() => { playSynthSound('beep'); setCarX(prev => Math.min(85, prev + 12)); }}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-700 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                  >
                    انعطاف لليمين →
                  </button>
                </div>

                {/* Quit Cabinet buttons */}
                <div className="bg-slate-950 p-4 border-t border-slate-900 flex justify-between">
                  <button 
                    onClick={() => { playSynthSound('beep'); setPlaySimActive(false); }}
                    className="text-xs bg-slate-900 hover:bg-red-900/30 text-rose-400 px-4 py-2 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    انسحاب من التحدي المائي 🛑
                  </button>
                  
                  <span className="text-xs text-slate-500 font-medium self-center">
                    أرينا إكس للسباقات الذكية
                  </span>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
