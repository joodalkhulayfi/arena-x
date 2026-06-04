import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Gemini client to avoid crashes on blank keys
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (aiClient) return aiClient;
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "" || key.includes("MY_GEMINI_API_KEY")) {
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      return aiClient;
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }

  // Live and robust localized fallback content generator in all 4 languages
  function generateFallbackBlueprint(prompt: string, district: string, lang: string = 'ar') {
    const defaultTitles: Record<string, string[]> = {
      ar: ["تحدي عواصف السرعة النيونية", "متاهة القدية السحيقة", "كأس الكثبان الطائرة 2034", "سر غامض في حافة جبل طويق", "قراصنة الموجات الرقمية المائية"],
      en: ["Neon Speed Storm Challenge", "Abyssal Qiddiya Labyrinth", "Flying Dunes Cup 2034", "Mystery of Tuwaiq Summit", "Aqua Digital Wave Privateers"],
      zh: ["聚变霓虹急速风暴赛", "深海基迪亚高能迷宫", "2034飞天流沙拉力赛", "图怀克绝顶密境大猎奇", "数字脉冲水动力海盗船"],
      es: ["Desafío de Velocidad Neón", "Laberinto de la Fosa de Qiddiya", "Copa Dunas Voladoras 2034", "Misterio en la Cima de Tuwaiq", "Corsarios Hidro-Digitales en Vivo"]
    };
    
    const defaultThemes: Record<string, string[]> = {
      ar: [
        "مضمار مستقبلي مجهز بأنفاق طاقة، مغلف بجزيئات الغبار النيونية والجسور المعلقة بين الكثبان الرملية.",
        "جرف جبلي شاهق الارتفاع مع مسارات زجاجية كاشفة للهاوية وتأثيرات رياح ديناميكية.",
        "مدرجات رياضية ذكية تتجاوب مع حركة كرة القدم الفائقة وبث لولبي ثلاثي الأبعاد.",
        "مدينة مائية متوهجة بأنابيب عائمة ذات تسارع هيدروليكي وشلالات مياه مشحونة تطلق نقاط ومكافآت."
      ],
      en: [
        "Futuristic racetrack equipped with electromagnetic energy tubes, glowing neon wind particles, and canyon suspension lanes.",
        "Extreme vertical cliff tracks styled with sheer drop-off visual displays and dynamic force winds.",
        "Smart stadium arenas pulsing to the movement of electrified gold footballs and high-tech hologram cameras.",
        "Aqua theme park glowing with hydraulic boosted speed tubes, waterfall drops, and neon treasure chests."
      ],
      zh: [
        "梦幻空天赛道，配有磁能动力加速管、发光冷光粒子风以及高悬在峡谷间的重力轨道桥。",
        "极端陡峭的悬崖立面垂直通道，配备全景玻璃悬空栈底及气流微调助推气缸。",
        "智能数字场馆，伴随闪电足球的进网轨迹同步绽放多频全息拉拉队光影画卷。",
        "水动力科技主题乐园，配有水流反冲管道、落水深潜重力滑道层以及漂浮数字奖章。"
      ],
      es: [
        "Circuito futurista equipado con túneles de inducción electromagnética, atmósfera de neón rosado y pistas colgantes.",
        "Pistas verticales extremas en acantilados con puentes transparentes de vidrio y sopladores de viento dinámicos.",
        "Estadios deportivos inteligentes que reaccionan a los golpeos del balón electromagnético.",
        "Toboganes de aceleración hidromecánica con cascadas cargadas que liberan cofres virtuales de neón."
      ]
    };

    const defaultStories: Record<string, string[]> = {
      ar: [
        `في عام 2034، أصبحت القدية عاصمة الترفيه الفائقة. تدور هذه المغامرة حول سباق تجريبي للسيارات المغناطيسية السريعة لعبور جبال طويق بسرعة جنونية متفادياً موجات الانفجار وحواجز طاقة كهرومغناطيسية عشوائية.`,
        `أنت مستكشف من النخبة دخل منطقة الألعاب المغلقة، وعليك توجيه منطادك النفاث فوق حافة القدية لجمع الكنوز السبعة الافتراضية قبل نفاذ طاقة البدلة.`
      ],
      en: [
        "In 2034, Qiddiya stands as the solar system's ultimate entertainment capital. Step inside standard trials in custom hovercraft models dodging volcanic fire stones and lasers.",
        "You are an elite cyber explorer traversing the sacred landmarks of Tuwaiq. Navigate carefully to fish out forgotten AR capsule vaults before your battery drains."
      ],
      zh: [
        "在未来纪元中，基迪亚元宇宙正式开放。您将驾驶气悬机械装甲越过图怀克群山起伏的磁暴区，闪避喷射而出的岩碎，挑战记录。",
        "您是一名顶级的数字穿梭者，正行进于图怀克标志性景观带。小心调整飞翼，在电池耗尽前，通过相机捕捉那些遗失在山间的神话水晶颗粒。"
      ],
      es: [
        "En el año 2034, Qiddiya es la capital mundial de la innovación. Pilota un aerodeslizador magnético de prueba flotando entre precipicios.",
        "Eres un explorador cibernético de élite navegando los acantilados sagrados. Conduce con precisión para recolectar las cápsulas AR antes de apagarte."
      ]
    };

    const titles = defaultTitles[lang] || defaultTitles.ar;
    const themes = defaultThemes[lang] || defaultThemes.ar;
    const stories = defaultStories[lang] || defaultStories.ar;

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomStory = stories[Math.floor(Math.random() * stories.length)];

    const paths: Record<string, string[]> = {
      ar: ["نقطة البداية: بوابة أرينا إكس الرقمية", "المنعطف الخطر: جرف الكثبان النيونية الشاهقة", "ممر العواصف: نفق الرياح المغناطيسية", "خط النهاية: منصة تتويج القدية المستقبلية"],
      en: ["Start Sector: ARENA X Gateway", "Danger Turn: Glowing Neon Dune", "Storm Corridor: Electromagnetic Pass", "Finish Line: Qiddiya Grand Podium"],
      zh: ["起始点位：ARENA X 数字跃迁门", "至暗弯道：聚变冷光巨沙丘", "风暴走廊：高空强磁线圈通道", "胜利终点：基迪亚未来璀璨领奖台"],
      es: ["Punto de Inicio: Portal de ARENA X", "Curva de Peligro: Gran Duna de Neón", "Corredor Tormenta: Canal Magnético", "Línea de Meta: Podio del Mañana"]
    };

    const obs: Record<string, string[]> = {
      ar: ["انفجارات طاقة ليزرية تظهر وتختفي بشكل مفاجئ", "عقبات صخرية متحركة تتدحرج من أعلى القمم", "موجات هيدروليكية مائية تعرقل الانسيابية وتعكس الاتجاه"],
      en: ["Unpredictable laser energy pulse explosions", "Falling planetary rocks rolling from high peaks", "Hydraulic currents altering vehicle aerodynamics and steering direction"],
      zh: ["忽明忽暗并带有瞬态烧蚀伤害的激光束", "从绝壁顶峰突然滚落的大型玄武岩碎沙", "反向水流剪切力，影响飞梭姿态及滑跑偏转"],
      es: ["Explosiones repentinas de haces láser de neón", "Rocas ígneas rodando desde los acantilados", "Corrientes de turbulencia hídrica que invierten tu dirección"]
    };

    const scoring: Record<string, string> = {
      ar: "كسب 100 نقطة لكل برميل طاقة يتم تجميعه وجائزة سرعة قصوى تبلغ 500 عملة أرينا.",
      en: "Earn 100 points for each energy drum captured plus a speed trophy of 500 Arena Coins.",
      zh: "每大跨捕获一个能量光核可记 100 分，限时过关特发 500 极速币荣誉赏。",
      es: "Suma 100 puntos por cada contenedor recolectado y gana 500 monedas de neón."
    };

    const win: Record<string, string> = {
      ar: "الوصول لخط النهاية في زمن أقل من 90 ثانية مع شحن لا يقل عن 50% من طاقة المركبة.",
      en: "Reach the finish gate under 90 seconds while retaining at least 50% vehicle battery level.",
      zh: "在90秒倒计时截止前跨过终点防线，并保持蓄电状态在 50% 以上。",
      es: "Cruza la compuerta final en menos de 90 segundos con al menos un 50% de escudo."
    };

    const soundVal: Record<string, string[]> = {
      ar: ["إيقاع إلكتروني حماسي صاخب بطابع Synthwave", "مؤثرات انفجار رعدية ثلاثية الأبعاد", "أصوات تنبيه هولوغرامية بصوت المساعد الذكي"],
      en: ["Fast-paced electronic cyberpunk synthwave", "3D thunderous core crackles", "Atmospheric advisory voice from KAYAN assistant"],
      zh: ["低音震颤的电子合成波重低音轨", "三维雷鸣重核粒子炸裂感爆发音效", "智能女音助理“Kayan”空间广播导航提示声"],
      es: ["Sintonía electrónica de alta velocidad estilo Synthwave", "Estallidos sísmicos tridimensionales", "Indicaciones por sensor acústico de la copiloto KAYAN"]
    };

    return {
      title: `${randomTitle}`,
      mapTheme: `${randomTheme}`,
      storyLine: `${randomStory}`,
      trackPath: paths[lang] || paths.ar,
      obstacles: obs[lang] || obs.ar,
      scoringSystem: scoring[lang] || scoring.ar,
      winCondition: win[lang] || win.ar,
      soundEffects: soundVal[lang] || soundVal.ar
    };
  }

  // --- API Routes ---

  // 1. Generate Game Blueprint Endpoint
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, district, lang } = req.body;
      const targetLang = lang || "ar";
      if (!prompt) {
        return res.status(400).json({ error: "الرجاء كتابة تفاصيل اللعبة المطلوبة" });
      }

      console.log(`Generating blueprint for district: ${district}, Prompt: "${prompt}", Language: "${targetLang}"`);
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback gracefully
        const fallback = generateFallbackBlueprint(prompt, district || "القدية المستقبلية", targetLang);
        return res.json(fallback);
      }

      const systemInstruction = `
        You are "KAYAN", the futuristic AI Assistant of Qiddiya Game Maker platform "ARENA X" (أرينا إكس). 
        You help players construct playable futuristic mini-games and simulations inside Qiddiya districts.
        You must deliver the output exactly in the requested JSON structure and entirely in this language: "${targetLang}".
        Ensure all returned text strings are natively, properly, and naturally written/translated according to: "${targetLang}". (ar: Arabic, en: English, zh: Chinese, es: Spanish).
        Ensure the theme, storyline, track, and obstacles reflect highly high-tech, futuristic Qiddiya concepts (AR, drones, Formula 1, water parks, cliffs, Saudi Vision 2030, World Cup 2034).
      `;

      const promptString = `
        Design a futuristic game blueprint based on this prompt: "${prompt}".
        The proposed location/district in Qiddiya is: "${district || "Adventure Cliffs"}".
        You MUST write the output fields (title, mapTheme, storyLine, trackPath, obstacles, scoringSystem, winCondition, soundEffects) in this language: "${targetLang}".
        Deliver with an exciting, immersive, high-tech tone!
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "catchy futuristic game title in Arabic" },
              mapTheme: { type: Type.STRING, description: "visual description of the theme in Arabic" },
              storyLine: { type: Type.STRING, description: "thrilling sci-fi back-story linking Qiddiya and user's prompt in Arabic" },
              trackPath: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 checkpoints/waypoints descriptive tags along the game logic path in Arabic"
              },
              obstacles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 3-4 obstacles or challenges in Arabic"
              },
              scoringSystem: { type: Type.STRING, description: "how victory points or coins are earned in Arabic" },
              winCondition: { type: Type.STRING, description: "rules to achieve total victory in Arabic" },
              soundEffects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 dynamic sound FX ideas in Arabic"
              }
            },
            required: ["title", "mapTheme", "storyLine", "trackPath", "obstacles", "scoringSystem", "winCondition", "soundEffects"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      // Fallback
      const { prompt, district } = req.body;
      const fallback = generateFallbackBlueprint(prompt || "لعبة مجهولة", district || "مدينة المغامرات");
      res.json({
        ...fallback,
        title: `${fallback.title} (وضع الاحتياطي بسبب خطأ)`
      });
    }
  });

  // 2. Generate Live GPS/AR Realtime Mission Endpoint
  app.post("/api/gemini/live-mission", async (req, res) => {
    try {
      const { zoneName, playerSpecialty, lang } = req.body;
      const targetLang = lang || "ar";
      const ai = getGeminiClient();

      if (!ai) {
        // Mock a fantastic customized live GPS AR adventure based on the zone
        const liveMissionsPreset: Record<string, any> = {
          "منطقة الفورمولا": {
            name: "عاصفة النقاء: سباق الاندماج المغناطيسي",
            description: "تم استشعار موقعك بنجاح في حلبة القدية لسباقات الفورمولا! تفعيل وضع المحاكاة البصرية الكاميرا المفتوحة الآن.",
            prompt: "اجمع خلايا الطاقة الهيدروجينية السابحة في شوارع الحلبة الافتراضية عبر توجيه الكاميرا، وقم بعمل دريفت مثالي لتفادي عوائق النيون الرقمية.",
            pointsReward: 320,
            coinsReward: 150,
            arCheckpoints: [
              { id: "cp1", name: "خلية الطاقة الاندماجية #1", x: 30, y: 45, collected: false },
              { id: "cp2", name: "المسرّع التوربيني الهولوغرافي #2", x: 70, y: 25, collected: false },
              { id: "cp3", name: "حلقة تفادي العائق الضوئي #3", x: 50, y: 75, collected: false }
            ]
          },
          "مدينة الألعاب المائية": {
            name: "إعصار طويق المائي: كنز الغوص العميق",
            description: "تم مطابقة إحداثياتك الحالية في قلب مدينة ألعاب القدية المائية الكبرى. المياه مشفرة هولوغرافياً!",
            prompt: "وجّه عدسة هاتفك نحو مسارات المنزلق المائي السريع لاقتناص الكبسولات الذهبية الطافية، مع مواجهة قنديل البحر الرقمي الحارس.",
            pointsReward: 280,
            coinsReward: 120,
            arCheckpoints: [
              { id: "cp1", name: "الصدفة المشفرة الفضية #1", x: 20, y: 60, collected: false },
              { id: "cp2", name: "نواة التسارع التوربيني المائي #2", x: 80, y: 50, collected: false },
              { id: "cp3", name: "جوهرة الشلال المتوهجة #3", x: 45, y: 20, collected: false }
            ]
          },
          "جرف الصقور والمغامرات": {
            name: "سقوط الصقر الحر: تحدي رياح طويق الصاعدة",
            description: "أنت تقف الآن أمام قمم جبل طويق الشامخة بالقدية. تفعيل مستشعر الارتفاع والرياح ذهنياً لرحلة AR خارقة.",
            prompt: "امسح صخور طويق المحيطة بك؛ ستظهر لك أجنحة صقر هولوغرامية لجمع ريش الطاقة الذهبية المعلقة بارتفاعات شاهقة والوصول لأعلى معدل نجاة.",
            pointsReward: 400,
            coinsReward: 200,
            arCheckpoints: [
              { id: "cp1", name: "تيار الهواء الصاعد الأول", x: 35, y: 30, collected: false },
              { id: "cp2", name: "ريشة طاقة الصقر الأسطورية #2", x: 65, y: 60, collected: false },
              { id: "cp3", name: "طاقة قمة جبل الصقر #3", x: 50, y: 15, collected: false }
            ]
          }
        };

        const mission = liveMissionsPreset[zoneName] || {
          name: `تحدي القدية الفوري: ${zoneName}`,
          description: `تفعيل ذكي لحدث مباشر متزامن مع موقعك الجغرافي المعاير في ${zoneName}.`,
          prompt: "تتبع النقاط المضيئة الطائرة حول مستشعرات الحرم الافتراضية واجمع البيانات لفتح جائزة أرينا اليومية.",
          pointsReward: 250,
          coinsReward: 100,
          arCheckpoints: [
            { id: "cp1", name: "نقطة مستشعر هولوغرافي A", x: 40, y: 50, collected: false },
            { id: "cp2", name: "نقطة طاقة مشفرة B", x: 60, y: 30, collected: false }
          ]
        };

        return res.json(mission);
      }

      // If Gemini API is available, generate dynamic customized live mission in custom language
      const systemInstruction = `
        You are "KAYAN", the guide AI of Qiddiya ARENA X.
        You generate location-based live AR game missions based on Qiddiya geographic zones.
        Produce your output in a valid, robust JSON matching the structure perfectly.
        You MUST write the output in this language: "${targetLang}". (ar: Arabic, en: English, zh: Chinese, es: Spanish).
      `;

      const promptString = `
        Generate an instant, high-tech AR mini scavenger mission matching players visiting the Qiddiya location: "${zoneName}".
        The main player skill specialty is: "${playerSpecialty || "General Exploration"}".
        You MUST write all output fields (name, description, prompt, arCheckpoints name) entirely in the language: "${targetLang}".
        Deliver a highly exciting, futuristic sci-fi description!
        Response JSON attributes:
        - name: a catchy high-tech mission name.
        - description: an engaging, sci-fi welcome briefing confirming GPS lock on the target sector.
        - prompt: precise instructions on where to scan the camera & AR sensors.
        - pointsReward: fame rating points to award (integer between 200 and 500).
        - coinsReward: development neon coins to award (integer between 100 and 300).
        - arCheckpoints: Array of exactly 3 interactive floating checkpoint items. Each has: id (cp1, cp2, cp3), name (catchy item name in "${targetLang}"), x (random relative coordinate integer between 10-90), y (random relative coordinate integer between 10-80), collected (false).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              prompt: { type: Type.STRING },
              pointsReward: { type: Type.INTEGER },
              coinsReward: { type: Type.INTEGER },
              arCheckpoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    collected: { type: Type.BOOLEAN }
                  },
                  required: ["id", "name", "x", "y", "collected"]
                }
              }
            },
            required: ["name", "description", "prompt", "pointsReward", "coinsReward", "arCheckpoints"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from live-mission Gemini provider");
      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (e: any) {
      console.error("Live Mission Gen Error:", e);
      res.json({
        name: `تحدي سباق القدية السرمدي في ${req.body.zoneName || "حلبة الفورمولا"}`,
        description: "مرحبا بك بكاميرتك في منطقة التحدي المباشر بالقدية، تم الكشف التلقائي عن تيار طاقي عالي حول مسارك الافتراضي.",
        prompt: "امسح المحيط بك لجمع خلايا النيون وتفادي التداخل المغناطيسي.",
        pointsReward: 300,
        coinsReward: 150,
        arCheckpoints: [
          { id: "cp1", name: "بوابة السرعة الافتراضية #1", x: 25, y: 40, collected: false },
          { id: "cp2", name: "نواة التسارع النبضية #2", x: 75, y: 30, collected: false },
          { id: "cp3", name: "عاصفة النيون الـ AR", x: 50, y: 70, collected: false }
        ]
      });
    }
  });

  // Serve static UI assets and handle single-page application fallback via Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ARENA X] Server Running on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
