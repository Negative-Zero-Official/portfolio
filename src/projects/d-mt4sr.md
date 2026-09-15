---
title: "D-MT4SR — Dynamic Relation Weighting for Sequential Recommendation"
statusLabel: "Research · Paper in Preparation"
statusClass: "analysis"
tags: ["PyTorch", "Recommender Systems", "Transformers"]
link: "https://github.com/Negative-Zero-Official/D-MT4SR"
linkLabel: "View on GitHub"
featured: true
order: 2
---
An extension of MT4SR (IEEE BigData '22) that replaces the model's single global per-relationship weight with a context-conditioned gate, predicting how much each auxiliary item relationship should matter at every position in a user's sequence rather than once for the whole dataset. Across multi-seed paired runs on Amazon Reviews, it beats the published baseline on NDCG@10 in 10/10 seeds on Appliances (+6.6%) and 6/6 on Industrial & Scientific (+5.3%), with the size of the gain tracking how dense the relation graph is. Manuscript in preparation for IEEE Access.
