import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════
   CONFIG — Kuba: zmień te wartości
   ═══════════════════════════════════════════ */
const PHONE = "48000000000"; // ← WSTAW NUMER KINGI (format: 48XXXXXXXXX)
const AVAILABLE_DAYS = [2, 3, 4, 5, 6]; // 2=wt, 3=śr, 4=czw, 5=pt, 6=sob
const START_HOUR = 10;
const END_HOUR = 19; // ostatni slot
const DAY_NAMES = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_NAMES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

/* ═══════════════════════════════════════════
   DATA — Usługi w 3 poziomach (Good-Better-Best)
   Checklist: "3 pakiety", "środkowy = polecany"
   ═══════════════════════════════════════════ */
const TIERS = [
  {
    id: 1, name: "Stylizacja", tag: null,
    desc: "Pojedyncza usługa na dłonie lub stopy",
    color: "#fdf2f8",
    services: [
      { id: "s1", name: "Hybryda dłonie", price: 60, duration: "~1h" },
      { id: "s2", name: "Hybryda stopy", price: 70, duration: "~1h" },
      { id: "s3", name: "Przedłużanie żelowe", price: 80, duration: "~1.5h" },
      { id: "s4", name: "Uzupełnianie", price: 70, duration: "~1h" },
    ],
  },
  {
    id: 2, name: "Stylizacja + Relaks", tag: "Polecany ⭐",
    desc: "Usługa + zabieg parafinowy dla pięknych dłoni",
    color: "#ffe4e6",
    services: [
      { id: "s5", name: "Hybryda + parafina dłonie", price: 90, duration: "~1.5h" },
      { id: "s6", name: "Przedłużanie + parafina", price: 110, duration: "~2h" },
      { id: "s7", name: "Hybryda stopy + parafina", price: 100, duration: "~1.5h" },
      { id: "s8", name: "Pedicure komplet + parafina", price: 115, duration: "~1.5h" },
    ],
  },
  {
    id: 3, name: "Kompletna Pielęgnacja", tag: "Najlepsza wartość",
    desc: "Dłonie + stopy w jednej wizycie",
    color: "#fdf2f8",
    services: [
      { id: "s9", name: "Hybryda dłonie + stopy", price: 120, duration: "~2h" },
      { id: "s10", name: "Hybryda dłonie + stopy + podeszwy", price: 145, duration: "~2.5h" },
      { id: "s11", name: "Przedłużanie + hybryda stopy", price: 140, duration: "~2.5h" },
      { id: "s12", name: "Przedłużanie + hybryda stopy + podeszwy", price: 155, duration: "~2.5h" },
    ],
  },
];

const EXTRAS = [
  { name: "Naprawa paznokcia", price: 8 },
  { name: "Ściąganie po innej stylistce", price: 0, note: "GRATIS przy nowej stylizacji!" },
  { name: "French", price: 5 },
  { name: "Cyrkonie", price: "3/szt." },
  { name: "Wzorki małe", price: 8 },
  { name: "Wzorki duże", price: 15 },
];

const FAQS = [
  { q: "Czy to bezpieczne? Jak wygląda higiena?", a: "Stosuję autoklaw do sterylizacji narzędzi, jednorazowe pilniki i dezynfekcję stanowiska po każdej klientce. Twoje bezpieczeństwo to mój priorytet." },
  { q: "Mam hybrydę po innej stylistce — ile za ściąganie?", a: "Przy nowej stylizacji — ściąganie GRATIS! Bez nowej usługi: 10 zł. Dla porównania: inne salony w okolicy biorą za to 30-50 zł." },
  { q: "Gdzie dokładnie jest salon?", a: "Skulsk — dokładny adres podam po potwierdzeniu rezerwacji na WhatsApp." },
  { q: "Jak długo trwa zabieg?", a: "Hybryda: ok. 1-1.5h. Przedłużanie: ok. 1.5-2h. Pakiety: 1.5-2.5h. Nie śpieszę się — wolę zrobić dokładnie." },
  { q: "Mogę odwołać lub przesunąć wizytę?", a: "Tak — wystarczy napisać na WhatsApp minimum 24h przed terminem." },
  { q: "Dlaczego nie ma Cię na Booksy?", a: "Jeszcze nie — ale możesz zarezerwować tutaj tak samo wygodnie. Dostajesz potwierdzenie od razu na WhatsApp." },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function getNext14Days() {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 21; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (AVAILABLE_DAYS.includes(d.getDay())) {
      days.push(d);
      if (days.length >= 14) break;
    }
  }
  return days;
}

function formatDate(d) {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getTimeSlots() {
  return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
    const h = START_HOUR + i;
    return `${String(h).padStart(2, "0")}:00`;
  });
}

function buildWhatsAppURL(service, date, time, name, phone) {
  const msg = `Nowa rezerwacja 💅\n\nImię: ${name}\nTelefon: ${phone}\nUsługa: ${service.name} (od ${service.price} zł)\nData: ${formatDate(date)} (${DAY_NAMES[date.getDay()]})\nGodzina: ${time}\n\nProszę o potwierdzenie 😊`;
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}

/* ═══════════════════════════════════════════
   STYLES (CSS-in-JS for artifact)
   ═══════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  :root {
    --rose-50: #fff1f2;
    --rose-100: #ffe4e6;
    --rose-200: #fecdd3;
    --rose-300: #fda4af;
    --rose-400: #fb7185;
    --rose-500: #f43f5e;
    --rose-600: #e11d48;
    --rose-700: #be123c;
    --gray-50: #fafafa;
    --gray-100: #f4f4f5;
    --gray-200: #e4e4e7;
    --gray-400: #a1a1aa;
    --gray-500: #71717a;
    --gray-600: #52525b;
    --gray-700: #3f3f46;
    --gray-800: #27272a;
    --gray-900: #18181b;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
  }
  
  .page { font-family: var(--font-body); color: var(--gray-800); line-height: 1.6; background: #fff; max-width: 480px; margin: 0 auto; overflow-x: hidden; }
  
  /* Sticky CTA — Von Restorff: kontrastowy kolor */
  .sticky-cta { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rose-100); padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
  .sticky-cta .logo { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--gray-800); }
  .sticky-cta .cta-sm { background: var(--rose-500); color: white; border: none; padding: 8px 18px; border-radius: 24px; font-family: var(--font-body); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; }
  .sticky-cta .cta-sm:hover { background: var(--rose-600); transform: scale(1.03); }
  
  /* Hero */
  .hero { padding: 48px 24px 40px; text-align: center; background: linear-gradient(180deg, var(--rose-50) 0%, #fff 100%); }
  .hero h1 { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.2; color: var(--gray-900); margin-bottom: 12px; }
  .hero h1 em { font-style: normal; color: var(--rose-500); }
  .hero .sub { font-size: 16px; color: var(--gray-600); margin-bottom: 24px; max-width: 340px; margin-left: auto; margin-right: auto; }
  .hero .cta-big { display: inline-block; background: var(--rose-500); color: white; border: none; padding: 14px 36px; border-radius: 32px; font-family: var(--font-body); font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(244,63,94,0.3); }
  .hero .cta-big:hover { background: var(--rose-600); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(244,63,94,0.4); }
  
  /* Social proof bar */
  .proof-bar { display: flex; justify-content: center; gap: 32px; padding: 20px 24px; background: var(--gray-50); border-top: 1px solid var(--gray-100); border-bottom: 1px solid var(--gray-100); }
  .proof-item { text-align: center; }
  .proof-item .num { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--rose-500); }
  .proof-item .label { font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  
  /* Sections */
  .section { padding: 48px 24px; }
  .section-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; text-align: center; margin-bottom: 8px; color: var(--gray-900); }
  .section-sub { text-align: center; color: var(--gray-500); font-size: 14px; margin-bottom: 32px; }
  
  /* Tier cards — Checklist: "Środkowy pakiet wyróżniony" */
  .tier-card { border-radius: 16px; padding: 24px; margin-bottom: 16px; border: 2px solid transparent; transition: all 0.2s; cursor: pointer; position: relative; }
  .tier-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
  .tier-card.featured { border-color: var(--rose-400); box-shadow: 0 8px 32px rgba(244,63,94,0.12); }
  .tier-tag { position: absolute; top: -12px; left: 24px; background: var(--rose-500); color: white; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; }
  .tier-name { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .tier-desc { font-size: 13px; color: var(--gray-500); margin-bottom: 16px; }
  .tier-services { list-style: none; }
  .tier-service { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .tier-service:last-child { border-bottom: none; }
  .tier-service .sname { font-size: 14px; font-weight: 500; }
  .tier-service .sdur { font-size: 11px; color: var(--gray-400); }
  .tier-service .sprice { font-weight: 700; color: var(--rose-600); font-size: 15px; white-space: nowrap; }
  .tier-service .sprice span { font-size: 11px; font-weight: 400; color: var(--gray-400); }
  
  .tier-cta { display: block; width: 100%; margin-top: 16px; padding: 12px; border-radius: 12px; border: 2px solid var(--rose-300); background: transparent; color: var(--rose-600); font-family: var(--font-body); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; }
  .tier-cta:hover, .tier-card.featured .tier-cta { background: var(--rose-500); color: white; border-color: var(--rose-500); }
  
  /* Extras */
  .extras-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 24px; }
  .extra-chip { background: var(--gray-50); border-radius: 10px; padding: 10px 14px; font-size: 13px; }
  .extra-chip .xprice { font-weight: 700; color: var(--rose-500); }
  .extra-chip .xfree { color: #16a34a; font-weight: 700; font-size: 12px; }
  
  /* About */
  .about-section { background: var(--rose-50); }
  .about-content { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .about-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--rose-200); display: flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 16px; }
  .about-text { font-size: 15px; color: var(--gray-600); max-width: 360px; }
  .about-badges { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
  .about-badge { background: white; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 600; color: var(--gray-700); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  
  /* FAQ — Checklist: "FAQ strategicznie przed CTA" */
  .faq-item { border-bottom: 1px solid var(--gray-100); }
  .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; cursor: pointer; font-weight: 600; font-size: 15px; color: var(--gray-800); }
  .faq-q .arrow { transition: transform 0.2s; font-size: 18px; color: var(--gray-400); }
  .faq-q .arrow.open { transform: rotate(180deg); }
  .faq-a { padding: 0 0 16px; font-size: 14px; color: var(--gray-600); line-height: 1.6; }
  
  /* Free removal banner — Checklist: "Loss aversion" */
  .promo-banner { background: linear-gradient(135deg, var(--rose-500), var(--rose-600)); color: white; padding: 20px 24px; text-align: center; border-radius: 16px; margin: 0 24px 32px; }
  .promo-banner .promo-big { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .promo-banner .promo-small { font-size: 13px; opacity: 0.9; }
  
  /* Booking flow — Checklist: "Pasek postępu (Zeigarnik)" */
  .booking { padding: 48px 24px; background: var(--gray-50); }
  .progress { display: flex; gap: 4px; margin-bottom: 32px; }
  .progress-dot { flex: 1; height: 4px; border-radius: 2px; background: var(--gray-200); transition: background 0.3s; }
  .progress-dot.active { background: var(--rose-500); }
  
  .step-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .step-sub { font-size: 13px; color: var(--gray-500); margin-bottom: 20px; }
  
  /* Date picker */
  .dates { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
  .dates::-webkit-scrollbar { display: none; }
  .date-btn { flex-shrink: 0; width: 64px; padding: 12px 8px; border-radius: 12px; border: 2px solid var(--gray-200); background: white; cursor: pointer; text-align: center; transition: all 0.2s; }
  .date-btn:hover { border-color: var(--rose-300); }
  .date-btn.selected { border-color: var(--rose-500); background: var(--rose-50); }
  .date-btn .dday { font-size: 11px; color: var(--gray-400); font-weight: 600; text-transform: uppercase; }
  .date-btn .dnum { font-size: 20px; font-weight: 700; color: var(--gray-800); margin: 2px 0; }
  .date-btn .dmon { font-size: 11px; color: var(--gray-500); }
  .date-btn.selected .dday, .date-btn.selected .dnum, .date-btn.selected .dmon { color: var(--rose-600); }
  
  /* Time slots */
  .times { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .time-btn { padding: 12px; border-radius: 10px; border: 2px solid var(--gray-200); background: white; cursor: pointer; font-family: var(--font-body); font-weight: 600; font-size: 15px; text-align: center; transition: all 0.15s; }
  .time-btn:hover { border-color: var(--rose-300); }
  .time-btn.selected { border-color: var(--rose-500); background: var(--rose-50); color: var(--rose-600); }
  .time-btn.booked { background: var(--gray-100); color: var(--gray-400); border-color: var(--gray-100); cursor: not-allowed; text-decoration: line-through; }
  
  /* Service selector in booking */
  .svc-option { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 12px; border: 2px solid var(--gray-200); background: white; cursor: pointer; margin-bottom: 8px; transition: all 0.15s; }
  .svc-option:hover { border-color: var(--rose-300); }
  .svc-option.selected { border-color: var(--rose-500); background: var(--rose-50); }
  .svc-option .svc-name { font-weight: 600; font-size: 14px; }
  .svc-option .svc-meta { font-size: 12px; color: var(--gray-500); margin-top: 2px; }
  .svc-option .svc-price { font-weight: 700; color: var(--rose-600); font-size: 15px; white-space: nowrap; }
  
  /* Form */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; }
  .form-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 2px solid var(--gray-200); font-family: var(--font-body); font-size: 15px; transition: border-color 0.2s; outline: none; }
  .form-input:focus { border-color: var(--rose-400); }
  
  .book-btn { display: block; width: 100%; padding: 16px; border-radius: 16px; border: none; background: var(--rose-500); color: white; font-family: var(--font-body); font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(244,63,94,0.3); }
  .book-btn:hover { background: var(--rose-600); transform: translateY(-1px); }
  .book-btn:disabled { background: var(--gray-300); box-shadow: none; cursor: not-allowed; transform: none; }
  
  /* Summary card */
  .summary { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .summary-row .sl { color: var(--gray-500); }
  .summary-row .sv { font-weight: 600; }
  
  /* Confirmation */
  .confirm { text-align: center; padding: 40px 24px; }
  .confirm .check { font-size: 64px; margin-bottom: 16px; }
  .confirm h2 { font-family: var(--font-display); font-size: 24px; margin-bottom: 8px; }
  .confirm p { color: var(--gray-600); font-size: 14px; margin-bottom: 24px; }
  .wa-btn { display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 14px 28px; border-radius: 16px; border: none; font-family: var(--font-body); font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
  .wa-btn:hover { background: #1fba59; transform: translateY(-1px); }
  
  .back-btn { display: inline-block; margin-top: 12px; background: none; border: none; color: var(--gray-500); font-size: 13px; cursor: pointer; font-family: var(--font-body); }
  .back-btn:hover { color: var(--gray-700); }
  
  /* Guarantee — Checklist: "Gwarancja przy cenie" */
  .guarantee { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
  .guarantee .g-icon { font-size: 24px; }
  .guarantee .g-text { font-size: 13px; color: #166534; line-height: 1.4; }
  
  /* Footer */
  .footer { padding: 32px 24px; text-align: center; border-top: 1px solid var(--gray-100); }
  .footer p { font-size: 12px; color: var(--gray-400); }
  .footer a { color: var(--rose-500); text-decoration: none; }

  /* Scarcity tag */
  .scarcity { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
`;

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function KingaBooking() {
  // Booking flow state
  const [step, setStep] = useState(0); // 0=browse, 1=service, 2=date, 3=time, 4=form, 5=confirm
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [faqOpen, setFaqOpen] = useState(-1);
  const [bookedSlots, setBookedSlots] = useState({});
  const bookingRef = useRef(null);
  const allServices = TIERS.flatMap(t => t.services.map(s => ({ ...s, tierName: t.name })));

  // Load booked slots from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.list("booking:");
        if (result && result.keys) {
          const slots = {};
          for (const key of result.keys) {
            try {
              const r = await window.storage.get(key);
              if (r) slots[key] = JSON.parse(r.value);
            } catch {}
          }
          setBookedSlots(slots);
        }
      } catch {}
    })();
  }, []);

  const scrollToBooking = () => {
    if (step === 0) setStep(1);
    setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const selectServiceAndGo = (service) => {
    setSelectedService(service);
    setStep(2);
    setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const isSlotBooked = (date, time) => {
    const key = `booking:${dateKey(date)}:${time}`;
    return !!bookedSlots[key];
  };

  const confirmBooking = async () => {
    // Save to storage
    const key = `booking:${dateKey(selectedDate)}:${selectedTime}`;
    const data = { name, phone, service: selectedService.name, price: selectedService.price, date: dateKey(selectedDate), time: selectedTime, created: new Date().toISOString() };
    try {
      await window.storage.set(key, JSON.stringify(data));
      setBookedSlots(prev => ({ ...prev, [key]: data }));
    } catch {}
    setStep(5);
  };

  const resetBooking = () => {
    setStep(0); setSelectedService(null); setSelectedDate(null);
    setSelectedTime(null); setName(""); setPhone("");
  };

  const dates = getNext14Days();
  const times = getTimeSlots();
  const progressSteps = 4;
  const currentProgress = step >= 1 ? Math.min(step - 1, progressSteps - 1) : -1;

  return (
    <div className="page">
      <style>{css}</style>

      {/* ── Sticky header — Checklist: "CTA widoczne w nagłówku" ── */}
      <div className="sticky-cta">
        <div className="logo">Kinga Nails</div>
        <button className="cta-sm" onClick={scrollToBooking}>Zarezerwuj</button>
      </div>

      {/* ── Hero — Checklist: "Headline skupiony na korzyści" ── */}
      <div className="hero">
        <h1>Piękne paznokcie<br />w <em>Skulsku</em></h1>
        <p className="sub">Stylizacja z sercem i precyzją. Hybryda od 60 zł, przedłużanie od 80 zł. Bez kolejek, wygodne terminy.</p>
        <button className="cta-big" onClick={scrollToBooking}>Umów się na wizytę →</button>
      </div>

      {/* ── Social proof — Checklist: "Przedstaw konkretne liczby" ── */}
      <div className="proof-bar">
        <div className="proof-item">
          <div className="num">60+</div>
          <div className="label">Realizacji</div>
        </div>
        <div className="proof-item">
          <div className="num">4</div>
          <div className="label">Szkolenia</div>
        </div>
        <div className="proof-item">
          <div className="num">5 lat</div>
          <div className="label">Doświadczenia</div>
        </div>
      </div>

      {/* ── Promo banner — Checklist: "Loss aversion" ── */}
      <div style={{ padding: "24px 0 0" }}>
        <div className="promo-banner">
          <div className="promo-big">Ściąganie hybrydy GRATIS 💅</div>
          <div className="promo-small">Przy nowej stylizacji — nie przepłacaj 50 zł u konkurencji</div>
        </div>
      </div>

      {/* ── Services — Checklist: "3 pakiety, środkowy wyróżniony" ── */}
      <div className="section">
        <div className="section-title">Usługi i cennik</div>
        <div className="section-sub">Ceny orientacyjne — dokładna cena zależy od złożoności zdobienia</div>

        {TIERS.map(tier => (
          <div key={tier.id} className={`tier-card ${tier.id === 2 ? "featured" : ""}`} style={{ background: tier.color }}>
            {tier.tag && <div className="tier-tag">{tier.tag}</div>}
            <div className="tier-name">{tier.name}</div>
            <div className="tier-desc">{tier.desc}</div>
            <ul className="tier-services">
              {tier.services.map(s => (
                <li key={s.id} className="tier-service">
                  <div>
                    <div className="sname">{s.name}</div>
                    <div className="sdur">{s.duration}</div>
                  </div>
                  <div className="sprice">od {s.price} zł</div>
                </li>
              ))}
            </ul>
            <button className="tier-cta" onClick={() => { setStep(1); setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}>
              Wybierz i zarezerwuj →
            </button>
          </div>
        ))}

        {/* Extras */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Dodatki</div>
          <div className="extras-grid">
            {EXTRAS.map((e, i) => (
              <div key={i} className="extra-chip">
                <div style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</div>
                {e.price === 0 ? (
                  <div className="xfree">{e.note}</div>
                ) : (
                  <div className="xprice">od {e.price} zł</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── About — Checklist: "Osobiste doświadczenie buduje wiarygodność" ── */}
      <div className="section about-section">
        <div className="about-content">
          <div className="about-avatar">💅</div>
          <div className="section-title" style={{ marginBottom: 12 }}>Cześć, jestem Kinga!</div>
          <div className="about-text">
            Mam 19 lat i paznokciami zajmuję się od 5 lat. Ukończyłam 4 profesjonalne szkolenia. Każda stylizacja to dla mnie szansa, by stworzyć coś wyjątkowego. Stawiam na precyzję, higienę i modne wzory, które zobaczysz na Pinterest i TikToku.
          </div>
          <div className="about-badges">
            <div className="about-badge">🎓 4 szkolenia</div>
            <div className="about-badge">🔬 Autoklaw</div>
            <div className="about-badge">📍 Skulsk</div>
            <div className="about-badge">💕 60+ realizacji</div>
          </div>
        </div>
      </div>

      {/* ── FAQ — Checklist: "FAQ strategicznie przed CTA" ── */}
      <div className="section">
        <div className="section-title">Najczęstsze pytania</div>
        <div className="section-sub">Wszystko, co chcesz wiedzieć przed wizytą</div>
        {FAQS.map((f, i) => (
          <div key={i} className="faq-item">
            <div className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
              <span>{f.q}</span>
              <span className={`arrow ${faqOpen === i ? "open" : ""}`}>▼</span>
            </div>
            {faqOpen === i && <div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </div>

      {/* ── Booking flow — Checklist: "Pasek postępu (Zeigarnik)", "Minimalizacja pól", "CTA kontekstowe" ── */}
      <div className="booking" ref={bookingRef}>
        {step < 5 && step >= 1 && (
          <>
            <div className="progress">
              {Array.from({ length: progressSteps }).map((_, i) => (
                <div key={i} className={`progress-dot ${i <= currentProgress ? "active" : ""}`} />
              ))}
            </div>

            {/* Step 1: Select service */}
            {step === 1 && (
              <div>
                <div className="step-title">Wybierz usługę</div>
                <div className="step-sub">Którą stylizację chcesz?</div>
                {allServices.map(s => (
                  <div key={s.id} className={`svc-option ${selectedService?.id === s.id ? "selected" : ""}`} onClick={() => setSelectedService(s)}>
                    <div>
                      <div className="svc-name">{s.name}</div>
                      <div className="svc-meta">{s.tierName} · {s.duration}</div>
                    </div>
                    <div className="svc-price">od {s.price} zł</div>
                  </div>
                ))}
                <button className="book-btn" disabled={!selectedService} onClick={() => setStep(2)} style={{ marginTop: 16 }}>
                  Dalej — wybierz termin →
                </button>
                <button className="back-btn" onClick={() => setStep(0)}>← Wróć</button>
              </div>
            )}

            {/* Step 2: Select date */}
            {step === 2 && (
              <div>
                <div className="step-title">Wybierz dzień</div>
                <div className="step-sub">Dostępne terminy w najbliższych 2 tygodniach</div>
                <div className="scarcity">⚡ Terminy zapełniają się szybko</div>
                <div className="dates">
                  {dates.map(d => (
                    <button key={d.toISOString()} className={`date-btn ${selectedDate && dateKey(selectedDate) === dateKey(d) ? "selected" : ""}`} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}>
                      <div className="dday">{DAY_NAMES[d.getDay()]}</div>
                      <div className="dnum">{d.getDate()}</div>
                      <div className="dmon">{MONTH_NAMES[d.getMonth()]}</div>
                    </button>
                  ))}
                </div>
                <button className="book-btn" disabled={!selectedDate} onClick={() => setStep(3)} style={{ marginTop: 20 }}>
                  Dalej — wybierz godzinę →
                </button>
                <button className="back-btn" onClick={() => setStep(1)}>← Zmień usługę</button>
              </div>
            )}

            {/* Step 3: Select time */}
            {step === 3 && (
              <div>
                <div className="step-title">Wybierz godzinę</div>
                <div className="step-sub">{DAY_NAMES[selectedDate.getDay()]}, {formatDate(selectedDate)}</div>
                <div className="times">
                  {times.map(t => {
                    const booked = isSlotBooked(selectedDate, t);
                    return (
                      <button key={t} className={`time-btn ${selectedTime === t ? "selected" : ""} ${booked ? "booked" : ""}`} disabled={booked} onClick={() => !booked && setSelectedTime(t)}>
                        {t}
                      </button>
                    );
                  })}
                </div>
                <button className="book-btn" disabled={!selectedTime} onClick={() => setStep(4)} style={{ marginTop: 20 }}>
                  Dalej — Twoje dane →
                </button>
                <button className="back-btn" onClick={() => setStep(2)}>← Zmień dzień</button>
              </div>
            )}

            {/* Step 4: Contact form — Checklist: "Minimalizuj liczbę pól" */}
            {step === 4 && (
              <div>
                <div className="step-title">Prawie gotowe!</div>
                <div className="step-sub">Potrzebuję tylko imienia i numeru telefonu</div>
                
                {/* Summary — Checklist: "Podsumowanie przed finalizacją" */}
                <div className="summary">
                  <div className="summary-row"><span className="sl">Usługa</span><span className="sv">{selectedService.name}</span></div>
                  <div className="summary-row"><span className="sl">Cena</span><span className="sv" style={{ color: "var(--rose-600)" }}>od {selectedService.price} zł</span></div>
                  <div className="summary-row"><span className="sl">Termin</span><span className="sv">{DAY_NAMES[selectedDate.getDay()]}, {formatDate(selectedDate)}</span></div>
                  <div className="summary-row"><span className="sl">Godzina</span><span className="sv">{selectedTime}</span></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Imię</label>
                  <input className="form-input" type="text" placeholder="Twoje imię" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Numer telefonu</label>
                  <input className="form-input" type="tel" placeholder="np. 600 123 456" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                {/* Guarantee — Checklist: "Gwarancja satysfakcji przy cenie" */}
                <div className="guarantee">
                  <div className="g-icon">🛡️</div>
                  <div className="g-text"><strong>Bezpłatne odwołanie</strong> — możesz przesunąć lub odwołać wizytę do 24h przed terminem, bez żadnych kosztów.</div>
                </div>

                <button className="book-btn" disabled={!name.trim() || !phone.trim()} onClick={confirmBooking} style={{ marginTop: 20 }}>
                  Potwierdź rezerwację 💅
                </button>
                <button className="back-btn" onClick={() => setStep(3)}>← Zmień godzinę</button>
              </div>
            )}
          </>
        )}

        {/* Step 5: Confirmation — Checklist: "Peak-End Rule: pozytywne zakończenie" */}
        {step === 5 && (
          <div className="confirm">
            <div className="check">✅</div>
            <h2>Rezerwacja wysłana!</h2>
            <p>
              {name}, Twoja wizyta na <strong>{selectedService.name}</strong> jest zaplanowana na <strong>{DAY_NAMES[selectedDate.getDay()]}, {formatDate(selectedDate)} o {selectedTime}</strong>. 
              <br /><br />Kliknij poniżej, żeby wysłać potwierdzenie do Kingi na WhatsApp — odpisze najszybciej jak może!
            </p>
            <a className="wa-btn" href={buildWhatsAppURL(selectedService, selectedDate, selectedTime, name, phone)} target="_blank" rel="noopener noreferrer">
              💬 Wyślij na WhatsApp
            </a>
            <br />
            <button className="back-btn" onClick={resetBooking} style={{ marginTop: 16 }}>Zarezerwuj kolejną wizytę</button>
          </div>
        )}

        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div className="section-title">Gotowa na nowe paznokcie?</div>
            <div className="section-sub">Rezerwacja zajmuje mniej niż minutę</div>
            <button className="cta-big" onClick={() => setStep(1)} style={{ background: "var(--rose-500)", color: "white", border: "none", padding: "14px 36px", borderRadius: 32, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Zarezerwuj wizytę →
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="footer">
        <p>© 2026 Kinga Nails · Skulsk</p>
        <p style={{ marginTop: 4 }}>
          <a href={`https://instagram.com/kinganails_skulsk`} target="_blank" rel="noopener noreferrer">Instagram</a>
          {" · "}
          <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </p>
      </div>
    </div>
  );
}
