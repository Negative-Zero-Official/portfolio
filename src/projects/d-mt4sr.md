---
title: "D-MT4SR"
subtitle: "Dynamic relation weighting for sequential recommendation"
summary: "Replaces MT4SR's single global relation weight with a context-conditioned gate. Beats the published baseline in 10/10 seeds on Amazon Appliances."
status: "Research · paper in preparation"
year: "2026"
shape: "graph"
tags: ["PyTorch", "Recommender Systems", "Transformers"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/D-MT4SR" }
featured: true
order: 2
---
An extension of **MT4SR** (IEEE BigData '22), a multi-relational transformer for sequential recommendation. Alongside a user's history, it uses auxiliary relationships between items, such as "also bought", "also viewed" and "bought together".

MT4SR learns **one global weight per relationship type** for the whole dataset. D-MT4SR replaces that with a **context-conditioned gate** that predicts how much each relationship should matter at every position in a user's sequence. Three more improvements sit on top of that core change. Each can be switched on or off independently, so every piece can be ablated against the original:

- **Time decay**: a learnable per-relationship decay over the gap between interactions. It uses real timestamps when the data has them, and sequence distance otherwise.
- **Dynamic loss weights**: the grid-searched auxiliary loss weights become learned corrections, optimised jointly by backprop.
- **Popularity-aware negatives**: freq^0.75 negative sampling, which gives harder and more informative negatives.

**Results.** Across multi-seed paired runs on Amazon Reviews, D-MT4SR beats the published baseline on NDCG@10 in **10/10 seeds on Appliances (+6.6%)** and **6/6 on Industrial & Scientific (+5.3%)**. The size of the gain tracks how dense the relation graph is. A manuscript is in preparation for IEEE Access.
