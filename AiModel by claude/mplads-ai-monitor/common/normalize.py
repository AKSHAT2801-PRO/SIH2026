"""Canonicalisation helpers shared by the cleaning and integration layers.

These functions are pure and deterministic so that every transformation is
reproducible (critical rule 11) and every standardisation is auditable.
"""
from __future__ import annotations

import hashlib
import re
import unicodedata

import pandas as pd

_HONORIFICS = (
    "shri", "shrimati", "smt", "sri", "mr", "mrs", "ms", "dr", "prof", "adv",
    "kum", "km", "sh", "col", "capt", "gen", "justice", "md", "er",
)

_WS = re.compile(r"\s+")
_NON_ALNUM = re.compile(r"[^a-z0-9 ]+")
_TERM_YEARS = re.compile(r"\((?:19|20)\d{2}\s*[-–]\s*\d{2,4}\)")

# The portal writes the same administrative unit several ways.
_STATE_ALIASES = {
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
    "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "nct of delhi": "Delhi",
    "delhi nct": "Delhi",
    "jammu and kashmir": "Jammu and Kashmir",
    "jammu & kashmir": "Jammu and Kashmir",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "uttaranchal": "Uttarakhand",
    "chattisgarh": "Chhattisgarh",
}


def squash(text: object) -> str:
    """Unicode-normalise, strip and collapse whitespace. Never returns None."""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return ""
    s = unicodedata.normalize("NFKC", str(text))
    return _WS.sub(" ", s).strip()


def title_case(text: object) -> str:
    s = squash(text)
    if not s:
        return ""
    return " ".join(w.capitalize() if w.isupper() or w.islower() else w for w in s.split())


def normalize_state(text: object) -> str:
    s = squash(text)
    if not s:
        return ""
    key = s.lower().replace(".", "")
    key = _WS.sub(" ", key)
    if key in _STATE_ALIASES:
        return _STATE_ALIASES[key]
    return " ".join(part.capitalize() if part not in {"and", "of"} else part for part in key.split())


def normalize_person(text: object) -> str:
    """Canonical form of an MP name: honorifics, term years and case removed."""
    s = squash(text).lower()
    if not s:
        return ""
    s = _TERM_YEARS.sub(" ", s)
    s = s.replace(".", " ").replace(",", " ")
    s = _NON_ALNUM.sub(" ", s)
    tokens = [t for t in s.split() if t and t not in _HONORIFICS]
    return " ".join(tokens)


def normalize_org(text: object) -> str:
    """Canonical form of a vendor / implementing-agency name."""
    s = squash(text).lower()
    if not s:
        return ""
    s = _NON_ALNUM.sub(" ", s)
    tokens = [t for t in s.split() if t not in {"pvt", "private", "ltd", "limited", "llp", "co", "company", "the"}]
    return " ".join(tokens) or squash(text).lower()


def normalize_description(text: object) -> str:
    s = squash(text).lower()
    if not s:
        return ""
    s = _NON_ALNUM.sub(" ", s)
    return _WS.sub(" ", s).strip()


def ida_district(text: object) -> str:
    """The portal encodes IDA as 'DISTRICT(AGENCY NAME_IDA)'. Extract the district."""
    s = squash(text)
    if not s:
        return ""
    head = s.split("(", 1)[0]
    return title_case(head.strip()) or ""


def surrogate_key(*parts: object) -> str:
    """Stable, reproducible surrogate key (16 hex chars) for a tuple of values."""
    payload = "||".join(squash(p).lower() for p in parts)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:16]


def file_hash(path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()
