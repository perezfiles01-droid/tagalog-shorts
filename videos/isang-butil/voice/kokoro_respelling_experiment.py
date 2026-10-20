# Narration: each line = (scene, subtitle text, respelled reading, gold words).
# Respelling rule: syllables split by "-", STRESSED syllable in CAPS,
# "'" = glottal stop (the catch in "hindî", "ma-li-'IT").
LINES = [
 (1, "Dalawang libong taon na ang nakalipas, inukit ng mga ninuno ng Ifugao ang mga bundok na ito gamit lamang ang kanilang mga kamay.",
  "da-LA-wang li-BONG ta-'ON na ang na-ka-LI-pas, i-NU-kit nang ma-NGA ni-NU-no nang i-fu-GA-o ang ma-NGA bun-DOK na i-TO, GA-mit la-MANG ang ka-NI-lang ma-NGA ka-MAY.",
  ["Ifugao", "kamay."]),
 (2, "Dito nagsisimula ang lahat, sa isang maliit na punla na itinanim sa malamig na putik ng palayan.",
  "DI-to nag-si-si-mu-LA ang la-HAT, sa i-SANG ma-li-'IT na pun-LA na i-ti-NA-nim sa ma-LA-mig na pu-TIK nang pa-LA-yan.",
  ["punla", "palayan."]),
 (3, "Sa loob ng apat na buwan, binabantayan ito ng araw, ng ulan, at ng magsasakang hindi kailanman tumitigil.",
  "sa lo-'OB nang A-pat na BU-wan, bi-na-ban-TA-yan i-TO nang A-raw, nang U-lan, at nang mag-sa-SA-kang HIN-di' ka-'i-lan-MAN tu-mi-TI-gil.",
  ["araw,", "ulan,", "magsasakang"]),
 (5, "Mula sa kabundukan, maglalakbay ang butil na ito ng daan-daang kilometro bago ito makarating sa lungsod.",
  "MU-la sa ka-bun-DU-kan, mag-la-lak-BAY ang BU-til na i-TO nang da-'AN da-'ANG ki-lo-MET-ro BA-go i-TO ma-ka-RA-ting sa lung-SOD.",
  ["butil", "lungsod."]),
 (6, "Dadaan ito sa kamay ng mga tsuper, mangangalakal, at tindero, mga taong hindi natin kilala ngunit umaasa rin dito.",
  "da-da-'AN i-TO sa ka-MAY nang ma-NGA TSU-per, ma-nga-nga-LA-kal, at tin-DE-ro, ma-NGA TA-'ong HIN-di' NA-tin ki-LA-la, NGU-nit u-ma-'A-sa rin DI-to.",
  ["umaasa"]),
 (7, "At sa wakas, darating ito sa hapag ng isang pamilyang Pilipino, mainit, simple, at sapat.",
  "at sa WA-kas, da-RA-ting i-TO sa HA-pag nang i-SANG pa-MIL-yang pi-li-PI-no; ma-'I-nit, SIM-ple, at SA-pat.",
  ["Pilipino,", "sapat."]),
 (8, "Kaya sa susunod na may matirang kanin sa iyong plato, alalahanin mo ang mahabang paglalakbay ng isang butil.",
  "KA-ya sa SU-su-nod na MAY ma-TI-rang KA-nin sa i-YONG PLA-to, a-la-la-HA-nin MO ang ma-HA-bang pag-la-lak-BAY nang i-SANG BU-til.",
  ["isang", "butil."]),
]

CONS = {"ng": "ŋ", "ts": "tʃ", "y": "j", "r": "ɾ", "'": "ʔ", "f": "f", "g": "ɡ"}
VOW = {"a": "a", "e": "ɛ", "i": "i", "o": "o", "u": "u"}

def syl_ipa(s):
    out, i, s2 = [], 0, s.lower()
    while i < len(s2):
        two = s2[i:i+2]
        if two in ("ng", "ts"):
            out.append(CONS[two]); i += 2; continue
        c = s2[i]
        out.append(VOW.get(c) or CONS.get(c, c)); i += 1
    return "".join(out)

def word_ipa(w):
    syls = w.split("-")
    res = []
    for s in syls:
        stressed = s.isupper() and any(ch.isalpha() for ch in s)
        ipa = syl_ipa(s)
        if stressed:  # stress mark + lengthened vowel ("Ees-daah" logic)
            for v in "aɛiou":
                if v in ipa:
                    ipa = ipa.replace(v, v + "ː", 1); break
            ipa = "ˈ" + ipa
        res.append(ipa)
    return "".join(res)

def to_phonemes(reading):
    out = []
    for tok in reading.split(" "):
        tail = ""
        while tok and tok[-1] in ",.;?":
            tail = tok[-1] + tail; tok = tok[:-1]
        out.append(word_ipa(tok) + tail)
    return " ".join(out)

if __name__ == "__main__":
    for l in LINES:
        print(to_phonemes(l[2]))
