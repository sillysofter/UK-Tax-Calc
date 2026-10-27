// Page rendering and input handling. Depends on js/rates.js and js/calculator.js.
const $ = (id) => document.getElementById(id);
const gbp = (n) => (n < 0 ? "−£" : "£") + Math.round(Math.abs(n)).toLocaleString("en-GB");
const pct = (n, dp = 1) => (isFinite(n) ? (n * 100).toFixed(dp) : "0.0") + "%";
const num = (id) => Math.max(0, parseFloat($(id).value) || 0);

function readInputs() {
  return {
    salary: num("salary"),
    region: $("region").value,
    pensionPct: Math.min(100, num("pension")),
    loan: $("loan").value,
    pgl: $("pgl").checked,
    kids: Math.floor(num("kids")),
    tfcKids: Math.floor(num("tfc")),
    hoursKids: Math.floor(num("hours")),
    hoursVal: num("hoursVal"),
    marriage: $("marriage").checked,
  };
}

function render() {
  const inp = readInputs();
  const r = calc(inp);
  const g = r.gross || 1;

  // Headline
  $("hTake").textContent = gbp(r.takeHome);
  $("hTakeM").textContent = `${gbp(r.takeHome / 12)} a month · ${gbp(r.takeHome / 52)} a week`;
  $("hRate").textContent = pct(r.taxes / g);
  $("hRateS").textContent = `${gbp(r.taxes)} in tax, NI${r.loan || r.pgl ? ", loans" : ""}${r.hicbc ? " and Child Benefit charge" : ""}`;
  $("hLoss").textContent = gbp(r.totalLoss);
  $("hLossS").textContent = r.lostBenefits
    ? `${pct(r.totalLoss / g)} of gross, including ${gbp(r.lostBenefits)} of lost support`
    : `${pct(r.totalLoss / g)} of gross salary`;
  const m = marginal(inp);
  $("hMarg").textContent = pct(m, 0);
  $("hMargS").textContent = `You keep ${gbp(200 * (1 - m))} of a £200 raise`;

  // Bar
  const segs = [
    { k: "Take-home", v: r.net, c: "var(--accent)" },
    { k: "Pension", v: r.sacrifice, c: "var(--pension)" },
    { k: "Income tax", v: r.tax, c: "var(--tax)" },
    { k: "National Insurance", v: r.ni, c: "var(--ni)" },
    { k: "Student loans", v: r.loan + r.pgl, c: "var(--loan)" },
    { k: "Child Benefit charge", v: r.hicbc, c: "var(--lost)" },
  ].filter(s => s.v > 0.5);
  $("bar").innerHTML = segs.map(s => `<div style="width:${(s.v / g) * 100}%;background:${s.c}" title="${s.k}: ${gbp(s.v)}"></div>`).join("");
  $("barLegend").innerHTML = segs.map(s => `<span><i style="background:${s.c}"></i>${s.k} ${pct(s.v / g, 0)}</span>`).join("");
  $("barCaption").textContent = `${gbp(r.gross)} gross`;

  // Deductions table
  const row = (label, sub, v, color, pill, cls = "") =>
    `<tr class="${cls}"><td><span class="sw" style="background:${color}"></span>${label}${pill || ""}${sub ? `<span class="sub">${sub}</span>` : ""}</td>
     <td class="n">${gbp(v)}</td><td class="n">${gbp(v / 12)}</td><td class="n">${pct(v / g)}</td></tr>`;
  let rows = row("Gross salary", "", r.gross, "var(--ink)", "", "muted");
  if (r.sacrifice) rows += row("Pension (salary sacrifice)", `${inp.pensionPct}% of salary. Saved for you, so not counted as a loss.`, r.sacrifice, "var(--pension)", `<span class="pill ok">yours</span>`);
  rows += row("Income tax", r.maCredit ? `After ${gbp(r.maCredit)} Marriage Allowance credit` : `${r.scot ? "Scottish" : "UK"} rates on ${gbp(r.taxable)} taxable income`, r.tax, "var(--tax)", `<span class="pill tax">tax</span>`);
  rows += row("National Insurance", "Employee Class 1", r.ni, "var(--ni)", `<span class="pill tax">tax</span>`);
  if (r.loanInfo) rows += row(r.loanInfo.name, `9% above ${gbp(r.loanInfo.thr)}`, r.loan, "var(--loan)", `<span class="pill tax">deduction</span>`);
  if (inp.pgl) rows += row("Postgraduate loan", "6% above £21,000", r.pgl, "var(--loan)", `<span class="pill tax">deduction</span>`);
  rows += row("Take-home pay", "What reaches your bank account", r.takeHome, "var(--accent)", "", "total");
  if (r.cb) {
    rows += row("Child Benefit charge", r.hicbc ? `${r.hicbcPct}% of ${gbp(r.cb)} Child Benefit, paid through Self Assessment` : `None: income is under £60,000`, r.hicbc, "var(--lost)", r.hicbc ? `<span class="pill tax">tax</span>` : "");
    rows += row("Net after Child Benefit charge", "", r.net, "var(--accent)", "", "total");
  }
  $("dedBody").innerHTML = rows;

  // Bands
  $("bandCaption").textContent = `Personal Allowance ${gbp(r.allowance)}${r.paLost ? ` (${gbp(r.paLost)} withdrawn)` : ""}`;
  let br = `<tr><td>Personal Allowance</td><td class="n">0%</td><td class="n">${gbp(Math.min(r.pay, r.allowance))}</td><td class="n">£0</td></tr>`;
  for (const b of r.bandRows) {
    const cls = b.inBand > 0 ? "" : "muted";
    br += `<tr class="${cls}"><td>${b.name}</td><td class="n">${Math.round(b.rate * 100)}%</td><td class="n">${gbp(b.inBand)}</td><td class="n">${gbp(b.tax)}</td></tr>`;
  }
  br += `<tr class="total"><td>Total income tax</td><td class="n"></td><td class="n">${gbp(r.taxable)}</td><td class="n">${gbp(r.tax + r.maCredit)}</td></tr>`;
  if (r.maCredit) br += `<tr><td>Marriage Allowance credit</td><td class="n"></td><td class="n"></td><td class="n">${gbp(-r.maCredit)}</td></tr>`;
  $("bandBody").innerHTML = br;

  // Losses
  const topBandRate = r.scot ? (r.ani > 75000 ? 0.45 : 0.42) : 0.40;
  const psa = r.topRate >= (r.scot ? 0.45 : 0.45) ? 0 : r.topRate >= (r.scot ? 0.42 : 0.40) ? 500 : 1000;
  const items = [
    {
      t: "Personal Allowance", hit: r.paLost > 0, v: r.paLost ? r.paLost * topBandRate : 0, counted: "tax",
      d: r.paLost
        ? `${gbp(r.paLost)} of your £12,570 tax-free allowance is withdrawn, costing about ${gbp(r.paLost * topBandRate)} in extra tax. Between £100,000 and £125,140 this makes the marginal income tax rate ${r.scot ? "67.5%" : "60%"}.`
        : `Your full £12,570 is tax-free. It starts shrinking by £1 for every £2 of income over £100,000 and is gone at £125,140.`,
    },
    {
      t: "Child Benefit", hit: r.hicbc > 0, v: r.hicbc, counted: "tax",
      d: !inp.kids ? "Not claimed. The High Income Child Benefit Charge starts at £60,000 and takes it all back by £80,000."
        : r.hicbc ? `${r.hicbcPct}% of your ${gbp(r.cb)} Child Benefit is taken back by the High Income Child Benefit Charge.${r.hicbcPct >= 100 ? " At this income it may be simpler to opt out of payments but keep claiming for NI credits." : ""}`
        : `You keep all ${gbp(r.cb)}. The charge starts at £60,000 and takes 1% for every £200 above it.`,
    },
    {
      t: "Tax-Free Childcare", hit: r.tfcLost > 0, v: r.tfcLost, counted: "loss",
      d: r.ani > TAPER_START
        ? (inp.tfcKids ? `Lost entirely: income over £100,000 removes the government top-up worth up to £2,000 per child (${inp.tfcKids} ${inp.tfcKids === 1 ? "child" : "children"}).` : "You'd lose this at your income, but no children are entered.")
        : "Available. You lose all of it the moment either parent's income goes £1 over £100,000.",
    },
    {
      t: "Funded childcare hours", hit: r.hoursLost > 0, v: r.hoursLost, counted: "loss",
      d: !r.hoursMeansTested ? `${inp.region === "sco" ? "Scotland's 1,140 funded hours are" : "Northern Ireland's funded pre-school place is"} not withdrawn at £100,000, so nothing is lost here.`
        : r.ani > TAPER_START
          ? (inp.hoursKids ? `Lost entirely at over £100,000. Valued at your estimate of ${gbp(inp.hoursVal)} per child.` : "You'd lose working-parent hours at your income, but no children are entered.")
          : "Available. Working-parent funded hours stop once either parent earns over £100,000.",
    },
    {
      t: "Marriage Allowance", hit: r.maLost > 0, v: r.maLost, counted: "loss",
      d: !inp.marriage ? "Not used. A partner can transfer £1,260 of allowance to you if you're a basic-rate taxpayer, saving up to £252."
        : r.maLost ? "Lost: you pay higher-rate tax, so the £252 transfer from your partner no longer applies."
        : `Applied: saves you ${gbp(r.maCredit)} this year.`,
    },
    {
      t: "Personal Savings Allowance", hit: psa < 1000, v: 0, counted: "info",
      d: psa === 1000 ? "£1,000 of savings interest is tax-free."
        : psa === 500 ? "Cut from £1,000 to £500 of tax-free savings interest because you pay higher-rate tax."
        : "Gone: additional-rate taxpayers get no tax-free savings interest.",
    },
  ];
  $("losses").innerHTML = items.map(it => {
    const pill = it.counted === "tax" ? `<span class="pill tax">in tax rate</span>`
      : it.counted === "loss" ? `<span class="pill lost">in net loss</span>`
      : `<span class="pill info">depends on savings</span>`;
    return `<div class="loss-item ${it.hit ? "hit" : ""}"><span class="t">${it.t}${it.hit ? pill : ""}</span><span class="n">${it.hit && it.v ? gbp(it.v) : it.hit ? "" : "–"}</span><span class="d">${it.d}</span></div>`;
  }).join("");

  // Tips: thresholds near you
  const tips = [];
  if (r.ani > TAPER_START && r.ani <= TAPER_START + 30000) {
    const extra = Math.ceil(r.ani - TAPER_START);
    const alt = calc(inp, extra);
    const drop = r.net - alt.net;
    const regained = r.lostBenefits - alt.lostBenefits;
    tips.push(`Putting an extra <strong>${gbp(extra)}</strong> into your pension by salary sacrifice brings your income to £100,000. Your take-home falls by only <strong>${gbp(drop)}</strong>${regained ? `, and you get back <strong>${gbp(regained)}</strong> of childcare support` : ""}${alt.allowance > r.allowance ? `, and your full Personal Allowance` : ""}.`);
  }
  if (r.hicbc > 0 && r.ani < 80000) {
    const extra = Math.ceil(r.ani - 60000);
    const alt = calc(inp, extra);
    tips.push(`Sacrificing <strong>${gbp(extra)}</strong> more into your pension removes the Child Benefit charge. Take-home falls by <strong>${gbp(r.net - alt.net)}</strong> while your pension grows by ${gbp(extra)}.`);
  }
  const nextThresholds = [
    [12570, "you start paying income tax and NI"],
    [50270, `higher-rate tax begins and NI drops to 2%`],
    [60000, "the Child Benefit charge begins"],
    [100000, "your Personal Allowance starts to shrink and childcare support stops"],
    [125140, "the additional rate begins"],
  ];
  const next = nextThresholds.find(([v]) => v > r.ani);
  if (next) tips.push(`Your adjusted net income is <strong>${gbp(r.ani)}</strong>. In <strong>${gbp(next[0] - r.ani)}</strong> more, ${next[1]} (at ${gbp(next[0])}).`);
  tips.push(`Your employer also pays <strong>${gbp(r.employerNi)}</strong> in National Insurance on your salary. Including that, the state receives ${pct((r.taxes + r.employerNi) / (r.gross + r.employerNi || 1))} of your total employment cost.`);
  $("tips").innerHTML = tips.map(t => `<div class="tip">${t}</div>`).join("");
}

let touched = false;
$("form").addEventListener("input", () => {
  if (!touched) { touched = true; $("exampleTag").hidden = true; }
  render();
});
$("form").addEventListener("submit", e => e.preventDefault());
$("presets").addEventListener("click", e => {
  const v = e.target.closest("button")?.dataset.v;
  if (!v) return;
  $("salary").value = v;
  $("form").dispatchEvent(new Event("input"));
});
render();

// When embedded in an iframe (see embed-snippet.html), tell the parent page our height so it can resize.
if (window.parent !== window) {
  const postHeight = () => window.parent.postMessage({ type: "uk-tax-calc:height", height: document.documentElement.scrollHeight }, "*");
  new ResizeObserver(postHeight).observe(document.body);
  postHeight();
}
