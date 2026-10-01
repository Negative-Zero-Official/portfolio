---
title: "Real / Bogus Transient Classifier"
subtitle: "Separating real astronomical events from artefacts in ZTF alerts"
summary: "40+ hand-engineered features from ZTF image triplets feed a gradient-boosted classifier that performs close to ZTF's own CNN."
status: "Open source"
year: "2025"
shape: "galaxy"
tags: ["Python", "FITS / Astro Data", "Feature Engineering", "XGBoost"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/Transient-Detection-using-Machine-Learning" }
featured: false
order: 4
---
The Zwicky Transient Facility sends out a huge stream of alerts every night, and most of them are false positives: cosmic rays, subtraction artefacts, bad pixels. Each alert comes with three cutouts, the **science, template and difference** images.

This pipeline decodes those FITS triplets and extracts **40+ hand-engineered features**:

- background statistics from ring apertures
- centroid and second moments
- PSF-matched-filter SNR and aperture photometry
- dipole symmetry and crowding
- cross-image consistency
- multi-scale Difference-of-Gaussian energy

These feed a GPU-accelerated XGBoost classifier, with grouped train/test splits to avoid leakage.

The result is a lightweight model that performs **nearly as well as ZTF's own production CNN** without using any deep learning.
