# Personal portfolio — first version

A static, responsive portfolio with a dark geometric theme. The portfolio name is George Yazijy. George studied Mechatronic Engineering and currently works as a Software Developer in Test. Projects, skills, employer details, previous roles, dates, and qualification details remain placeholders.

## Preview locally

From this folder, run `python dev_server.py`, then open http://127.0.0.1:4173. Keep the terminal running during preview. No build or package installation is required.

## Customize

- Edit `index.html` to replace the name, introduction, projects, experience, education, and page/social metadata.
- Adjust theme colors and layout in `styles.css`.
- Project overview rows expand using native HTML; the site remains readable with JavaScript disabled.
- “Save résumé as PDF” opens the browser print dialog. Choose **Save as PDF**. A print stylesheet omits the decorative artwork and projects.
- To offer an existing CV PDF instead, put a sanitized PDF in `assets/cv.pdf` and add a relative link such as `<a href="./assets/cv.pdf" download>Download CV</a>`. Review both the PDF contents and document metadata before committing it.
- Replace the contact placeholder with your chosen public professional links. For new-tab links, use `target="_blank" rel="noopener noreferrer"`.

## GitHub Pages

Commit these files to a GitHub repository. In repository Settings → Pages, choose **Deploy from a branch**, select **main** and **/ (root)**, then save. This site uses relative asset paths and works at either a user site root or a project path. There is no server runtime, build pipeline, or dependency bundle to deploy. `.nojekyll` prevents Jekyll processing.

## Privacy, security, and performance

No analytics, cookies, forms, third-party assets, remote fonts, or network calls are used. A single sessionStorage flag remembers that the brief boot introduction was shown in this tab; it contains no personal data and does not cache site assets. Local scripts handle the visual animations, startup introduction, printing, and the copyright year. It makes no network requests. CSS animation respects reduced-motion preferences.

The HTML includes a restrictive Content Security Policy and no-referrer policy. GitHub Pages does not let this project configure arbitrary response headers, so protections requiring HTTP headers (such as CSP `frame-ancestors`) are not supplied by this HTML. Do not treat a static site as private storage: all published files and public Git history can be read by others.

Publish only information you intend to share professionally. Exclude home address, date of birth, identification numbers, private contact details, credentials, and confidential employer material. The ignore file helps avoid accidental environment-file commits, but is not a security boundary.

System fonts, CSS geometry, and a tiny local SVG avoid asset downloads and rendering dependencies. No claim of a measured performance score or full security audit is made.

## Map artwork

`assets/journey-map.svg` uses simplified Natural Earth 1:110m country outlines (public domain), sourced from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. It is a locally served SVG; no external map service is loaded. Pins indicate countries, not a home address or city. Syria is the origin and Germany is the current base, as provided by George.


## Navigation

The portfolio uses normal vertical scrolling, with section links in the introduction. All sections remain available for keyboard navigation, browser search, and printing.

## Electrical illustration

The scroll trace is a conceptual DC supply rail with grounded branches. The MCU includes a supply-to-ground bypass capacitor; the LED has a series resistor; the final vertical switch and trace lead directly to the contact heading as a metaphor for contacting George, rather than an electrical ground. Component values and a specific MCU pinout are intentionally unspecified, so this is an educational illustration, not a construction-ready schematic. Ground symbols share the supply return.

References: STMicroelectronics, https://wiki.st.com/stm32mcu/wiki/Basics_of_power_supply_design_for_MCU ; SparkFun, https://learn.sparkfun.com/tutorials/experiment-guide-for-the-johnny-five-inventors-kit/experiment-1-blink-an-led .


The local preview sends `Cache-Control: no-store` so reloads pick up edits. For GitHub Pages, run `python tools/version_assets.py` after changing assets and before publishing to refresh their content-hashed URLs. Production caching remains enabled.

The boot introduction runs once per tab session for about 3.4 seconds, with an Escape shortcut. A temporary Replay boot button reopens it, and completion preserves a valid section link in the URL; replay returns to the intro at the top of the page. FIG. 01 pauses during boot, and a concise screen-reader status announces startup and completion. It is omitted for reduced motion, disabled JavaScript, or unavailable session storage.

The contact portrait is an optimized local WebP with no EXIF/XMP metadata. Its original stays outside the project. CSS applies grayscale and soft edge masks without retouching facial features. The image uses lazy loading, async decoding, and explicit dimensions; the thin cyan (#04D9FF) border runs once per page load when the contact section appears, fades out before finishing, and respects reduced motion. Contact channels remain placeholders until public details are supplied.

## Repository setup

The local repository uses `main`. After creating an empty GitHub repository, add it as `origin` and push `main`. Enable Pages from `main` and `/ (root)`. The Python preview server and checks are development tools; GitHub Pages serves the HTML, CSS, JavaScript, and assets directly. No secrets, tokens, backend, or custom build workflow are needed.

Before committing asset changes, run `python tools/version_assets.py`. Run `node tools/review-checks.cjs`, `node tools/circuit-layout-checks.cjs`, and `python tools/check_pages.py` for validation. Source files use LF line endings to keep version hashes consistent across Windows and GitHub.
