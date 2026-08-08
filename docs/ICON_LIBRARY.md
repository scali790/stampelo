# Icon Library

## Overview

Stampelo includes **292 built-in SVG icons** across **19 categories**.

**Current count: 292** (verified 2026-08-07).

## Categories

Business Finance, Medical, Law Economics, Agriculture Construction, Engineering Technology, Transport, Food Drinks, Science Education, Communication, Sport, Tourism Travel, Fauna, Flora, Religion, Architecture, Recreation Entertainment, People, Symbols Decoration, Stars Shapes.

## Storage Model

Built-in icons are stored in `shared/iconData.ts` as inline SVG path data. They are served directly from the server via the `icon.list` tRPC procedure — no database query required.

The `icons` database table exists for future custom icon uploads but is not currently used for the built-in library or the current editor picker.

## SVG Sanitization

Custom SVG uploads are sanitized client-side in `IconPickerDrawer.tsx` before insertion into the current stamp state. Maximum upload size: 50 KB. The current implementation strips `<script>` tags, inline event handlers, and `javascript:` references, but it does not persist uploads to the `icons` table.

## Recoloring

Inserted icons are rendered as `ImageElement` SVG content with the user-selected color applied via a `<g fill="${el.color}">` wrapper in the stamp renderer. There is no separate persisted `icon` element type today.
