// Grid layout definitions that exactly match the moodboard designs
export const moodboardGridLayouts = {
  1: {
    containerClass: "grid-cols-6 grid-rows-1",
    positions: [
      { gridArea: "1 / 1 / 2 / 7" }, // full width
    ],
  },
  2: {
    containerClass: "grid-cols-6 grid-rows-1",
    positions: [
      { gridArea: "1 / 1 / 2 / 4" }, // left half
      { gridArea: "1 / 4 / 2 / 7" }, // right half
    ],
  },
  3: {
    containerClass: "grid-cols-6 grid-rows-2",
    positions: [
      { gridArea: "1 / 1 / 2 / 4" }, // top-left
      { gridArea: "1 / 4 / 2 / 7" }, // top-right
      { gridArea: "2 / 2 / 3 / 6" }, // bottom-center
    ],
  },
  4: {
    containerClass: "grid-cols-6 grid-rows-2",
    positions: [
      { gridArea: "1 / 1 / 2 / 4" }, // top-left
      { gridArea: "1 / 4 / 2 / 7" }, // top-right
      { gridArea: "2 / 1 / 3 / 3" }, // bottom-left
      { gridArea: "2 / 3 / 3 / 7" }, // bottom-right
    ],
  },
  5: {
    containerClass: "grid-cols-6 grid-rows-2",
    positions: [
      { gridArea: "1 / 1 / 2 / 3" }, // top-left
      { gridArea: "1 / 3 / 2 / 5" }, // top-center
      { gridArea: "1 / 5 / 2 / 7" }, // top-right
      { gridArea: "2 / 2 / 3 / 5" }, // bottom-center
      { gridArea: "2 / 5 / 3 / 7" }, // bottom-right
    ],
  },
  6: {
    containerClass: "grid-cols-6 grid-rows-2",
    positions: [
      { gridArea: "1 / 1 / 2 / 3" }, // top-left
      { gridArea: "1 / 3 / 2 / 5" }, // top-center
      { gridArea: "1 / 5 / 2 / 7" }, // top-right
      { gridArea: "2 / 1 / 3 / 3" }, // bottom-left
      { gridArea: "2 / 3 / 3 / 5" }, // bottom-center
      { gridArea: "2 / 5 / 3 / 7" }, // bottom-right
    ],
  },
  7: {
    containerClass: "grid-cols-6 grid-rows-3",
    positions: [
      { gridArea: "1 / 1 / 2 / 4" }, // large top-left
      { gridArea: "1 / 4 / 2 / 7" }, // top-right
      { gridArea: "2 / 1 / 3 / 3" }, // mid-left
      { gridArea: "2 / 3 / 3 / 5" }, // mid-center
      { gridArea: "2 / 5 / 3 / 7" }, // mid-right
      { gridArea: "3 / 1 / 4 / 4" }, // bottom-left
      { gridArea: "3 / 4 / 4 / 7" }, // bottom-right
    ],
  },
  8: {
    containerClass: "grid-cols-6 grid-rows-3",
    positions: [
      { gridArea: "1 / 1 / 2 / 3" }, // top-left
      { gridArea: "1 / 3 / 2 / 5" }, // top-center
      { gridArea: "1 / 5 / 2 / 7" }, // top-right
      { gridArea: "2 / 1 / 3 / 3" }, // mid-left
      { gridArea: "2 / 3 / 3 / 5" }, // mid-center
      { gridArea: "2 / 5 / 3 / 7" }, // mid-right
      { gridArea: "3 / 2 / 4 / 4" }, // bottom-center-left
      { gridArea: "3 / 4 / 4 / 6" }, // bottom-center-right
    ],
  },
  9: {
    containerClass: "grid-cols-6 grid-rows-3",
    positions: [
      { gridArea: "1 / 1 / 2 / 3" }, // top-left
      { gridArea: "1 / 3 / 2 / 5" }, // top-center
      { gridArea: "1 / 5 / 2 / 7" }, // top-right
      { gridArea: "2 / 1 / 3 / 3" }, // mid-left
      { gridArea: "2 / 3 / 3 / 5" }, // mid-center
      { gridArea: "2 / 5 / 3 / 7" }, // mid-right
      { gridArea: "3 / 1 / 4 / 3" }, // bottom-left
      { gridArea: "3 / 3 / 4 / 5" }, // bottom-center
      { gridArea: "3 / 5 / 4 / 7" }, // bottom-right
    ],
  },

  10: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]", // or "grid-rows-3" if using equal rows
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top 33%
      { gridArea: "1 / 2 / 3 / 3" }, // 2 - col 2, top 66%
      { gridArea: "1 / 3 / 2 / 4" }, // 3 - col 3, top 50%
      { gridArea: "1 / 4 / 2 / 6" }, // 4 - col 4-5, top 60%
      { gridArea: "1 / 6 / 3 / 7" }, // 5 - col 6, top 55%
      { gridArea: "2 / 1 / 3 / 2" }, // 6 - col 1, middle
      { gridArea: "3 / 1 / 4 / 3" }, // 7 - col 1-2, bottom
      { gridArea: "2 / 3 / 4 / 4" }, // 8 - col 3, bottom 50%
      { gridArea: "2 / 4 / 4 / 6" }, // 9 - col 4-5, bottom 40%
      { gridArea: "3 / 6 / 4 / 7" }, // 10 - col 6, bottom 45%
    ],
  },

  11: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, row 1
      { gridArea: "1 / 2 / 2 / 3" }, // 2 - col 2, row 1
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, rows 1-2 (55%)
      { gridArea: "1 / 4 / 3 / 6" }, // 4 - col 4-5, rows 1-2 (70%)
      { gridArea: "1 / 6 / 3 / 7" }, // 5 - col 6, rows 1-2 (55%)

      { gridArea: "2 / 1 / 3 / 2" }, // 6 - col 1, row 2
      { gridArea: "2 / 2 / 3 / 3" }, // 7 - col 2, row 2
      { gridArea: "3 / 1 / 4 / 3" }, // 8 - col 1-2, row 3

      { gridArea: "3 / 3 / 4 / 4" }, // 9 - col 3, row 3 (45%)
      { gridArea: "3 / 4 / 4 / 6" }, // 10 - col 4-5, row 3 (30%)
      { gridArea: "3 / 6 / 4 / 7" }, // 11 - col 6, row 3 (45%)
    ],
  },
  12: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top 33%
      { gridArea: "1 / 2 / 3 / 3" }, // 2 - col 2, top 66%
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, top 60%
      { gridArea: "1 / 4 / 2 / 5" }, // 4 - col 4, top 33%
      { gridArea: "1 / 5 / 3 / 6" }, // 5 - col 5, top 66%
      { gridArea: "1 / 6 / 3 / 7" }, // 6 - col 6, top 60%

      { gridArea: "2 / 1 / 3 / 2" }, // 7 - col 1, mid 33%
      { gridArea: "2 / 4 / 3 / 5" }, // 8 - col 4, mid 33%

      { gridArea: "3 / 1 / 4 / 3" }, // 9 - spans col 1-2, bottom 33%
      { gridArea: "3 / 3 / 4 / 4" }, // 10 - col 3, bottom 40%
      { gridArea: "3 / 4 / 4 / 6" }, // 11 - spans col 4-5, bottom 33%
      { gridArea: "3 / 6 / 4 / 7" }, // 12 - col 6, bottom 40%
    ],
  },
  13: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top
      { gridArea: "1 / 2 / 2 / 3" }, // 2 - col 2, top
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, top 60%
      { gridArea: "1 / 4 / 2 / 5" }, // 4 - col 4, top
      { gridArea: "1 / 5 / 3 / 6" }, // 5 - col 5, top 66%
      { gridArea: "1 / 6 / 3 / 7" }, // 6 - col 6, top 60%

      { gridArea: "2 / 1 / 3 / 2" }, // 7 - col 1, middle
      { gridArea: "2 / 2 / 3 / 3" }, // 8 - col 2, middle
      { gridArea: "2 / 4 / 3 / 5" }, // 9 - col 4, middle

      { gridArea: "3 / 1 / 4 / 3" }, // 10 - spans col 1-2, bottom
      { gridArea: "3 / 3 / 4 / 4" }, // 11 - col 3, bottom 40%
      { gridArea: "3 / 4 / 4 / 6" }, // 12 - spans col 4-5, bottom
      { gridArea: "3 / 6 / 4 / 7" }, // 13 - col 6, bottom 40%
    ],
  },
  14: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top
      { gridArea: "1 / 2 / 2 / 3" }, // 2 - col 2, top 30%
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, top 55%
      { gridArea: "1 / 4 / 2 / 5" }, // 4 - col 4, top
      { gridArea: "1 / 5 / 2 / 6" }, // 5 - col 5, top 30%
      { gridArea: "1 / 6 / 3 / 7" }, // 6 - col 6, top 55%

      { gridArea: "2 / 1 / 3 / 2" }, // 7 - col 1, mid
      { gridArea: "2 / 2 / 3 / 3" }, // 8 - col 2, mid 36%
      { gridArea: "2 / 4 / 3 / 5" }, // 9 - col 4, mid
      { gridArea: "2 / 5 / 3 / 6" }, // 10 - col 5, mid 36%

      { gridArea: "3 / 1 / 4 / 3" }, // 11 - spans col 1–2, bottom 33%
      { gridArea: "3 / 3 / 4 / 4" }, // 12 - col 3, bottom 45%
      { gridArea: "3 / 4 / 4 / 6" }, // 13 - spans col 4–5, bottom 33%
      { gridArea: "3 / 6 / 4 / 7" }, // 14 - col 6, bottom 45%
    ],
  },
  15: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top
      { gridArea: "1 / 2 / 2 / 3" }, // 2 - col 2, top
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, top 60%
      { gridArea: "1 / 4 / 2 / 5" }, // 4 - col 4, top
      { gridArea: "1 / 5 / 2 / 6" }, // 5 - col 5, top
      { gridArea: "1 / 6 / 3 / 7" }, // 6 - col 6, top 55%

      { gridArea: "2 / 1 / 3 / 2" }, // 7 - col 1, mid
      { gridArea: "2 / 2 / 3 / 3" }, // 8 - col 2, mid
      { gridArea: "2 / 4 / 3 / 5" }, // 9 - col 4, mid
      { gridArea: "2 / 5 / 3 / 6" }, // 10 - col 5, mid

      { gridArea: "3 / 1 / 4 / 2" }, // 11 - col 1, bottom (60%)
      { gridArea: "3 / 2 / 4 / 3" }, // 12 - col 2, bottom (40%)

      { gridArea: "3 / 3 / 4 / 4" }, // 13 - col 3, bottom 40%
      { gridArea: "3 / 4 / 4 / 6" }, // 14 - spans col 4–5, bottom
      { gridArea: "3 / 6 / 4 / 7" }, // 15 - col 6, bottom 45%
    ],
  },
  16: {
    containerClass: "grid-cols-6 grid-rows-[33%_33%_34%]",
    positions: [
      { gridArea: "1 / 1 / 2 / 2" }, // 1 - col 1, top
      { gridArea: "1 / 2 / 2 / 3" }, // 2 - col 2, top
      { gridArea: "1 / 3 / 3 / 4" }, // 3 - col 3, top 55%
      { gridArea: "1 / 4 / 2 / 5" }, // 4 - col 4, top
      { gridArea: "1 / 5 / 2 / 6" }, // 5 - col 5, top
      { gridArea: "1 / 6 / 3 / 7" }, // 6 - col 6, top 55%

      { gridArea: "2 / 1 / 3 / 2" }, // 7 - col 1, mid
      { gridArea: "2 / 2 / 3 / 3" }, // 8 - col 2, mid
      { gridArea: "2 / 4 / 3 / 5" }, // 9 - col 4, mid
      { gridArea: "2 / 5 / 3 / 6" }, // 10 - col 5, mid

      { gridArea: "3 / 1 / 4 / 2" }, // 11 - col 1, bottom
      { gridArea: "3 / 2 / 4 / 3" }, // 12 - col 2, bottom
      { gridArea: "3 / 3 / 4 / 4" }, // 13 - col 3, bottom 45%
      { gridArea: "3 / 4 / 4 / 5" }, // 14 - col 4, bottom
      { gridArea: "3 / 5 / 4 / 6" }, // 15 - col 5, bottom
      { gridArea: "3 / 6 / 4 / 7" }, // 16 - col 6, bottom 45%
    ],
  },
};
