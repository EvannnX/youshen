// Expand clear gaps between column surfaces by exactly 1.8, retaining column diameter.
export const spacingScale = 1.8;
export const originalColumnRows = [9, 1.8, -4.6, -11, -17.4, -23.8, -30.2, -36.6, -43, -49.4, -57];
export const columnDiameter = .8;
const previousColumnX = ((13 - columnDiameter) * spacingScale + columnDiameter) / 2;
export const aisleInset = (previousColumnX - columnDiameter / 2) / 2;
export const horizontalScale = (previousColumnX - aisleInset) / 6.5;
const previousHorizontalScale = previousColumnX / 6.5;
export const columnRows = [originalColumnRows[0]];
for (let i = 1; i < originalColumnRows.length; i++) {
  const originalClearGap = originalColumnRows[i - 1] - originalColumnRows[i] - columnDiameter;
  columnRows.push(columnRows[i - 1] - originalClearGap * spacingScale - columnDiameter);
}
// Exactly one deity per side, centered between each consecutive pair of columns.
export const deityRows = columnRows.slice(0, -1).map((z, i) => (z + columnRows[i + 1]) / 2);
const back = columnRows.at(-1) - 11 * spacingScale;
export const hall = {
  back, center: (13.5 + back) / 2, length: 13.5 - back,
  altar: columnRows.at(-1) - 7 * spacingScale,
  statueX: 9.5 * previousHorizontalScale - aisleInset, columnX: 6.5 * horizontalScale,
  wallX: 12 * previousHorizontalScale - aisleInset, walkLimit: 6.5 * horizontalScale - .9
};
