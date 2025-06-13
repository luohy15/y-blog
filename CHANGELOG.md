# Changelog

All notable changes to this project will be documented in this file.

## [06132025] - 2025-06-13

### Changed
- Updated layout to use fixed header with backdrop blur effect
- Added top padding to main content to accommodate fixed header
- Redesigned post list layout with simplified, minimal styling
- Completely redesigned post page layout with integrated table of contents
- Implemented 3-column layout: TOC on left, content in center
- Simplified table of contents to only display H2 headings (removed H1/H2 nesting)
- Improved TOC scrolling behavior with proper offset calculation for fixed header
- Enhanced slug generation with Unicode character support
- Removed syntax highlighting from code blocks
- Simplified code block styling with lighter background
- Updated H1 headings in markdown to render as empty divs
- Improved responsive design for mobile and desktop TOC display

### Technical
- Removed rehype-highlight dependency for code syntax highlighting
- Updated TOC extraction logic to focus on H2 headings only
- Enhanced scroll-to-section functionality with header offset compensation
- Improved mobile TOC with better positioning and interaction
