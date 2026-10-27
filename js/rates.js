// Tax-year figures. Update each April along with the NI and threshold figures in calc() (js/calculator.js)
// and the rates summary in the notes section of index.html.
const PA = 12570, TAPER_START = 100000;
const RUK = [
  { name: "Basic rate", rate: 0.20, upto: 37700 },
  { name: "Higher rate", rate: 0.40, upto: 125140 },
  { name: "Additional rate", rate: 0.45, upto: Infinity },
];
const SCO = [
  { name: "Starter rate", rate: 0.19, upto: 3967 },
  { name: "Basic rate", rate: 0.20, upto: 16956 },
  { name: "Intermediate rate", rate: 0.21, upto: 31092 },
  { name: "Higher rate", rate: 0.42, upto: 62430 },
  { name: "Advanced rate", rate: 0.45, upto: 125140 },
  { name: "Top rate", rate: 0.48, upto: Infinity },
];
const LOANS = {
  p1: { name: "Student loan (Plan 1)", thr: 26900 },
  p2: { name: "Student loan (Plan 2)", thr: 29385 },
  p4: { name: "Student loan (Plan 4)", thr: 33795 },
  p5: { name: "Student loan (Plan 5)", thr: 25000 },
};
const CB_FIRST = 27.05, CB_OTHER = 17.90, MARRIAGE = 252, TFC_PER_CHILD = 2000;
