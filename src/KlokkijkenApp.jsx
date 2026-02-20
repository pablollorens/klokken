import { useState, useCallback, useMemo, useEffect } from "react";

// ========== DUTCH TIME LOGIC ==========
const dutchTimeText = (hours, minutes) => {
  const hourNames = [
    "twaalf", "één", "twee", "drie", "vier", "vijf",
    "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf"
  ];
  const h12 = hours % 12;
  const nextH = (h12 + 1) % 12;
  const currentName = hourNames[h12];
  const nextName = hourNames[nextH === 0 ? 12 : nextH];

  if (minutes === 0) return `${currentName} uur`;
  if (minutes === 5) return `vijf over ${currentName}`;
  if (minutes === 10) return `tien over ${currentName}`;
  if (minutes === 15) return `kwart over ${currentName}`;
  if (minutes === 20) return `tien voor half ${nextName}`;
  if (minutes === 25) return `vijf voor half ${nextName}`;
  if (minutes === 30) return `half ${nextName}`;
  if (minutes === 35) return `vijf over half ${nextName}`;
  if (minutes === 40) return `tien over half ${nextName}`;
  if (minutes === 45) return `kwart voor ${nextName}`;
  if (minutes === 50) return `tien voor ${nextName}`;
  if (minutes === 55) return `vijf voor ${nextName}`;
  return `${currentName} uur`;
};

// ========== RANDOM HELPERS ==========
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateTime = (level) => {
  const h = randInt(1, 12);
  if (level === 1) return { h, m: 0 };
  if (level === 2) {
    const opts = [0, 15, 30, 45];
    return { h, m: opts[randInt(0, 3)] };
  }
  if (level === 3) {
    const opts = [0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55];
    return { h, m: opts[randInt(0, opts.length - 1)] };
  }
  // level 4: all 5-min increments
  return { h, m: randInt(0, 11) * 5 };
};

const generateDistractors = (correctH, correctM, level, count = 3) => {
  const correct = `${correctH}:${correctM}`;
  const distractors = new Set();
  let attempts = 0;
  while (distractors.size < count && attempts < 100) {
    const t = generateTime(level);
    const key = `${t.h}:${t.m}`;
    if (key !== correct) distractors.add(key);
    attempts++;
  }
  return [...distractors].map((k) => {
    const [dh, dm] = k.split(":").map(Number);
    return { h: dh, m: dm };
  });
};

// ========== SVG ANALOG CLOCK ==========
const AnalogClock = ({ hours, minutes, size = 180, interactive = false, showNumbers = true }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const minuteAngle = (minutes / 60) * 360 - 90;
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 - 90;

  const minuteLen = r * 0.82;
  const hourLen = r * 0.58;
  const handWidth = size * 0.035;
  const handColor = "#4a3728";
  const lightenHex = (hex, percent) => {
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  const handAccent = lightenHex(handColor, 28);

  const polarToCart = (angle, len) => ({
    x: cx + len * Math.cos((angle * Math.PI) / 180),
    y: cy + len * Math.sin((angle * Math.PI) / 180),
  });

  const minEnd = polarToCart(minuteAngle, minuteLen);
  const hrEnd = polarToCart(hourAngle, hourLen);

  const tickMarks = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 360 - 90;
    const isMajor = i % 5 === 0;
    const outerR = r * 0.95;
    const innerR = isMajor ? r * 0.82 : r * 0.88;
    const start = polarToCart(angle, innerR);
    const end = polarToCart(angle, outerR);
    tickMarks.push(
      <line
        key={`tick-${i}`}
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke={isMajor ? "#4a3728" : "#c4b5a6"}
        strokeWidth={isMajor ? 2.5 : 1}
        strokeLinecap="round"
      />
    );
  }

  const numbers = [];
  if (showNumbers) {
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 360 - 90;
      const pos = polarToCart(angle, r * 0.68);
      numbers.push(
        <text
          key={`num-${i}`}
          x={pos.x} y={pos.y}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: size * 0.11,
            fontFamily: "'Fredoka', 'Nunito', sans-serif",
            fontWeight: 600,
            fill: "#4a3728",
          }}
        >
          {i}
        </text>
      );
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={`shadow-${size}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
        <radialGradient id={`face-${size}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="100%" stopColor="#f5edd6" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r * 1.08} fill="#e8dcc8" filter={`url(#shadow-${size})`} />
      <circle cx={cx} cy={cy} r={r * 1.02} fill="#4a3728" />
      {/* Face */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#face-${size})`} />
      {/* Ticks */}
      {tickMarks}
      {/* Numbers */}
      {numbers}
      {/* Hour hand */}
      <line
        x1={cx} y1={cy}
        x2={hrEnd.x} y2={hrEnd.y}
        stroke={handColor}
        strokeWidth={handWidth}
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={cx} y1={cy}
        x2={minEnd.x} y2={minEnd.y}
        stroke={handColor}
        strokeWidth={handWidth}
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.028} fill={handColor} />
      <circle cx={cx} cy={cy} r={size * 0.015} fill={handAccent} />
    </svg>
  );
};

// ========== DIGITAL CLOCK ==========
const DigitalClock = ({ hours, minutes, size = 180 }) => {
  const h12 = hours % 12 || 12;
  const display = `${h12}:${minutes.toString().padStart(2, "0")}`;
  const w = size * 1.1;
  const h = size * 0.55;

  return (
    <div style={{
      width: w, height: h,
      background: "linear-gradient(145deg, #1a1a2e, #16213e)",
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      border: "2px solid #2a2a4a",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(76,201,240,0.06), transparent 60%)",
      }} />
      <span style={{
        fontFamily: "'Courier New', 'SF Mono', monospace",
        fontSize: size * 0.3,
        fontWeight: 700,
        color: "#4cc9f0",
        letterSpacing: size * 0.03,
        textShadow: "0 0 20px rgba(76,201,240,0.5), 0 0 40px rgba(76,201,240,0.2)",
      }}>
        {display}
      </span>
    </div>
  );
};

// ========== EXERCISE GENERATORS ==========
const EXERCISE_TYPES = {
  ANALOG_TO_TEXT: "analog_to_text",
  TEXT_TO_ANALOG: "text_to_analog",
  DIGITAL_TO_TEXT: "digital_to_text",
  TEXT_TO_DIGITAL: "text_to_digital",
  ANALOG_TO_DIGITAL: "analog_to_digital",
  DIGITAL_TO_ANALOG: "digital_to_analog",
};

const EXERCISE_LABELS = {
  [EXERCISE_TYPES.ANALOG_TO_TEXT]: "Analoge klok → Tekst",
  [EXERCISE_TYPES.TEXT_TO_ANALOG]: "Tekst → Analoge klok",
  [EXERCISE_TYPES.DIGITAL_TO_TEXT]: "Digitale klok → Tekst",
  [EXERCISE_TYPES.TEXT_TO_DIGITAL]: "Tekst → Digitale klok",
  [EXERCISE_TYPES.ANALOG_TO_DIGITAL]: "Analoog → Digitaal",
  [EXERCISE_TYPES.DIGITAL_TO_ANALOG]: "Digitaal → Analoog",
};

const EXERCISE_DESCRIPTIONS = {
  [EXERCISE_TYPES.ANALOG_TO_TEXT]: "Bekijk de analoge klok en kies de juiste tijd in het Nederlands",
  [EXERCISE_TYPES.TEXT_TO_ANALOG]: "Lees de tijd en kies de juiste analoge klok",
  [EXERCISE_TYPES.DIGITAL_TO_TEXT]: "Bekijk de digitale klok en kies de juiste tijd in het Nederlands",
  [EXERCISE_TYPES.TEXT_TO_DIGITAL]: "Lees de tijd en kies de juiste digitale klok",
  [EXERCISE_TYPES.ANALOG_TO_DIGITAL]: "Bekijk de analoge klok en kies de digitale tijd",
  [EXERCISE_TYPES.DIGITAL_TO_ANALOG]: "Bekijk de digitale klok en kies de analoge klok",
};

const generateExercise = (level, enabledTypes) => {
  const types = enabledTypes.length > 0 ? enabledTypes : Object.values(EXERCISE_TYPES);
  const type = types[randInt(0, types.length - 1)];
  const time = generateTime(level);
  const distractors = generateDistractors(time.h, time.m, level, 3);
  const allOptions = shuffle([time, ...distractors]);
  const correctIndex = allOptions.findIndex((o) => o.h === time.h && o.m === time.m);

  return { type, time, options: allOptions, correctIndex };
};

// ========== LEVEL INFO ==========
const LEVEL_INFO = [
  { level: 1, name: "Hele uren", desc: "drie uur, zeven uur...", emoji: "⭐" },
  { level: 2, name: "Kwartieren", desc: "kwart over, half, kwart voor", emoji: "⭐⭐" },
  { level: 3, name: "5 minuten", desc: "vijf over, tien voor half...", emoji: "⭐⭐⭐" },
  { level: 4, name: "Alles!", desc: "Alle tijden door elkaar", emoji: "🌟" },
];

// ========== CONFETTI ==========
const Confetti = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 30 }, (_, i) => {
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8"];
    const color = colors[i % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 6 + Math.random() * 8;
    const duration = 1 + Math.random() * 1.5;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${left}%`,
          top: -10,
          width: size,
          height: size,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          background: color,
          animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
          opacity: 0,
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      />
    );
  });
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 50 }}>{particles}</div>;
};

// ========== MAIN APP ==========
const SCREENS = { SETUP: "setup", EXERCISE: "exercise", RESULTS: "results" };

export default function KlokkijkenApp() {
  const [screen, setScreen] = useState(SCREENS.SETUP);
  const [level, setLevel] = useState(2);
  const [enabledTypes, setEnabledTypes] = useState(Object.values(EXERCISE_TYPES));
  const [exercise, setExercise] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);

  const nextExercise = useCallback(() => {
    setExercise(generateExercise(level, enabledTypes));
    setSelected(null);
    setShowResult(false);
    setShowConfetti(false);
  }, [level, enabledTypes]);

  const startSession = () => {
    setScore(0);
    setTotal(0);
    setStreak(0);
    setBestStreak(0);
    setExerciseHistory([]);
    setScreen(SCREENS.EXERCISE);
    setExercise(generateExercise(level, enabledTypes));
    setSelected(null);
    setShowResult(false);
  };

  const handleAnswer = (idx) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    const correct = idx === exercise.correctIndex;
    const newTotal = total + 1;
    const newScore = correct ? score + 1 : score;
    const newStreak = correct ? streak + 1 : 0;
    setTotal(newTotal);
    setScore(newScore);
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);
    if (correct) setShowConfetti(true);
    setExerciseHistory((prev) => [...prev, {
      type: exercise.type,
      time: exercise.time,
      correct,
      selected: exercise.options[idx],
    }]);
  };

  const toggleExerciseType = (type) => {
    setEnabledTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // ========== RENDER HELPERS ==========
  const renderOptionContent = (opt, type, size = 140) => {
    switch (type) {
      case EXERCISE_TYPES.ANALOG_TO_TEXT:
      case EXERCISE_TYPES.DIGITAL_TO_TEXT:
        return (
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 500, color: "#4a3728", textAlign: "center" }}>
            {dutchTimeText(opt.h, opt.m)}
          </span>
        );
      case EXERCISE_TYPES.TEXT_TO_ANALOG:
      case EXERCISE_TYPES.DIGITAL_TO_ANALOG:
        return <AnalogClock hours={opt.h} minutes={opt.m} size={size} />;
      case EXERCISE_TYPES.TEXT_TO_DIGITAL:
      case EXERCISE_TYPES.ANALOG_TO_DIGITAL:
        return <DigitalClock hours={opt.h} minutes={opt.m} size={size * 0.7} />;
      default:
        return null;
    }
  };

  const renderPrompt = (ex) => {
    const { type, time } = ex;
    const text = dutchTimeText(time.h, time.m);
    switch (type) {
      case EXERCISE_TYPES.ANALOG_TO_TEXT:
      case EXERCISE_TYPES.ANALOG_TO_DIGITAL:
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: "#8a7968", fontWeight: 500 }}>
              Hoe laat is het?
            </span>
            <AnalogClock hours={time.h} minutes={time.m} size={200} />
          </div>
        );
      case EXERCISE_TYPES.DIGITAL_TO_TEXT:
      case EXERCISE_TYPES.DIGITAL_TO_ANALOG:
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: "#8a7968", fontWeight: 500 }}>
              Hoe laat is het?
            </span>
            <DigitalClock hours={time.h} minutes={time.m} size={200} />
          </div>
        );
      case EXERCISE_TYPES.TEXT_TO_ANALOG:
      case EXERCISE_TYPES.TEXT_TO_DIGITAL:
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: "#8a7968", fontWeight: 500 }}>
              Welke klok hoort bij:
            </span>
            <div style={{
              background: "linear-gradient(135deg, #fff9e6, #fff3cc)",
              borderRadius: 16,
              padding: "16px 32px",
              border: "2px solid #f0d890",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <span style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 26,
                fontWeight: 600,
                color: "#4a3728",
              }}>
                {text}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ========== SETUP SCREEN ==========
  if (screen === SCREENS.SETUP) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fef9ef 0%, #fdf0d5 30%, #f5e6c8 100%)",
        fontFamily: "'Fredoka', 'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
          @keyframes confettiFall {
            0% { opacity: 1; transform: translateY(0) rotate(0deg); }
            100% { opacity: 0; transform: translateY(400px) rotate(720deg); }
          }
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "bounceIn 0.6s ease-out" }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>🕐</div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: "#4a3728",
            textShadow: "0 2px 4px rgba(0,0,0,0.06)",
            margin: 0, lineHeight: 1.1,
          }}>
            Klokkijken!
          </h1>
          <p style={{ fontSize: 16, color: "#8a7968", marginTop: 6, fontWeight: 400 }}>
            Hoi Nayra! Leer de klok lezen in het Nederlands 🇳🇱
          </p>
        </div>

        {/* Level Selection */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: "rgba(255,255,255,0.8)",
          borderRadius: 20, padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          marginBottom: 20,
          backdropFilter: "blur(10px)",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#4a3728", marginBottom: 14 }}>
            📊 Kies je niveau
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEVEL_INFO.map((l) => (
              <button
                key={l.level}
                onClick={() => setLevel(l.level)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: level === l.level ? "2.5px solid #e8a838" : "2px solid #e8dcc8",
                  background: level === l.level
                    ? "linear-gradient(135deg, #fff9e6, #fff3cc)"
                    : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                  boxShadow: level === l.level ? "0 2px 10px rgba(232,168,56,0.2)" : "none",
                }}
              >
                <span style={{ fontSize: 20, minWidth: 50 }}>{l.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#4a3728", fontFamily: "'Fredoka', sans-serif" }}>
                    Niveau {l.level}: {l.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#8a7968", fontFamily: "'Fredoka', sans-serif" }}>
                    {l.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Types */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: "rgba(255,255,255,0.8)",
          borderRadius: 20, padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          marginBottom: 24,
          backdropFilter: "blur(10px)",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#4a3728", marginBottom: 14 }}>
            🎯 Soorten oefeningen
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.values(EXERCISE_TYPES).map((type) => {
              const active = enabledTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleExerciseType(type)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: active ? "2.5px solid #6bcb77" : "2px solid #e8dcc8",
                    background: active ? "linear-gradient(135deg, #eafbe7, #d4f5d0)" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "#2d7a3a" : "#8a7968",
                    textAlign: "center",
                  }}
                >
                  {active ? "✅ " : ""}
                  {EXERCISE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startSession}
          style={{
            padding: "16px 56px",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "'Fredoka', sans-serif",
            color: "white",
            background: "linear-gradient(135deg, #e8a838, #e07b28)",
            border: "none",
            borderRadius: 50,
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(232,168,56,0.4)",
            transition: "all 0.2s",
            animation: "pulse 2s ease-in-out infinite",
          }}
          onMouseOver={(e) => { e.target.style.transform = "scale(1.05)"; }}
          onMouseOut={(e) => { e.target.style.transform = "scale(1)"; }}
        >
          🚀 Start!
        </button>
      </div>
    );
  }

  // ========== RESULTS SCREEN ==========
  if (screen === SCREENS.RESULTS) {
    const emoji = percentage >= 90 ? "🏆" : percentage >= 70 ? "🎉" : percentage >= 50 ? "👍" : "💪";
    const message = percentage >= 90
      ? "Fantastisch, Nayra! Je bent een klokkampioen!"
      : percentage >= 70
      ? "Heel goed gedaan! Blijf oefenen!"
      : percentage >= 50
      ? "Goed bezig! Je wordt steeds beter!"
      : "Niet opgeven! Oefening baart kunst!";

    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fef9ef 0%, #fdf0d5 30%, #f5e6c8 100%)",
        fontFamily: "'Fredoka', 'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
          @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>

        <div style={{ animation: "bounceIn 0.6s ease-out", textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{emoji}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#4a3728", marginBottom: 8 }}>
            {message}
          </h1>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.85)",
          borderRadius: 24, padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          maxWidth: 400, width: "100%",
          textAlign: "center",
          animation: "slideUp 0.5s ease-out 0.2s both",
        }}>
          <div style={{
            fontSize: 56, fontWeight: 700, color: "#e8a838", marginBottom: 4,
          }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 18, color: "#8a7968", marginBottom: 20 }}>
            {percentage}% goed
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            padding: "16px 0",
            borderTop: "1px solid #e8dcc8",
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#6bcb77" }}>🔥 {bestStreak}</div>
              <div style={{ fontSize: 13, color: "#8a7968" }}>Beste reeks</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#4a3728" }}>📊 {LEVEL_INFO[level - 1].name}</div>
              <div style={{ fontSize: 13, color: "#8a7968" }}>Niveau</div>
            </div>
          </div>

          {/* Mistakes review */}
          {exerciseHistory.filter((e) => !e.correct).length > 0 && (
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#c0392b", marginBottom: 8 }}>
                ❌ Even herhalen:
              </div>
              {exerciseHistory.filter((e) => !e.correct).map((e, i) => (
                <div key={i} style={{
                  background: "#fff5f5", borderRadius: 10, padding: "8px 12px",
                  marginBottom: 6, fontSize: 14, color: "#4a3728",
                  border: "1px solid #fecaca",
                }}>
                  {dutchTimeText(e.time.h, e.time.m)} = {e.time.h % 12 || 12}:{e.time.m.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <button
            onClick={startSession}
            style={{
              padding: "14px 36px", fontSize: 18, fontWeight: 600,
              fontFamily: "'Fredoka', sans-serif", color: "white",
              background: "linear-gradient(135deg, #e8a838, #e07b28)",
              border: "none", borderRadius: 50, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232,168,56,0.3)",
            }}
          >
            🔄 Opnieuw
          </button>
          <button
            onClick={() => setScreen(SCREENS.SETUP)}
            style={{
              padding: "14px 36px", fontSize: 18, fontWeight: 600,
              fontFamily: "'Fredoka', sans-serif", color: "#4a3728",
              background: "white",
              border: "2px solid #e8dcc8", borderRadius: 50, cursor: "pointer",
            }}
          >
            ⚙️ Instellingen
          </button>
        </div>
      </div>
    );
  }

  // ========== EXERCISE SCREEN ==========
  if (!exercise) return null;

  const isClockOption = [
    EXERCISE_TYPES.TEXT_TO_ANALOG,
    EXERCISE_TYPES.TEXT_TO_DIGITAL,
    EXERCISE_TYPES.DIGITAL_TO_ANALOG,
    EXERCISE_TYPES.ANALOG_TO_DIGITAL,
  ].includes(exercise.type);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fef9ef 0%, #fdf0d5 30%, #f5e6c8 100%)",
      fontFamily: "'Fredoka', 'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
        @keyframes confettiFall { 0% { opacity: 1; transform: translateY(0) rotate(0deg); } 100% { opacity: 0; transform: translateY(400px) rotate(720deg); } }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <Confetti active={showConfetti} />

      {/* Top bar */}
      <div style={{
        width: "100%", maxWidth: 560,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, padding: "0 4px",
      }}>
        <button
          onClick={() => {
            if (total > 0) setScreen(SCREENS.RESULTS);
            else setScreen(SCREENS.SETUP);
          }}
          style={{
            padding: "8px 16px", borderRadius: 12,
            border: "2px solid #e8dcc8", background: "white",
            cursor: "pointer", fontFamily: "'Fredoka', sans-serif",
            fontSize: 14, fontWeight: 500, color: "#8a7968",
          }}
        >
          {total > 0 ? "🏁 Stop" : "← Terug"}
        </button>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            background: "white", borderRadius: 12, padding: "6px 14px",
            border: "2px solid #e8dcc8", fontSize: 15, fontWeight: 600, color: "#4a3728",
          }}>
            ✅ {score}/{total}
          </div>
          {streak >= 2 && (
            <div style={{
              background: "linear-gradient(135deg, #fff3cc, #ffe0a0)",
              borderRadius: 12, padding: "6px 14px",
              border: "2px solid #f0d890", fontSize: 15, fontWeight: 600, color: "#c67c00",
              animation: "bounceIn 0.3s ease-out",
            }}>
              🔥 {streak}
            </div>
          )}
        </div>
      </div>

      {/* Exercise type label */}
      <div style={{
        fontSize: 13, color: "#8a7968", marginBottom: 8,
        fontWeight: 500, letterSpacing: 0.5,
      }}>
        {EXERCISE_DESCRIPTIONS[exercise.type]}
      </div>

      {/* Prompt */}
      <div style={{
        marginBottom: 24,
        animation: "slideUp 0.4s ease-out",
      }}>
        {renderPrompt(exercise)}
      </div>

      {/* Options */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isClockOption ? "1fr 1fr" : "1fr",
        gap: isClockOption ? 12 : 10,
        width: "100%",
        maxWidth: isClockOption ? 480 : 400,
      }}>
        {exercise.options.map((opt, idx) => {
          const isCorrect = idx === exercise.correctIndex;
          const isSelected = idx === selected;
          let borderColor = "#e8dcc8";
          let bg = "white";
          let shadow = "0 2px 8px rgba(0,0,0,0.04)";

          if (showResult) {
            if (isCorrect) {
              borderColor = "#6bcb77";
              bg = "linear-gradient(135deg, #eafbe7, #d4f5d0)";
              shadow = "0 2px 12px rgba(107,203,119,0.3)";
            } else if (isSelected && !isCorrect) {
              borderColor = "#e74c3c";
              bg = "linear-gradient(135deg, #fff5f5, #fee)";
              shadow = "0 2px 12px rgba(231,76,60,0.2)";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              style={{
                padding: isClockOption ? "12px" : "14px 20px",
                borderRadius: 16,
                border: `2.5px solid ${borderColor}`,
                background: bg,
                cursor: showResult ? "default" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: shadow,
                animation: showResult && isSelected && !isCorrect ? "shake 0.4s ease-out" : undefined,
                minHeight: isClockOption ? undefined : 48,
              }}
              onMouseOver={(e) => {
                if (!showResult) e.currentTarget.style.borderColor = "#e8a838";
              }}
              onMouseOut={(e) => {
                if (!showResult) e.currentTarget.style.borderColor = borderColor;
              }}
            >
              {renderOptionContent(opt, exercise.type, isClockOption ? 120 : 140)}
            </button>
          );
        })}
      </div>

      {/* Feedback & Next */}
      {showResult && (
        <div style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          animation: "slideUp 0.3s ease-out",
        }}>
          {selected === exercise.correctIndex ? (
            <div style={{
              fontSize: 20, fontWeight: 600, color: "#2d7a3a",
            }}>
              {["Goed zo! 🎉", "Uitstekend! ⭐", "Super! 🌟", "Perfect! 💫", "Top! 🏆"][randInt(0, 4)]}
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#c0392b", marginBottom: 4 }}>
                Helaas! 😊
              </div>
              <div style={{ fontSize: 15, color: "#4a3728" }}>
                Het goede antwoord is: <strong>{dutchTimeText(exercise.time.h, exercise.time.m)}</strong>
                {" "}({exercise.time.h % 12 || 12}:{exercise.time.m.toString().padStart(2, "0")})
              </div>
            </div>
          )}
          <button
            onClick={nextExercise}
            style={{
              padding: "12px 40px",
              fontSize: 17,
              fontWeight: 600,
              fontFamily: "'Fredoka', sans-serif",
              color: "white",
              background: "linear-gradient(135deg, #e8a838, #e07b28)",
              border: "none",
              borderRadius: 50,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232,168,56,0.3)",
            }}
          >
            Volgende →
          </button>
        </div>
      )}
    </div>
  );
}
