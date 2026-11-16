# Functional components

Each component has one responsibility. Components talk to each other only through the concepts in
[domain-model.md](domain-model.md).

## 1. Study catalogue
Keeps the list of studies and their versions.
- Create, version, duplicate and archive studies.
- Hold the task definition, default settings and models of interest.
- Show each study's state: number of cases, campaigns, last run and best result so far.

## 2. Dataset management
Owns cases and labels.
- Add, edit, import and export cases. Each change creates a new dataset version.
- Import cases from records of real use, such as exported chat logs. Imported inputs arrive
  unlabelled and are tagged `real-traffic`.
- Support several labellers per case, and report how often they agree. Keep one reference label
  per case. When labellers disagree, ask the user to confirm the reference label or tag the case
  `ambiguous`.
- **Coverage check.** Count cases per label value, per difficulty and per tag. Warn when a group
  is below the study's minimum, for example fewer than 20 cases per kind. Show the expected
  uncertainty range for the current dataset size.
- Flag duplicate or near-duplicate inputs.
- Tag cases, including deliberately ambiguous ones that are scored as their own group.

## 3. Model provider gateway
The only component that talks to model servers.
- List the models available on a server, with their exact variants.
- Send a request with given settings and return the raw answer, timings and token counts.
- Warm up a model, unload it, and report where it is loaded (graphics card or processor).
- Handle time limits and server errors the same way for every server.
- Support several kinds of model server through one interface. Adding a new kind requires no
  change elsewhere.

## 4. Machine profiler
Records what the run actually ran on.
- Take a machine profile at the start and the end of each run.
- Set the disturbance flag automatically when it detects conditions that distort speed, such as
  heavy load from other work, or a hot graphics card at the start of a run.
- Let the user set or clear the disturbance flag by hand, with a note.

## 5. Run orchestration
Plans and executes runs.
- **Plan:** expand a request ("these models × these settings × this dataset") into runs. Before
  starting, show how many calls that is and estimate how long it will take.
- **Execute:** for each run, warm up the model, then send each case the configured number of
  times. Store every call as soon as it completes.
- **Control:** pause, resume, cancel and retry failed calls. A cancelled or crashed run can be
  resumed from where it stopped.
- **Progress:** report live progress with calls done, calls remaining, running metrics and
  estimated time left.
- **Order:** run models one at a time so they don't compete for the same hardware.
- **Queue:** accept new run requests while one is running, and run them in order.

## 6. Scoring
Turns raw answers into scores.
- Parse each raw answer against the output schema.
- Score each field with the method set by the task type.
- Re-score stored raw answers later, for example after a label is corrected, without calling
  the model again. A re-score is stored as a new scoring version. Cases whose input changed are
  excluded (see [domain-model.md](domain-model.md#scoring-version)).

## 7. Result store
Permanent record of everything.
- Store studies, dataset versions, campaigns, runs, calls, scoring versions, scores, metrics and
  machine profiles.
- Never change a stored call. Corrections are new scoring versions.
- Delete a run only after the user explicitly confirms.
- Import and export runs, so people can share results from their own machines. Record each run's
  origin: local, imported or migrated.
- Keep results readable and complete without the application.

## 8. Analysis and comparison
Turns stored results into answers.
- Compare runs side by side: models within a campaign, or one model across settings or machines.
- Show accuracy against latency, so the trade-off is visible at a glance.
- Break results down per label value, per difficulty, per tag and per case.
- Show a confusion matrix: expected label against given label.
- **Drill down** from any number to the calls behind it, including the raw answers.
- Find the cases most models get wrong, which may point to bad labels or unclear cases.
- Show when a difference between two runs is within the uncertainty range.
- Warn when runs being compared are not like-for-like (see [rules.md](rules.md)).

## 9. Reporting
Produces documents to keep and share.
- Generate summary reports and charts for a campaign or a selection of runs.
- Each report names its source runs and is dated by when they ran.
- Allow a written conclusion to be stored with a campaign.

## 10. Interfaces
Two ways in, with the same capabilities.
- **GUI:** browse studies, edit datasets, plan and watch runs, and explore and compare results.
- **Command line:** the same functions, for scripts and automated use.
