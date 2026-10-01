---
title: "iSLEEPS"
subtitle: "Automated sleep-stage classification"
summary: "An ensemble that stages sleep from overnight EEG in a stroke cohort. It beats the dataset paper's best baseline on every metric and every stage."
status: "Applied research"
year: "2026"
shape: "waveform"
tags: ["Python", "EEG / Biosignals", "Ensemble Methods"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/iSLEEPS-Sleep-Stage-Classification" }
featured: false
order: 3
---
Sleep staging from overnight polysomnography in a stroke cohort, built during my internship at **Onward Assist**.

The final model is an **equal-weight ensemble of gradient boosting, a CNN and a BiLSTM** over 426 engineered per-epoch features. Under five-fold cross-validation grouped by patient, it reaches **77.9% accuracy, 0.721 macro F1 and Cohen's κ = 0.690**. That beats the dataset paper's best published baseline (an LSTM at 74.70 / 67.68 / 0.64) on every overall metric and every individual sleep stage.

It also ships with a **dataset audit**. The public release contained duplicated and mislabelled recordings, plus four downloads that were the correct size but scrambled inside, which a size check doesn't catch. The repo includes a verifier so nobody else trains on them by accident.
