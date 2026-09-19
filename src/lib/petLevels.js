// Standard pet level for a given floor. Used by Admin's "Auto Fill" toggle
// (Quick Submit + build verification) to prefill every pet level the moment
// a floor number is known, instead of admins typing it in by hand each time.
export function petLevelForStage(stage) {
  const s = Number(stage);
  if (!s || s < 1) return null;
  if (s >= 2601) return 200;
  if (s >= 2201) return 180;
  if (s >= 1801) return 160;
  if (s >= 1401) return 140;
  if (s >= 1003) return 120;
  if (s >= 621) return 100;
  if (s >= 381) return 80;
  if (s >= 161) return 60;
  return 40;
}
