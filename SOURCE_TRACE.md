# Sovereign Watch diagram: source trace

Purpose: identify the implementation behind the explanatory diagram and preserve its limits. The diagram describes selected paths in frozen code; it is not a live status dashboard or a verification of regulatory interpretations.

Source revision: `5561bbdd669f4ac8d01742f4cea7069c958b7d77` of [NMAIResearch/ai-news-board](https://github.com/NMAIResearch/ai-news-board/tree/5561bbdd669f4ac8d01742f4cea7069c958b7d77).

| Diagram element | Source locator | Scope |
|---|---|---|
| Feed intake | [sovereign_intake.py, collect_feeds](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_intake.py#L164) | Queues discovered items and retains source health and pagination limits. |
| Capture source | [sovereign_watch.py, capture_source](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L285) | Saves captured text and content hashes. A capture is not semantic verification. |
| Model assessment and machine checks | [analyze_item_with_model](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L449) | Checks output structure, quotation presence and specified consistency conditions. A matching quotation does not establish legal correctness. |
| Capture pending and manual assessment | [sweep_sovereign_gazettes](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L539) | Capture failure remains pending. Text exceeding the evaluation limit is marked manual_review. This is an outstanding state, not a record of completed review. |
| Unassessed | [assessment result handling](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L580) | Failed assessment remains pending. When source capture succeeded, an unassessed alert can still be saved. |
| Save alert and processing state | [run_surveillance_pass](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L672) | Alerts are saved before processing state advances. Newly created model alerts have reviewed set to false. |
| Board and bulletin | [output and completeness handling](https://github.com/NMAIResearch/ai-news-board/blob/5561bbdd669f4ac8d01742f4cea7069c958b7d77/sovereign_watch.py#L705) | Output rebuilding is conditional. Notifications, unchanged-source shortcuts, locks and local-input checks are omitted from this overview. |

The automated route publishes labelled candidates for human inspection. Software-release approval does not establish alert correctness. No comprehension, classification-quality or time-saving baseline was run for this diagram.

OpenAI Codex assisted with this explanatory diagram. OpenAI is also a subject of the wider newsboard. Archify supplies the renderer under the MIT licence; its checks do not assess source truth or legal correctness.
