// Pure calculation logic: no DOM access. Depends on js/rates.js.
function calc(inp, extraSacrifice = 0) {
  const gross = inp.salary;
  const sacrifice = Math.min(gross, gross * inp.pensionPct / 100 + extraSacrifice);
  const pay = gross - sacrifice;           // taxable pay and NI earnings
  const ani = pay;                         // adjusted net income (salary only)
  const scot = inp.region === "sco";

  const paLost = Math.min(PA, Math.max(0, Math.floor((ani - TAPER_START) / 2)));
  const allowance = PA - paLost;
  const taxable = Math.max(0, pay - allowance);

  const bands = scot ? SCO : RUK;
  let prev = 0, tax = 0, topRate = 0;
  const bandRows = [];
  for (const b of bands) {
    const inBand = Math.max(0, Math.min(taxable, b.upto) - prev);
    const t = inBand * b.rate;
    bandRows.push({ ...b, inBand, tax: t });
    if (inBand > 0) topRate = b.rate;
    tax += t;
    prev = b.upto;
  }

  // Marriage Allowance: recipient must not pay higher rate (or Scottish higher rate or above)
  const maEligible = topRate <= (scot ? 0.21 : 0.20);
  let maCredit = 0;
  if (inp.marriage && maEligible) maCredit = Math.min(MARRIAGE, tax);
  tax -= maCredit;

  const ni = 0.08 * Math.min(Math.max(0, pay - 12570), 50270 - 12570) + 0.02 * Math.max(0, pay - 50270);
  const employerNi = 0.15 * Math.max(0, pay - 5000);

  const loanInfo = LOANS[inp.loan];
  const loan = loanInfo ? 0.09 * Math.max(0, pay - loanInfo.thr) : 0;
  const pgl = inp.pgl ? 0.06 * Math.max(0, pay - 21000) : 0;

  const cb = inp.kids > 0 ? (CB_FIRST + CB_OTHER * (inp.kids - 1)) * 52 : 0;
  const hicbcPct = ani > 60000 ? Math.min(100, Math.floor((ani - 60000) / 200)) : 0;
  const hicbc = Math.floor(cb * hicbcPct / 100);

  const over100 = ani > TAPER_START;
  const tfcLost = over100 ? inp.tfcKids * TFC_PER_CHILD : 0;
  const hoursMeansTested = inp.region === "eng" || inp.region === "wal";
  const hoursLost = over100 && hoursMeansTested ? inp.hoursKids * inp.hoursVal : 0;
  const maLost = inp.marriage && !maEligible ? MARRIAGE : 0;

  const takeHome = pay - tax - ni - loan - pgl;          // what lands on the payslip
  const net = takeHome - hicbc;                           // after the Child Benefit charge
  const taxes = tax + ni + loan + pgl + hicbc;
  const lostBenefits = tfcLost + hoursLost + maLost;

  return {
    gross, sacrifice, pay, ani, allowance, paLost, taxable, bandRows, topRate,
    tax, maCredit, maEligible, ni, employerNi, loan, loanInfo, pgl,
    cb, hicbcPct, hicbc, tfcLost, hoursLost, hoursMeansTested, maLost,
    takeHome, net, taxes, lostBenefits, totalLoss: taxes + lostBenefits, scot,
  };
}

function marginal(inp) {
  // Continuous marginal rate on the next £200 of salary (cliff-edge benefits shown separately)
  const a = calc(inp), b = calc({ ...inp, salary: inp.salary + 200 });
  const keep = (b.net + b.sacrifice) - (a.net + a.sacrifice);
  return 1 - keep / 200;
}
