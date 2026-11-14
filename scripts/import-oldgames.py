"""Refresh the arcade catalog from OldGames' public pages and player API.

SNES: most-played section plus selected games. PS1: selected game pages.
Only metadata and remote player URLs are saved; no ROMs are downloaded.
Run manually with Python 3: python scripts/import-oldgames.py
"""

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
from pathlib import Path
import time
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

BASE = "https://oldgames.app"
DEST = Path(__file__).resolve().parents[1] / "public/arcade/games.json"
PS1_SELECTION = Path(__file__).with_name("oldgames-ps1.json")
SNES_SELECTION = Path(__file__).with_name("oldgames-snes.json")


def fetch(path, as_json=True):
    request = Request(urljoin(BASE, path), headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json,text/html"})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=35) as response:
                body = response.read().decode("utf-8")
            return json.loads(body) if as_json else body
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)


class MostPlayed(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.current = None
        self.games = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section" and attrs.get("aria-labelledby") == "most-played-heading":
            self.inside = True
        if not self.inside:
            return
        if tag == "a" and attrs.get("href", "").startswith("/games/snes/"):
            path = attrs["href"]
            self.current = {"id": int(path.rsplit("-", 1)[1]), "title": attrs.get("title", ""), "console": "snes", "source_url": urljoin(BASE, path), "thumbnail": None}
        if tag == "img" and self.current is not None:
            self.current["thumbnail"] = urljoin(BASE, attrs["src"])

    def handle_endtag(self, tag):
        if tag == "a" and self.current is not None:
            self.games.append(self.current)
            self.current = None
        if tag == "section":
            self.inside = False


def player(game):
    data = fetch(f"/api/games/play/{game['id']}")
    console = data.get("consoleSlug")
    rom = data.get("romUrl")
    if console != game["console"] or not rom or urlparse(rom).scheme != "https":
        raise ValueError(f"Invalid public player for {game['id']}: {data}")
    core = data.get("emulatorJsCore") or {"snes": "snes", "ps1": "psx"}[console]
    query = urlencode({"id": base64.b64encode(rom.encode()).decode(), "console": console, "emulatorJsCore": core, "v": "1.0.0"})
    return {
        "id": f"oldgames-{game['id']}",
        "system": "psx" if console == "ps1" else "snes",
        "title": data.get("title") or game["title"],
        "cover": game.get("thumbnail") or None,
        "source_url": game.get("source_url") or f"{BASE}/games/{console}/{game['slug']}-{game['id']}",
        "player_url": f"{BASE}/emulator?{query}",
    }


class GameMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cover = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("property") == "og:image":
            self.cover = urljoin(BASE, attrs.get("content", ""))


def main():
    parser = MostPlayed()
    parser.feed(fetch("/games/snes", as_json=False))
    games = list(parser.games)
    if not games:
        raise ValueError("SNES most-played section is missing; catalog was not changed")
    print(f"SNES most played: {len(games)}", flush=True)
    seen = {g["id"] for g in games}
    for console, selection in (("snes", SNES_SELECTION), ("ps1", PS1_SELECTION)):
        added = 0
        for source in json.loads(selection.read_text(encoding="utf-8")):
            url = urlparse(source)
            if url.scheme != "https" or url.netloc != "oldgames.app" or not url.path.startswith(f"/games/{console}/"):
                raise ValueError(f"Expected an OldGames {console} detail page: {source}")
            game_id = int(url.path.rsplit("-", 1)[1])
            if game_id in seen:
                continue
            detail = GameMetadata()
            detail.feed(fetch(source, as_json=False))
            games.append({"id": game_id, "title": "", "console": console, "source_url": source, "thumbnail": detail.cover})
            seen.add(game_id)
            added += 1
        print(f"Selected {console.upper()} games added: {added}", flush=True)

    resolved = {}
    failures = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        tasks = {pool.submit(player, game): game for game in games}
        for task in as_completed(tasks):
            game = tasks[task]
            try:
                resolved[game["id"]] = task.result()
            except Exception as error:
                failures.append(f"{game['id']} {game['title']}: {error}")
            if (len(resolved) + len(failures)) % 50 == 0:
                print(f"Players checked: {len(resolved) + len(failures)}/{len(games)}", flush=True)
    if failures:
        raise RuntimeError("Catalog was not changed. Player failures:\n" + "\n".join(failures))
    catalog = [resolved[g["id"]] for g in games]
    DEST.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(catalog)} verified player URLs to {DEST}", flush=True)


if __name__ == "__main__":
    main()
