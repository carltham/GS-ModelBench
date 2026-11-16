# Rules

Rules the system enforces so results stay trustworthy and comparable.

## Integrity
1. A stored call is never changed. A run, with its calls, is deleted only when the user
   explicitly confirms. The system never deletes results on its own.
2. Every call keeps its raw answer, so any score can be checked and recomputed later.
3. Results are saved call by call, so a crash loses at most the call in progress.
4. Every run records its study version, dataset fingerprint, settings, model variant and machine
   profile.

## Comparability
5. Changing a case, a label, the instruction or the output schema creates a new dataset or study
   version. Runs on the new version belong to a new campaign. Within a campaign, runs may differ
   only in model and run settings, and a comparison always shows which settings differ.
6. Runs from different dataset versions, study versions or machines are shown together only with
   a visible warning that names the difference. A run re-scored against a later dataset version
   shows which cases were excluded.
7. Latency from runs on different machines is never ranked together without that warning.
8. A run with the disturbance flag set, whether by the profiler or by the user, is labelled as
   such wherever its latency appears.
9. Imported and migrated runs show their origin wherever they appear.

## Measurement
10. The warm-up call is never counted in metrics.
11. Models in a campaign run one at a time, never in parallel on the same machine.
12. Every call has a time limit. A call that hits it is recorded as an `error`, not dropped.
13. Accuracy is always reported against all calls, not only valid ones.
14. Models are scored only against reference labels. Other labellers' labels are used only to
    measure agreement.

## Reporting
15. A report names its source runs, their scoring versions and the date they ran.
16. Metrics are shown with their uncertainty range. The system doesn't rank results whose
    difference is inside the range without saying so.
17. A conclusion is stored with the campaign it is about, and is dated.
