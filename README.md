# </> George Yazijy

> Engineer by trade. Curious by nature.

Personal portfolio of a mechatronic engineer and Expert Test Automation Engineer. A look at my experience, projects, and the person behind the systems I build and test.

A dark, geometric design with an animated terminal introduction, subtle electrical illustrations, and a Germany location map. Built with HTML, CSS, and vanilla JavaScript for GitHub Pages, with no build step or package dependencies.

## Run locally

```sh
python dev_server.py
```

Open [localhost:4173](http://localhost:4173). The preview disables caching so edits appear on reload.

## GitHub Pages

Push the repository to GitHub, then open **Settings > Pages** and select **Deploy from a branch > main > / (root)**. Relative asset paths support both user and project sites; `.nojekyll` disables Jekyll processing.

## Edit and check

Content lives in `index.html`; styling lives in `styles.css` and `journey.css`. Projects, education, and contact details still include placeholders. The current resume action uses the browser's Save as PDF option.

After changing assets, refresh their versioned URLs and run the checks:

```sh
python tools/version_assets.py
python tools/check_pages.py
node tools/review-checks.cjs
node tools/circuit-layout-checks.cjs
```

## Built with care

- Local assets and system fonts; no analytics or third-party scripts.
- Lazy-loaded portrait, responsive layouts, and reduced-motion support.
- A restrictive HTML Content Security Policy; all published files are public.

## Artwork

The Germany map uses simplified [Natural Earth country outlines](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), which are public domain. The dialysis illustration is inspired by the [Fresenius 6008 CAREsystem](https://freseniusmedicalcare.com/en/healthcare-professionals/hemodialysis/machines/6008-caresystem/).

Electrical artwork is conceptual, not a construction schematic. References: [STMicroelectronics power supply design](https://wiki.st.com/stm32mcu/wiki/Basics_of_power_supply_design_for_MCU) and [SparkFun LED circuit guide](https://learn.sparkfun.com/tutorials/experiment-guide-for-the-johnny-five-inventors-kit/experiment-1-blink-an-led).

## Rights

The portrait and original personal content are reserved for this portfolio; no public reuse license is granted. Third-party material retains its own terms. See [LICENSE.md](LICENSE.md) for scope and exceptions. The source code is not currently offered under an open-source license.
