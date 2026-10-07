// Signals that we're already inside a PageManagerLayout.
//
// The existing /organization/* pages each render their own <DashboardLayout>
// (header + main + footer). PageManagerLayout owns that chrome itself so it
// can add the page-management sidebar — without those pages stacking a second
// header inside it. DashboardLayout reads this and renders children bare when
// it is set, which is what lets the org pages be reused as-is.
import { createContext, useContext } from "react";

export const PageManagerContext = createContext(false);

export function useIsInsidePageManager() {
  return useContext(PageManagerContext);
}