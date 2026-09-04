import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * Listens to every route change and instantly scrolls
 * the window back to the top.  Place this once inside
 * <BrowserRouter> (e.g. at the top of App) and it covers
 * every page — customer, seller and admin.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Use instant scroll so there is no visible "jump"
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);

  return null; // renders nothing
};

export default ScrollToTop;
