"use client";



import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { ArrowLeft, Search } from "lucide-react";

import { AppDrawer } from "@/components/lifeos/AppDrawer";

import { SearchPalette } from "@/components/lifeos/SearchPalette";

import { LearnChromeProvider } from "@/components/learn/LearnChromeContext";

import { LearnLibrarySearch } from "@/components/learn/LearnLibrarySearch";

import { useCaptureOptional } from "@/components/inbox/CaptureContext";

import { haptic } from "@/lib/finance/haptics";

import { getCategoryDef } from "@/lib/learn/categories";

import { slugToCategory } from "@/lib/learn/routes";



function isReaderRoute(pathname: string): boolean {

  return /^\/learn\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);

}



function isLearnHome(pathname: string): boolean {

  return pathname === "/learn";

}



function isCollectionRoute(pathname: string): boolean {

  return pathname.startsWith("/learn/c/") || pathname.startsWith("/learn/bible");

}



function isLearnSubPage(pathname: string): boolean {

  return pathname === "/learn/highlights" || pathname === "/learn/mind";

}



function headerMeta(pathname: string): { title: string; back?: string; kicker?: string } {

  if (pathname === "/learn/highlights") {

    return { title: "Highlights", back: "/learn", kicker: "Learn" };

  }

  if (pathname === "/learn/mind") {

    return { title: "Mind Map", back: "/learn", kicker: "Learn" };

  }

  return { title: "Learn", back: "/learn" };

}



export function LearnShell({ children }: { children: ReactNode }) {

  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [learnSearchOpen, setLearnSearchOpen] = useState(false);

  const capture = useCaptureOptional();

  const meta = useMemo(() => headerMeta(pathname), [pathname]);

  const isHome = isLearnHome(pathname);

  const isCollection = isCollectionRoute(pathname);

  const hideHeader = isHome || isCollection || isLearnSubPage(pathname);



  const openDrawer = useCallback(() => {

    haptic("light");

    setDrawerOpen(true);

  }, []);



  const openSearch = useCallback(() => {

    haptic("light");

    if (pathname.startsWith("/learn")) {

      setLearnSearchOpen(true);

    } else {

      setSearchOpen(true);

    }

  }, [pathname]);



  const chromeValue = useMemo(

    () => ({ openDrawer, openSearch }),

    [openDrawer, openSearch]

  );



  useEffect(() => {

    function onKey(e: KeyboardEvent) {

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {

        e.preventDefault();

        openSearch();

      }

    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);

  }, [openSearch]);



  if (isReaderRoute(pathname)) {

    return <>{children}</>;

  }



  return (

    <LearnChromeProvider value={chromeValue}>

      <div

        className={`lo-app lo-tone-module lo-app--learn ln-learn-shell-wrap${hideHeader ? " ln-learn-shell-wrap--home" : ""}`}

      >

        <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

        <LearnLibrarySearch open={learnSearchOpen} onClose={() => setLearnSearchOpen(false)} />



        {!hideHeader && (

          <header className="ln-learn-header">

            <div className="ln-learn-header-row">

              {meta.back ? (

                <Link

                  href={meta.back}

                  className="ln-learn-icon-btn"

                  aria-label="Back"

                  onClick={() => haptic("light")}

                >

                  <ArrowLeft size={20} strokeWidth={2} />

                </Link>

              ) : null}



              <div className="ln-learn-header-titles">

                {meta.kicker && <span className="ln-learn-header-kicker">{meta.kicker}</span>}

                <h1 className="ln-learn-header-title">{meta.title}</h1>

              </div>



              <div className="ln-learn-header-actions">

                <button

                  type="button"

                  className="ln-learn-icon-btn"

                  aria-label="Search library"

                  onClick={openSearch}

                >

                  <Search size={19} strokeWidth={2} />

                </button>

              </div>

            </div>

          </header>

        )}



        <main className="ln-learn-main">{children}</main>

      </div>

    </LearnChromeProvider>

  );

}

