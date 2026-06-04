/** Keeps Bootstrap dropdown menus above scroll/overflow containers (Main Settings tables, etc.). */
export const DROPDOWN_MENU_POPPER_CONFIG = {
  strategy: 'fixed' as const,
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport' as const,
        padding: 8,
        altAxis: true,
      },
    },
    {
      name: 'flip',
      options: {
        fallbackPlacements: [
          'bottom-start',
          'top-start',
          'bottom-end',
          'top-end',
        ],
      },
    },
  ],
}
