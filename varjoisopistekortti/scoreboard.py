from db import get_leaderboard
from i18n import t

MEDALS = ["🥇", "🥈", "🥉"]


def render_leaderboard(lang: str) -> str:
    rows = get_leaderboard()
    if not rows:
        return f"{t('leaderboard_header', lang)}\n\n{t('leaderboard_empty', lang)}"

    lines = [t("leaderboard_header", lang), ""]
    for i, row in enumerate(rows):
        prefix = MEDALS[i] if i < len(MEDALS) else f"{i + 1}."
        lines.append(f"{prefix} {row['display_name']} — {row['points']} p")
    return "\n".join(lines)
