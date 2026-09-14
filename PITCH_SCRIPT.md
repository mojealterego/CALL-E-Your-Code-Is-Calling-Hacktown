# AegisFleet — PITCH SCRIPT

## Cel

Materiał do krótkiego, dynamicznego demo pokazującego **realny problem telefoniczny**, działanie CALL-E oraz najważniejszą przewagę AegisFleet: telefoniczna rozmowa nie jest automatycznie traktowana jako prawda biznesowa.

Docelowy materiał demonstracyjny powinien mieścić się poniżej 3 minut, zgodnie z wymaganiami konkursu.

## 0:00–0:15 — Problem

**KADR:** Panel incydentu logistycznego. Widoczne: pojazd, trasa, zmiana warunków, dostępne opcje.

**LEKTOR:**

> „Gdy wydarza się incydent logistyczny, system operacyjny często nadal potrzebuje jednej rzeczy: człowieka, który zadzwoni i ustali, co naprawdę się wydarzyło.”

**NAPIS:**

`INCIDENT → PHONE WORK → VERIFIED DECISION`

## 0:15–0:35 — Uruchomienie zadania

**KADR:** AegisFleet przygotowuje zadanie telefoniczne.

**LEKTOR:**

> „AegisFleet zamienia incydent w ograniczone zadanie telefoniczne. Najpierw sprawdza politykę i rezerwuje operację, zanim jakiekolwiek wywołanie opuści system.”

**NAPIS:**

`POLICY → IDEMPOTENCY → CALL-E`

## 0:35–1:15 — Rozmowa CALL-E

**KADR:** Rzeczywiste połączenie telefoniczne. Nie pokazujemy samego kodu jako głównego elementu sceny.

**AGENT:**

> „Dzień dobry. Dzwonię w sprawie dzisiejszego transportu. Czy może Pan potwierdzić, czy objazd jest możliwy i jaki będzie przewidywany czas przyjazdu?”

**ROZMÓWCA:**

> „Tak, objazd jest możliwy. ETA będzie około 16:40.”

**AGENT:**

> „Potwierdzam: objazd jest zaakceptowany, a nowy przewidywany czas przyjazdu to 16:40. Czy potrzebna jest dodatkowa eskalacja?”

**ROZMÓWCA:**

> „Nie.”

## 1:15–1:40 — Strukturyzacja

**KADR:** JSON/terminal.

```json
{
  "route_acceptance": "yes",
  "eta_update_time": "16:40",
  "escalation_needed": "none",
  "evidence_summary": "Driver confirmed the revised ETA.",
  "confidence": "high"
}
```

**LEKTOR:**

> „CALL-E zwraca wynik strukturalny. AegisFleet nie przyjmuje go jednak bezwarunkowo.”

## 1:40–2:05 — Warstwa assurance

**KADR:** Animacja przepływu.

```text
CALL-E RESULT
      ↓
CLAIMS
      ↓
EVIDENCE GRAPH
      ↓
POLICY / ADVERSARIAL GATE
      ↓
AUTHORITATIVE VERIFICATION
      ↓
COMMIT / RECOVER
```

**LEKTOR:**

> „Model może powiedzieć, co uważa za prawdopodobne. Nie może sam zdecydować, co staje się prawdą w systemie.”

**NAPIS:**

> „Evidence ≠ inference ≠ verified fact.”

## 2:05–2:30 — Negatywna ścieżka

**KADR:** Drugi wynik, tym razem niespójny lub niekompletny.

```text
route_acceptance = unknown
confidence = unknown
escalation_needed = urgent
```

**LEKTOR:**

> „Jeżeli wynik jest niejednoznaczny, system nie zgaduje. Zachowuje UNKNOWN i przechodzi do RECOVER albo eskalacji.”

**NAPIS:**

`UNKNOWN ≠ NO`

## 2:30–2:50 — Receipt

**KADR:** Potwierdzenie transakcji, audit digest, stan końcowy.

**LEKTOR:**

> „Każda decyzja pozostawia audytowalny ślad: wynik, dowody, decyzję i receipt.”

## 2:50–2:59 — Finał

**KADR:** Logo AegisFleet + CALL-E.

**LEKTOR:**

> „CALL-E daje agentowi głos. AegisFleet daje temu głosowi odpowiedzialność.”

**NAPIS KOŃCOWY:**

`AegisFleet — Governed AI Phone Operations`

## Zasady produkcji demo

- Materiał konkursowy: poniżej 3 minut.
- Rzeczywiste działanie CALL-E musi być widoczne w materiale demonstracyjnym.
- Nie prezentować katalogu nazw badawczych jako głównego przekazu.
- Najpierw problem, potem rozmowa, następnie assurance i wynik biznesowy.
- Nie przedstawiać dry-run jako realnego połączenia.
- Nie twierdzić, że bounded adapters reprodukują proprietary systems.
