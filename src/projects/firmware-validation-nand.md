---
title: "Firmware Validation Framework"
subtitle: "Testing a simulated NAND storage device"
summary: "A simulated NAND device plus a Python validation suite for functional, edge-case and stress testing."
status: "Open source"
year: "2025"
shape: "lattice"
tags: ["Python", "Systems", "Testing"]
links:
  - { label: "View on GitHub", url: "https://github.com/Negative-Zero-Official/Firmware-Validation-Framework-for-Simulated-NAND-Storage" }
featured: false
order: 9
---
A simulated **NAND storage device** with page reads and writes, block erases, bad blocks, and the rule that a page can't be overwritten before it's erased. A Python validation framework is built around it.

The suite covers **functional, edge-case and stress/regression** testing using `unittest`, with structured logging and a generated Markdown summary report. It's a firmware validation engineer's grey-box testing workflow, in miniature.
