---
title: "WAVE-AI"
subtitle: "Wakefield Analysis via Vector Electrodynamics"
summary: "A physics-informed neural network that solves Maxwell's equations for the wakefield behind a relativistic particle bunch, without a mesh."
status: "Open source"
year: "2026"
shape: "wavefield"
tags: ["PyTorch", "Physics-Informed NN", "Computational Physics"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/WAVE-AI" }
featured: false
order: 5
---
A **physics-informed neural network** that solves Maxwell's equations in potential form for the electromagnetic wakefield trailing a relativistic particle bunch.

The d'Alembertian residual is enforced directly through automatic differentiation on **Sobol-sampled collocation points**, so the network learns the field without the domain ever being meshed. It grew out of an earlier PINN study, where inference ran roughly 174× faster than the equivalent CPU solver.
