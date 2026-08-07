# Icon Library

## Overview

Stampelo includes **292 built-in SVG icons** across **19 categories**.

**Current count: 292** (verified 2026-08-07).

## Categories

Business Finance, Medical, Law Economics, Agriculture Construction, Engineering Technology, Transport, Food Drinks, Science Education, Communication, Sport, Tourism Travel, Fauna, Flora, Religion, Architecture, Recreation Entertainment, People, Symbols Decoration, Stars Shapes.

## Storage Model

Built-in icons are stored in `shared/iconData.ts` as inline SVG path data. They are served directly from the server via the `icon.list` tRPC procedure — no database query required.

The `icons` database table exists for future custom icon uploads but is not currently used for the built-in library.

## SVG Sanitization

Custom SVG uploads are sanitized server-side before storage. Maximum upload size: 50 KB. Sanitization removes `<script>` tags, event handlers, and external references.

## Recoloring

Icons are rendered with a `fill` attribute set to the user-selected color via a `<g fill="${el.color}">` wrapper in the stamp renderer.
