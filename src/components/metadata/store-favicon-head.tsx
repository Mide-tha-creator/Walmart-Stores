"use client";

import { useEffect } from "react";
import {
  AMAZON_TAB_TITLE,
  getStoreFaviconLinks,
  WALMART_TAB_TITLE,
} from "@/lib/metadata/site-metadata";
import type { StoreConfig } from "@/config/stores/types";

const FAVICON_LINK_SELECTOR = 'link[data-store-favicon="true"]';
const COMPETING_ICON_SELECTOR =
  'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]';

function removeCompetingIconLinks() {
  document.head.querySelectorAll(COMPETING_ICON_SELECTOR).forEach((el) => {
    if (!el.getAttribute("data-store-favicon")) {
      el.remove();
    }
  });
}

function upsertLink(rel: string, href: string, type?: string) {
  const selector = `${FAVICON_LINK_SELECTOR}[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    link.setAttribute("data-store-favicon", "true");
    document.head.prepend(link);
  } else {
    document.head.prepend(link);
  }
  link.href = href;
  if (type) {
    link.type = type;
  } else {
    link.removeAttribute("type");
  }
}

interface StoreFaviconHeadProps {
  marketplace: StoreConfig["marketplace"];
}

export function StoreFaviconHead({ marketplace }: StoreFaviconHeadProps) {
  useEffect(() => {
    const { href, type } = getStoreFaviconLinks(marketplace);
    const title =
      marketplace === "amazon" ? AMAZON_TAB_TITLE : WALMART_TAB_TITLE;

    document.title = title;
    removeCompetingIconLinks();
    upsertLink("icon", href, type);
    upsertLink("shortcut icon", href, type);
    upsertLink("apple-touch-icon", href, type);
  }, [marketplace]);

  return null;
}
