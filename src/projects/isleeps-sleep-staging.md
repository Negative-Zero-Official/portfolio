---
title: "iSLEEPS — Automated Sleep-Stage Classification"
statusLabel: "Applied Research"
statusClass: "analysis"
tags: ["Python", "EEG / Biosignals", "Ensemble Methods"]
link: "https://github.com/Negative-Zero-Official/iSLEEPS-Sleep-Stage-Classification"
linkLabel: "View on GitHub"
featured: false
order: 3
---
Sleep staging from overnight polysomnography in a stroke cohort, built during my time at Onward Assist. An equal-weight ensemble of gradient boosting, a CNN, and a BiLSTM over 426 engineered per-epoch features reaches 77.9% accuracy, 0.721 macro F1 and Cohen's κ = 0.690 under five-fold cross-validation grouped by patient — ahead of the dataset paper's best published baseline on every overall metric and every individual sleep stage. Ships with a dataset audit that caught duplicated and mislabelled recordings in the public release.
