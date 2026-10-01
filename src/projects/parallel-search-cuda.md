---
title: "CUDA Parallel Keyspace Search"
subtitle: "Exhaustive search on the GPU, with a learned cost model"
summary: "Each GPU thread builds its own candidate from a global index, and a small neural cost model predicts how long longer searches will take."
status: "Open source"
year: "2026"
shape: "lattice"
tags: ["C / CUDA", "Parallel Computing"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/Parallel-Password-Cracker" }
featured: false
order: 6
---
An exhaustive search over a combinatorial keyspace, mapped onto a GPU so that **each thread builds its own candidate from a global index**. There's no shared work queue and no coordination between threads.

It comes with a small **neural cost model** trained on measured runtimes. The model fits the log-linear growth in runtime as search length increases, and extrapolates how long longer searches would take.
