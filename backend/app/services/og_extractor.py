"""
OpenGraph metadata extractor — replicates Java OpenGraphTitleExtractor.
Fetches URL with httpx, parses OG tags via BeautifulSoup/lxml.
Recurses into iframes (max depth=2, max 5 iframes per doc) as fallback.
"""

import logging
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

MAX_IFRAME_DEPTH = 2
MAX_IFRAMES_PER_DOC = 5
TIMEOUT = 5.0
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.google.com",
}


async def extract_og_metadata(url: str) -> dict:
    """Returns dict with keys: title, description, image_url (all nullable)."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=TIMEOUT) as client:
        try:
            resp = await client.get(url, headers=HEADERS)
            soup = BeautifulSoup(resp.text, "lxml")
            result = await _extract_from_doc(soup, url, set(), 0, client)
            log.info(f"OG extract success url={url} title={result['title']!r}")
            return result
        except Exception as exc:
            log.warning(f"OG extract failed url={url} message={exc}")
            return {"title": None, "description": None, "image_url": None}


async def _extract_from_doc(
    soup: BeautifulSoup,
    base_url: str,
    visited: set,
    depth: int,
    client: httpx.AsyncClient,
) -> dict:
    og_title = _read_meta(soup, "og:title")
    root_has_og_title = og_title is not None
    description = _read_meta(soup, "og:description")
    image_url = _read_meta_url(soup, "og:image", base_url)
    title = og_title or _read_doc_title(soup) or _read_first_h1(soup)

    if title is None or description is None or image_url is None:
        iframe_meta = await _read_from_iframes(soup, base_url, visited, depth, client)
        # Only override title with iframe title if root had no og:title
        if (not root_has_og_title and iframe_meta["title"]) or title is None:
            title = iframe_meta["title"]
        if description is None:
            description = iframe_meta["description"]
        if image_url is None:
            image_url = iframe_meta["image_url"]

    return {"title": title, "description": description, "image_url": image_url}


async def _read_from_iframes(
    soup: BeautifulSoup,
    base_url: str,
    visited: set,
    depth: int,
    client: httpx.AsyncClient,
) -> dict:
    if depth >= MAX_IFRAME_DEPTH:
        return {"title": None, "description": None, "image_url": None}

    title = description = image_url = None
    scanned = 0

    for iframe in soup.select("body iframe[src]"):
        if scanned >= MAX_IFRAMES_PER_DOC:
            break
        scanned += 1
        src = iframe.get("src", "")
        iframe_url = urljoin(base_url, src)
        if not iframe_url or iframe_url in visited:
            continue
        visited.add(iframe_url)
        try:
            resp = await client.get(iframe_url, headers=HEADERS)
            iframe_soup = BeautifulSoup(resp.text, "lxml")

            if title is None:
                title = (
                    _read_meta(iframe_soup, "og:title")
                    or _read_doc_title(iframe_soup)
                    or _read_first_h1(iframe_soup)
                )
            if description is None:
                description = _read_meta(iframe_soup, "og:description")
            if image_url is None:
                image_url = _read_meta_url(iframe_soup, "og:image", iframe_url)

            if title and description and image_url:
                break

            nested = await _read_from_iframes(iframe_soup, iframe_url, visited, depth + 1, client)
            title = title or nested["title"]
            description = description or nested["description"]
            image_url = image_url or nested["image_url"]

            if title and description and image_url:
                break
        except Exception as exc:
            log.debug(f"iframe extract failed parent={base_url} iframe={iframe_url} msg={exc}")

    return {"title": title, "description": description, "image_url": image_url}


def _read_meta(soup: BeautifulSoup, prop: str) -> str | None:
    tag = soup.find("meta", property=prop)
    if not tag:
        return None
    content = (tag.get("content") or "").strip()
    return content if content else None


def _read_meta_url(soup: BeautifulSoup, prop: str, base_url: str) -> str | None:
    tag = soup.find("meta", property=prop)
    if not tag:
        return None
    content = (tag.get("content") or "").strip()
    if not content:
        return None
    return urljoin(base_url, content)


def _read_doc_title(soup: BeautifulSoup) -> str | None:
    t = soup.title
    if not t:
        return None
    text = t.get_text(strip=True)
    return text if text else None


def _read_first_h1(soup: BeautifulSoup) -> str | None:
    h1 = soup.find("h1")
    if not h1:
        return None
    text = h1.get_text(strip=True)
    return text if text else None
