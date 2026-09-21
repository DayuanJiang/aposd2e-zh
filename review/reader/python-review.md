# Python Teaching Adaptations: Conceptual Fidelity Review

## Native-Language Coverage Fix

On 2026-09-21 the user identified the unconverted `Buffer::allocAux` block in
chapter 18. Both collection and rendering had filtered on `java`; therefore the
previous 44-entry completeness test covered its own restricted inventory, not
every programming-language fence in the book.

The current inventory contains 60 adaptations: 44 Java-labelled, 12 C++, two C
and two Go. `examples/native.json` supplies the 16 previously omitted cases.
Original code is unchanged and remains available through the original-mode
switch. A native Python block and an unlabelled design-document excerpt are not
conversion omissions. Code inside faithful original-image reproductions remains
part of those originals, separate from the code-fence switch.

`allocAux` uses integer logical addresses and keeps all three allocation paths,
rounding and counter updates. Its assumptions exclude uint32 rounding overflow
and require valid region lengths/aligned tops; it is not a memory allocator.
Chapter 20 similarly models pointer positions with integers; the source's omitted
slow path is explicitly unimplemented. The Go naming pair uses Python's UTF-8
codec, preserving the loop and its invalid-byte counting while not claiming
grapheme counting or native performance.

`test_native_examples.py` checks region selection/rounding, old/new allocation
paths, the three packet-error branches and unrelated exception propagation,
valid/invalid/truncated UTF-8, enum aliases, and placeholder behavior.
`test_content.mjs` checks the expanded language inventory and fails on an
unreviewed non-text language instead of silently skipping it. Displayed source
matching remains exact except for the existing traditional generator's
line-ending whitespace removal; executable-token changes and indentation changes
are rejected.

This addition was reviewed by the main agent, not an independent reviewer.
No Go compiler is installed here; UTF-8 probes use known valid/invalid cases and
the Python standard codec, not a claimed native-Go differential execution.
The older review sections below retain their original 44-entry scope.

Final verification: 41 script tests passed (16 Node, 19 reader Python, six
translation Python), 76 pages built, and source-protection checks had no failures.
`browser.mjs --python` passed 72 page states covering every code-bearing chapter
and the introduction across three locales and desktop/mobile. Each Chinese
locale/viewport combination displayed all 60 expected Python adaptations with no
visible unwrapped Java/C/C++/Go fence. The reported chapter-18 block additionally
passed global/local switching and persisted-mode reload checks in four Chinese
locale/viewport combinations. Evidence: `/tmp/aposd-python-coverage` and
`/tmp/aposd-native-code-check`.

## Findings

### PY-01 [P2] Disclose the incomplete deserialization-error coverage

**Location:** `docs/.vuepress/reader/examples/ch10.json:5-7`, `ch10-f1`.
**Original and argument:** `docs/ch10.md:22-52`, especially the `IOException` handler at lines 44-46. This example illustrates the complexity of exception handling, including understanding which operation reaches which handler.

The Python adaptation catches `pickle.UnpicklingError` but not `ValueError`. Executing the actual JSON snippet against an in-memory stream containing `b"\x80\xff."` raises `ValueError: unsupported pickle protocol: 255`; none of its five handlers runs. For comparison, Java's `ObjectInputStream` checks the header's magic/version and rejects an inconsistent complete header with `StreamCorruptedException`, within the original `IOException` branch.[^object-stream] This comparison concerns invalid format/version, not a truncated Java header. It is a concrete difference in error coverage, not merely different exception names.

The note already says that the exception classes are not equivalent and that handler bodies are omitted. That is helpful, but does not explicitly distinguish **omitted handling logic** from **unrepresented failure categories**. In a chapter specifically teaching exception boundaries, a reader could incorrectly infer that the displayed pickle-error branch covers invalid serialized input generally. Python's documentation also warns that unpickling failures are not limited to `UnpicklingError`.[^pickle]

**Action:** Preserve the layered I/O, separate handlers, and deliberately ignored EOF. At minimum, add a concrete statement to both notes that the catch list is illustrative and that an unsupported pickle protocol can escape as `ValueError`. Alternatively, include that specific format-error case in the appropriate handler and still disclaim exhaustive coverage. Do not replace the example with a catch-all, a new serializer, or a production-grade loader.

**Acceptance:** The exact reproduction below must either enter the deliberately chosen format-error handler, or its uncaught outcome must be explicitly documented. Ordinary EOF and wrong-object-type behavior must retain their current teaching roles.

### PY-02 [P3] Do not label a mixed original block as entirely C++

**Locations:** `docs/.vuepress/reader/examples/ch13.json:32` and `:40`, `ch13-f5` and `ch13-f6`.
**Original and argument:** `docs/ch13.md:120-146`; the before/after pair demonstrates increasingly precise field comments.

Both original blocks combine a C-family `uint32_t offset;` declaration with a Java `private TreeMap<Integer, Integer>` field. Both metadata records acknowledge the mixture, but assign the entire original block `originalLanguage: "cpp"`.

The disclosure does not accompany the misleading label: `CodeExample.vue:25` displays `originalLanguage` in Original mode, while its explanatory note is rendered only in Python mode (`CodeExample.vue:33`). Thus a reader looking at the original sees an unqualified C++ label on Java field syntax. This conclusion is from component source inspection, not browser testing.

**Action:** Use an honest display label such as `Mixed C++ / Java` for these two records. The property is already a string, and the fence renderer uses the original token's language separately (`plugin.ts`), so correcting this metadata need not change source Markdown, snippets, or shared-reader code. Keep the mixed originals intact.

**Acceptance:** The original-mode label itself must disclose the mixture without requiring a switch to Python. Do not relabel the genuinely C++ scoped definitions in `ch14-f1` or `ch18-f5` as Java.

### PY-03 [P3] Separate placeholder notation from literal execution behavior

**Primary location:** `docs/.vuepress/reader/examples/ch06.json:6-7`, `ch06-f1`.
**Related copy ambiguity:** `docs/.vuepress/reader/examples/ch05.json:14-15`, `ch05-f2`.
**Original and argument:** `docs/ch06.md:25-41` and `docs/ch05.md:85-93`.

The `ch06-f1` note says ellipses represent omitted implementations, "not no-ops". That is a reasonable statement of editorial intent, but an inaccurate description if read as Python runtime behavior. The literal `backspace` and `delete` definitions perform no work and return `None`. Similarly, the copied `getParameter` and `getIntParameter` bodies return `None` for a missing parameter; they do not enforce the intended exception contract described in the note. These outcomes were executed, not inferred from parsing. Python documents ellipsis-as-placeholder as a convention, not special execution semantics.[^python-bodies]

The implementation omissions are already disclosed, so this is **not** a demand to implement these APIs, nor a finding against every use of `...`. The narrower problem is wording that blurs "this is not the intended implementation" with "this code does not execute as a no-op". Copying the Python block alone also omits its separate explanatory paragraph; clipboard behavior itself was not tested.

**Action:** Keep the signatures, names, and ellipses. Clarify both language notes along the lines of: "Ellipses mark omitted implementations. If executed literally, these stubs do nothing and return None; they must be implemented before use." Retain the HTTP missing-parameter/conversion-error contract as a requirement for that omitted implementation, not an implemented guarantee.

**Acceptance:** A reader must be able to distinguish a documented API contract from the behavior of its literal placeholder body. No application implementation or stylistic rewrite is required.

## Scope And Verdict

Reviewed **44/44 adaptations in 10/10 JSON files**. Findings: **one P2 and two P3**. No P0/P1 issue or reversal of a chapter's central good/bad design contrast was found. The remaining entries can be retained within their stated illustrative scope; this is not certification that the fragments form runnable applications.

The review used the current working tree, not just committed files. All ten corresponding `docs/chNN.md` chapters were read in full, including surrounding arguments, contrasting examples, and translator errata. Exact originals and fence ordinals were also read through `collectBook("docs")` in `content.mjs`. Both `note` and `noteEn`, original-language labels, code structure, and relevant runtime behavior were reviewed.

The inventory's 44 entries are the **Java-labelled fences selected by the existing content pipeline**, including some mixed/C++ originals. This review does not claim that every other fence in the book has a Python alternative. Existing Python, C, C++, Go, and unfenced examples outside these 44 entries were not treated as missing adaptations.

Only this report was written. No adaptation, Markdown chapter, shared-reader implementation, SVG, test file, or configuration was edited. No build, browser test, or screenshot run was performed. No previous conceptual review was used as the basis for these judgments.

## Verification Evidence

In-memory probes executed the actual `python` strings using CPython **3.14.7**, with application fixtures supplied explicitly. No fixture files or retained test scripts were written. Compilation of all 44 strings was a preliminary check, not the conceptual acceptance criterion.

| Probe | Observed result and limits |
| --- | --- |
| `ch04-f2`, `ch05-f1` | Assignment sets the existing dictionary entry to `None`; `getParams` returns the identical dictionary, and caller mutation changes internal state. The criticized shallow wrapper and representation leak remain. |
| `ch04-f3` | Three distinct layers can read a locally constructed trusted pickle. `Unpickler` has neither `write` nor `close`, matching the existing disclosure; fixture cleanup explicitly closed the buffered stream. |
| `ch05-f2`, `ch06-f1`, `ch06-f8` | Literal signature/history stubs return `None` without performing their described operation. This supports PY-03, not a requirement to invent the omitted implementations. |
| `ch06-f5`, `ch06-f6` | Opaque position fixtures confirm `+1`/`-1`, argument ordering, and move-before-delete evaluation. No string-index, Unicode, line-crossing, or file-boundary implementation was assumed. |
| `ch07-f1` | Getter forwarding, insertion argument order, absent-listener guard, and forwarding `self` to the listener all preserve the source behavior after explicitly supplying the omitted initialization. |
| `ch09-f3`, `ch09-f4` | An `OSError` logs request/destination/error and returns `None`. The logger produces the same information fields and message layout as the original with simple fixture values. |
| `ch10-f1` | A valid Tweet followed by EOF retains the Tweet; `None` passes the cast substitute; a wrong object reaches `TypeError`; missing-file, permission, and bad-opcode cases reach the expected displayed branches. Unsupported protocol escapes as `ValueError` (PY-01). |
| `ch10-f1` cleanup/EOF | Every successfully opened in-memory stream was closed, including on failure. A truncated integer pickle reaches ignored `EOFError`, as the existing note already warns. Failures injected before opening acquired no stream resource. |
| `ch13-f9` | All 16 truth combinations of the four guards, plus a two-match case, preserve eligibility and first-match `break`. Fixtures used identity-equal sessions; custom equality, pointer ownership, and real RPC transport were not validated. |
| `ch13-f11` | 6,075 finite scalar-model cases preserve the decrement, unrelated IDs, unprocessed markers, and earliest reassignment position. The model varied four ID slots, processed/total counts, and initial assignment position. This is not validation of a C++ ring buffer or distributed system. |
| `ch13-f5` through `ch13-f8` | Annotation-only fields acquire no values, consistent with their existing notes.[^annotations] |
| `ch14-f2` through `ch14-f4` | Both cursor states remain `True`; the sentinel remains the string `"null"`, not `None`. |
| `ch18-f4`, `ch18-f6`, `ch18-f7` | Whitespace alternatives terminate for both constant `empty` values; the tuple is `(42, False)` for term 42; the concrete message container is a list. No claim was made about arbitrary omitted loop bodies. |

### Minimal PY-01 Reproduction

Run from the repository root. This reads the reviewed JSON and substitutes an in-memory input stream; it writes no files:

```sh
python3 -B - <<'PY'
import io
import json
from pathlib import Path
from unittest.mock import patch

entry = json.loads(Path(
    "docs/.vuepress/reader/examples/ch10.json"
).read_text())[0]
env = {
    "fileName": "in-memory",
    "Tweet": object,
    "tweetsPerFile": 1,
    "tweets": [],
}
with patch.object(io, "FileIO", return_value=io.BytesIO(b"\x80\xff.")):
    exec(compile(entry["python"], entry["id"], "exec"), env)
PY
```

Observed final exception: `ValueError: unsupported pickle protocol: 255`.

## Per-File Coverage

`Keep` means no additional actionable fidelity issue was found, with the existing notes and omitted application context taken into account. It does not mean standalone runtime completeness. Original references are to the exact fence's starting line in the corresponding `docs/chNN.md`.

### ch04.json: 2/2

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch04-f2` | `ch04.md:83`, section 4.5 | Keep. One-assignment wrapper and long original name remain shallow. Dictionary and access-control differences are disclosed. |
| `ch04-f3` | `ch04.md:105`, section 4.7 | Keep. Manual three-layer construction remains the counterexample; the note explicitly prevents treating it as required Python practice and discloses trusted-pickle, format, cleanup, and missing outer-stream APIs. |

### ch05.json: 2/2

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch05-f1` | `ch05.md:77`, section 5.6 | Keep. Returns internal storage by reference, preserving both representation exposure and caller mutation. Returning a copy here would weaken the original contrast. |
| `ch05-f2` | `ch05.md:87`, section 5.6 | Clarify PY-03. Individual access/conversion signatures hide storage; the note preserves required exceptions and the integer-width limitation. Literal stub behavior needs separation from the intended contract. |

### ch06.json: 8/8

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch06-f1` | `ch06.md:27`, section 6.2 | Clarify PY-03. Separate key-specific methods and `Cursor` preserve unwanted UI coupling; only the no-op wording needs adjustment. |
| `ch06-f2` | `ch06.md:35`, section 6.2 | Keep. `deleteSelection` and application-specific `Selection` intentionally retain the specialized interface; omissions are explicit. |
| `ch06-f3` | `ch06.md:47`, section 6.3 | Keep. General insert/delete methods retain `Position` and the start-inclusive/end-exclusive range; no invented Python-index behavior. |
| `ch06-f4` | `ch06.md:55`, section 6.3 | Keep. Signed displacement, a new returned position, and crossing lines remain contractual; character units and boundary mechanics are expressly left to the application. |
| `ch06-f5` | `ch06.md:61`, section 6.3 | Keep. Delete-key call removes the range beginning at the cursor and ending one position later; verified argument flow. |
| `ch06-f6` | `ch06.md:67`, section 6.3 | Keep. Backspace call starts one position earlier and ends at the cursor. Code and English note unambiguously establish backward movement, not negative indexing. |
| `ch06-f7` | `ch06.md:75`, section 6.3 | Keep. General search signature remains; no fabricated not-found result or exception contract was added. |
| `ch06-f8` | `ch06.md:115`, section 6.7 | Keep. All original History/Action methods survive. Protocol-versus-nominal-interface and absent stack/fence implementations are disclosed; generic history, specialized actions, and grouping policy stay separate. |

### ch07.json: 1/1

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch07-f1` | `ch07.md:14`, section 7.1 | Keep. All four methods retain their pass-through behavior; the listener method retains its only additional check. Application types, initialization, access control, character width, and offset limits are disclosed. |

### ch09.json: 2/2

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch09-f3` | `ch09.md:131`, section 9.6 | Keep. Separate logger call and failure return survive; `send_rpc` supplies required return scope, with later work and the `OSError` assumption disclosed. |
| `ch09-f4` | `ch09.md:142`, section 9.6 | Keep. Static wrapper, parameter documentation, and all logged information survive. Logging is deliberately not moved to the caller; formatting/configuration/access differences are disclosed. |

### ch10.json: 1/1

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch10-f1` | `ch10.md:24`, section 10.1 | Clarify or revise PY-01. Layered I/O, many handlers, cast substitute including null, and EOF-as-normal behavior preserve the lesson. Nested cleanup works; error-category coverage needs a concrete boundary. |

### ch13.json: 13/13

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch13-f2` | `ch13.md:48`, section 13.2 | Keep. Uninformative comments, names, orientations, and caret values remain. Parent-container, Swing-layout, and missing scroll-wiring limitations are disclosed; no full GUI was tested or claimed. |
| `ch13-f3` | `ch13.md:69`, section 13.2 | Keep. Tautological wording, unexplained normalization/downcast concepts, `type` parameter, and padding ambiguity remain. Stubs and lost Java modifiers are explicit. |
| `ch13-f4` | `ch13.md:96`, section 13.2 | Keep. Same field and value, with pixels and both sides newly explained; the improvement remains in the comment rather than a code redesign. |
| `ch13-f5` | `ch13.md:122`, section 13.3 | Relabel PY-02. Bad `Current`/line-width wording and unclear units/map roles remain. Numeric width, ordering, and non-initialization differences are already disclosed. |
| `ch13-f6` | `ch13.md:133`, section 13.3 | Relabel PY-02. First-unreturned-object meaning, newline-inclusive length/count mapping, missing-entry rule, and improved name all survive. No zero-filled default dictionary was introduced. |
| `ch13-f7` | `ch13.md:150`, section 13.3 | Keep. Verbose operation-focused heartbeat comment remains intentionally bad; no initialization or synchronization is claimed. |
| `ch13-f8` | `ch13.md:162`, section 13.3 | Keep. Same field, now defined by state meaning since the last timer reset; the comment contrast and synchronization caveat are preserved. |
| `ch13-f9` | `ch13.md:176`, section 13.4 | Keep. Bad low-level comment, all four guards, sentinel, and early break survive. RPC model, session equality, pointer, and storage limits are disclosed. C++ attribution is contextual, not uniquely established by this block's syntax. |
| `ch13-f10` | `ch13.md:197`, section 13.4 | Keep. Replacement comment remains comment-only and expresses higher-level intent. It does not falsely add code that appends a hash; original implementation remains in the preceding example. |
| `ch13-f11` | `ch13.md:210`, section 13.4 | Keep. Why/what comment, nested logic, decrement, and reassignment survive scalar probes. `size_t` supports the C++ label; buffer/pointer/width semantics are expressly not reproduced. |
| `ch13-f12` | `ch13.md:242`, section 13.5 | Keep. Class docstring preserves server-side HTTP abstraction, per-socket instances, single-threading, and one-request-at-a-time limitation; server implementation is explicitly absent. |
| `ch13-f19` | `ch13.md:423`, section 13.6 | Keep. Only the stage-level comment is translated into Python notation. C++ label is an explicitly disclosed contextual attribution, not syntax proof. |
| `ch13-f20` | `ch13.md:429`, section 13.6 | Keep. Per-iteration extraction/increment/response purpose remains comment-only; no message layout or loop implementation is invented. C++ label has the same disclosed contextual status. |

### ch14.json: 6/6

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch14-f1` | `ch14.md:25`, section 14.3 | Keep. Vague `getCount` and its explanatory doc remain. C++ scoped member is honestly labelled; the suggested good name is not substituted into the bad example. |
| `ch14-f2` | `ch14.md:44`, section 14.3 | Keep. `blinkStatus`, weak comment, and true initial state remain the criticized version. |
| `ch14-f3` | `ch14.md:51`, section 14.3 | Keep. `cursorVisible`, unchanged true state, and blinking-purpose comment preserve the intended improvement. |
| `ch14-f4` | `ch14.md:61`, section 14.3 | Keep. Criticized sentinel name and literal `"null"` remain; neither the recommended name nor `None` silently repairs the counterexample. |
| `ch14-f5` | `ch14.md:75`, section 14.3 | Keep. Short `i` and `numLines` preserve the exception for locally obvious names. Omitted body is not an invitation to generalize this to long loops. |
| `ch14-f6` | `ch14.md:85`, section 14.3 | Keep. Over-specific `selection` remains; project `Range` is explicitly distinguished from Python's built-in `range`. |

### ch16.json: 2/2

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch16-f1` | `ch16.md:29`, section 16.2 | Keep. Correctly identifies the short opening strategy comment as useful, not the nearby anti-pattern of placing every implementation detail at the top. |
| `ch16-f2` | `ch16.md:56`, section 16.4 | Keep. Preserves a reference to external command documentation, not a duplicate manual or invented Foo implementation. Both Java labels are disclosed as inherited fence labels for neutral comments. |

### ch18.json: 7/7

| ID | Original | Decision and fidelity assessment |
| --- | --- | --- |
| `ch18-f1` | `ch18.md:17`, section 18.1 | Keep. Cramped parameter descriptions and unindented continuation lines remain. MessageManager behavior is expressly application-specific, not general Python thread advice. |
| `ch18-f2` | `ch18.md:34`, section 18.1 | Keep. Same parameter information gains isolated names and indentation, without repairing or inventing thread/callback behavior. |
| `ch18-f4` | `ch18.md:85`, section 18.1 | Keep. Necessary `pass_` rename is disclosed; compact/spaced alternatives and condition/decrement are retained. Note explicitly says these are alternatives, not successive phases. |
| `ch18-f5` | `ch18.md:103`, section 18.2 | Keep. C++ scoped callback becomes nested classes with the same method and dispatch-thread/error contract. Missing dispatcher registration, scheduling, and body are disclosed. |
| `ch18-f6` | `ch18.md:119`, section 18.2 | Keep. Tuple retains unnamed-element ambiguity; the note explains missing `getKey`/`getValue` methods and added function scope. Do not substitute a named result into this counterexample. |
| `ch18-f7` | `ch18.md:131`, section 18.2 | Keep. Abstract annotation versus concrete list preserves the visibility distinction. Note appropriately limits the analogy instead of transferring Java performance/thread-safety claims or universally condemning interfaces. |
| `ch18-f8` | `ch18.md:143`, section 18.2 | Keep. Hidden constructor side effect remains hidden in the example, with explicit external assumptions about started non-daemon threads, entry invocation, and addresses. Thread lifetime caveat agrees with Python documentation.[^threading] |

## Review Boundaries

- An omitted GUI, HTTP server, undo stack, RPC environment, or Raft implementation is not a defect when the note explicitly identifies it as omitted. The report does not require these applications to be built.
- Deliberately bad comments, shallow/pass-through methods, vague names, mixed original syntax, and formatting counterexamples must not be repaired as ordinary code-quality issues.
- Source `ObjectInputStream` write-capability, `History.redo`/undo, and Java List/interface mistakes are already distinguished by the surrounding translator errata. The adaptations do not need to reintroduce those errors into executable Python.
- No real Tk widgets, network connections, distributed RPC execution, or Raft threads were launched. Python versions other than the observed interpreter were not executed. Build/rendering, syntax highlighting, locale presentation, clipboard mechanics, and SVG integration remain the main task's separate acceptance work.
- Comment-only C++ labels supported only by surrounding context were not promoted into proven source-language provenance. The mixed-block problem in PY-02 is stronger: the block itself visibly contains both language families.

## Reviewed File Fingerprints

SHA-256 of the complete JSON file, not just its original-source lock. These identify the reviewed working-tree contents while other integration work continues.

| File under `docs/.vuepress/reader/examples/` | Entries | SHA-256 |
| --- | ---: | --- |
| `ch04.json` | 2 | `d4127561839c58ca36bb404c7a60f122aa58c958beb49a345d5900647d521501` |
| `ch05.json` | 2 | `c5b927436e15440541bbfb1348c98544dcc50870330b84e418904d6c7f9ae4ca` |
| `ch06.json` | 8 | `5238fbf317ce1b9cd152f98df2251f335816ac7527d97b491863e7b0b145efbd` |
| `ch07.json` | 1 | `836453fc83e674393c8481f6f5c3e0dafa40adca7086ef4deec72ae6aa54eb3a` |
| `ch09.json` | 2 | `7aab4f8b766af8118df9c76a18e56887a83a6649f289805d174bcb8c86bba5c2` |
| `ch10.json` | 1 | `3079dd3480a491a8d544034c8922e77345de8f6a26cd823fe4fb508cea2ec52b` |
| `ch13.json` | 13 | `5e01d928b4b9f3c9700c9dce4f0bf2fe1617dd203cf5d8e089a4d70f7d610fee` |
| `ch14.json` | 6 | `c66c3e81ad820cec0c5abbf1b7fb184dd19a7eefeaf613b4b88cbe6da74efe8e` |
| `ch16.json` | 2 | `c02d485dc03030540ae80fe65807d5741360c8245f1456293f5d324664c2bb7e` |
| `ch18.json` | 7 | `f2b13d41e240920352a37328e36c1f40d58b2bc8a03c0b26c13294b2e2fc1f0c` |

## Primary References

These references verify language/API semantics; the chapter argument and exact originals come from the local Markdown and inventory cited above.

[^pickle]: Python standard library, `pickle`, particularly `UnpicklingError` and `Unpickler`: `https://docs.python.org/3/library/pickle.html`.

[^object-stream]: Java SE 17, `ObjectInputStream(InputStream)` and `readStreamHeader()` document invalid-header errors and the `IOException` boundary: `https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/ObjectInputStream.html`.

[^python-bodies]: Python tutorial, sections 4.6 and 4.8, documents conventional ellipsis placeholders and implicit `None` returns: `https://docs.python.org/3/tutorial/controlflow.html`.

[^annotations]: Python language reference, section 7.2.2, distinguishes an annotation from an assignment of a value: `https://docs.python.org/3/reference/simple_stmts.html#annotated-assignment-statements`.

[^threading]: Python standard library, `threading`, Thread objects and `daemon`: `https://docs.python.org/3/library/threading.html#thread-objects`.

## Resolution Recheck

**Disposition: PY-01, PY-02, and PY-03 are resolved for the current Simplified Chinese and English metadata.** No new finding arose from this bounded recheck. The original findings, coverage decisions, and fingerprints above are retained as historical evidence; this section supersedes their outstanding status, not their description of the initial snapshot.

### Acceptance Results

| Finding | Changed entries | Resolution evidence |
| --- | --- | --- |
| PY-01 [P2] | `ch10-f1`, `ch10.json:6-7` | Resolved through the explicitly permitted documentation-only option. Both notes now say the catch list is incomplete and that an unsupported pickle protocol escapes as `ValueError`. The original report reproduction still raises `ValueError: unsupported pickle protocol: 255`; this is now the documented boundary, not an outstanding requirement to add a handler. Ordinary EOF, null acceptance, wrong-type rejection, layered I/O, and the long-handler counterexample are preserved. |
| PY-02 [P3] | `ch13-f5`, `ch13-f6`, `ch13.json:30-40` | Resolved. Both records now use `originalLanguage: "C++ / Java"`; both language notes retain the mixed-source disclosure and remove the obsolete justification for labelling the whole block `cpp`. Current `CodeExample.vue:18` normalizes known `java`/`cpp` labels but passes this mixed label through unchanged; line 26 uses it in Original mode. Therefore the label itself supplies the disclosure, without switching to Python. The genuinely C++ `ch14-f1` and `ch18-f5` remain `cpp`. This is source-level verification, not a browser-rendering claim. |
| PY-03 [P3] | `ch05-f2`, `ch06-f1`, `ch05.json:14-15`, `ch06.json:6-7` | Resolved. Both language notes now distinguish omitted implementation from literal execution: the stubs do nothing, return `None`, and require implementation before use. The HTTP note additionally identifies missing-parameter/conversion exceptions as the required future contract, not present placeholder behavior. All four literal methods still return `None`; signatures, names, ellipses, and the specialized-versus-general API contrast remain unchanged. |

The corresponding source passages in sections 5.6, 6.2, 10.1, and 13.3 were reread. None of these note/label changes repairs an intentional anti-pattern or changes the chapter argument.

### Regression Evidence

Executed from the repository root on CPython **3.14.7**:

```sh
python3 -B review/reader/test_examples.py -v
```

Result: **4 tests passed**.

- `test_all_examples_parse_and_compile`: all 44 adaptation strings compile.
- `test_literal_placeholder_behavior_is_disclosed`: executes the four affected methods and checks the note markers (`test_examples.py:24-35`).
- `test_format_failure_boundary_is_explicit`: confirms escaping unsupported-protocol `ValueError`, the note markers, ordinary EOF retaining the loaded item, accepted `None`, and rejection of a wrong object type (`test_examples.py:43-50`).
- `test_mixed_originals_are_honestly_labelled`: checks both mixed labels and preserves the two genuine C++ labels (`test_examples.py:52-56`).

The note assertions are substring checks, not substitutes for conceptual review. Both complete Simplified Chinese and English notes were read against the original acceptance criteria. The test's `Tweet = int` is an explicitly supplied fixture for the cast substitute, not an implementation of the book's application type.

Independent in-memory tracing of the unchanged `ch10-f1` string also verified the actual handler reached, rather than relying only on the resulting list:

| Input | Handler reached | Outcome |
| --- | --- | --- |
| `b"\x80\xff."` | None | Escaping `ValueError`, exactly as newly documented. |
| Pickled `123`, with two reads requested | `EOFError` | `[123]` retained; ordinary EOF remains ignored. |
| Pickled `"wrong type"` with the integer fixture | `TypeError` | No item appended. |
| Pickled `None` | None | `[None]` retained. |

All four successfully opened in-memory streams were closed. The original report's exact reproduction was rerun unchanged and exited with the expected uncaught `ValueError`. No new fixture or test file was written during this recheck.

### Change And Preservation Checks

- Restoring only the five affected records' prior `note`/`noteEn` fields and the two prior language labels **in memory** recreated the original complete-file SHA-256 for each of `ch05.json`, `ch06.json`, `ch10.json`, and `ch13.json`. The other six JSON files still match their original fingerprints directly. This independently confirms that **all 44 Python source strings are unchanged**, not just AST-equivalent.
- The current inventory still contains 44 entries, and `validateExamples(..., true)` confirms all 44 original-source locks.
- The pre-append report is preserved byte-for-byte: **24,945 bytes**, SHA-256 `4f17692bc9a59e2a7cf9c5936d98596eb571419a150f9ede85f97f241be9f95f`.

The following fingerprints identify the resolution snapshot and the test file actually run; they supplement, rather than replace, the original fingerprint table.

| File | SHA-256 at recheck |
| --- | --- |
| `docs/.vuepress/reader/examples/ch05.json` | `0b106a80fd8ec6ca1d0e9ccd9be061a388a92729a0affc6a82f2677bea355740` |
| `docs/.vuepress/reader/examples/ch06.json` | `67895e16aec69a8eaaeb74d7c8831f3ad9bd002612b6303c5e6190e29eebf09f` |
| `docs/.vuepress/reader/examples/ch10.json` | `4d934355718e79c980b4c1c70b84ab19c1a1dc692856402aa49e6ca4bf5ae1f4` |
| `docs/.vuepress/reader/examples/ch13.json` | `fdbb58ea6840735dac964a917d325b52cc10d2a5ebd90ec42e2808c5a8e7aebd` |
| `review/reader/test_examples.py` | `7abdce60e860c4963969ff93bdeb50dabe857056d27494f84837a73b9f252e08` |

**Remaining boundary:** Traditional Chinese (TC) note generation and verification remain with the main task, as requested. No TC artifacts were generated here. Browser presentation, clipboard mechanics, builds, and SVG integration were not rerun or certified. Only this resolution section was appended; no other file was edited by this recheck.
