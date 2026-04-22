#!/usr/bin/env node
/**
 * Generate all AirBridge app icons from the master SVG.
 *
 * Inputs:
 *   public/favicon.svg — canonical 1024×1024 logomark (indigo rounded square
 *                        with centered white Lucide Plane glyph).
 *
 * Outputs:
 *   iOS AppIcon.appiconset — 12 required PNG sizes + rewritten Contents.json
 *   public/favicon-32.png   — 32×32 PNG favicon fallback for older browsers
 *   public/favicon-192.png  — 192×192 PWA-grade icon
 *   public/apple-touch-icon.png — 180×180 iOS Safari "Add to Home Screen"
 *   public/site.webmanifest — PWA manifest referencing the icons above
 *
 * Also removes the legacy ios/App/App/Assets.xcassets/AppIcon.appiconset/
 * AppIcon-512@2x.png if present.
 *
 * Run: npm run icons
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), '..');
const SVG_PATH = join(ROOT, 'public/favicon.svg');
const IOS_ICON_DIR = join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
const PUBLIC_DIR = join(ROOT, 'public');

if (!existsSync(IOS_ICON_DIR)) mkdirSync(IOS_ICON_DIR, { recursive: true });

const svg = readFileSync(SVG_PATH);

// iOS AppIcon sizes — Apple HIG required set. iPhone + iPad + marketing.
const IOS_ICONS = [
    { name: 'Icon-20@2x.png',   px: 40,   idiom: 'iphone',         scale: '2x', size: '20x20' },
    { name: 'Icon-20@3x.png',   px: 60,   idiom: 'iphone',         scale: '3x', size: '20x20' },
    { name: 'Icon-29@2x.png',   px: 58,   idiom: 'iphone',         scale: '2x', size: '29x29' },
    { name: 'Icon-29@3x.png',   px: 87,   idiom: 'iphone',         scale: '3x', size: '29x29' },
    { name: 'Icon-40@2x.png',   px: 80,   idiom: 'iphone',         scale: '2x', size: '40x40' },
    { name: 'Icon-40@3x.png',   px: 120,  idiom: 'iphone',         scale: '3x', size: '40x40' },
    { name: 'Icon-60@2x.png',   px: 120,  idiom: 'iphone',         scale: '2x', size: '60x60' },
    { name: 'Icon-60@3x.png',   px: 180,  idiom: 'iphone',         scale: '3x', size: '60x60' },
    { name: 'Icon-76.png',      px: 76,   idiom: 'ipad',           scale: '1x', size: '76x76' },
    { name: 'Icon-76@2x.png',   px: 152,  idiom: 'ipad',           scale: '2x', size: '76x76' },
    { name: 'Icon-83.5@2x.png', px: 167,  idiom: 'ipad',           scale: '2x', size: '83.5x83.5' },
    { name: 'Icon-1024.png',    px: 1024, idiom: 'ios-marketing',  scale: '1x', size: '1024x1024' },
];

const WEB_ICONS = [
    { name: 'favicon-32.png',       px: 32 },
    { name: 'favicon-192.png',      px: 192 },
    { name: 'apple-touch-icon.png', px: 180 },
];

// Apple rejects iOS app icons (especially Icon-1024.png for App Store)
// that contain an alpha channel — submission rule 90717. The master
// favicon.svg has a transparent corner outside the 18% rounded-rect
// mask, so rasterization preserves alpha by default. Flatten against
// the indigo brand background so the PNG is fully opaque; iOS applies
// its own corner mask at runtime, so the flattened background is
// invisible on the home screen. Web favicons keep alpha — they're not
// subject to this rule and transparency reads better in browser tabs.
const IOS_BACKGROUND = '#4F3FD3';

const generated = [];

await Promise.all([
    ...IOS_ICONS.map(async ({ name, px }) => {
        await sharp(svg)
            .resize(px, px)
            .flatten({ background: IOS_BACKGROUND })
            .png()
            .toFile(join(IOS_ICON_DIR, name));
        generated.push(`ios/…/${name} (${px}×${px}, flattened)`);
    }),
    ...WEB_ICONS.map(async ({ name, px }) => {
        await sharp(svg).resize(px, px).png().toFile(join(PUBLIC_DIR, name));
        generated.push(`public/${name} (${px}×${px})`);
    }),
]);

// Rewrite Contents.json with all 12 entries, canonical Xcode shape.
const contents = {
    images: IOS_ICONS.map(({ name, idiom, scale, size }) => ({
        filename: name,
        idiom,
        scale,
        size,
    })),
    info: { author: 'xcode', version: 1 },
};
writeFileSync(
    join(IOS_ICON_DIR, 'Contents.json'),
    JSON.stringify(contents, null, 2) + '\n'
);
generated.push('ios/…/Contents.json');

// Write PWA manifest.
const manifest = {
    name: 'AirBridge',
    short_name: 'AirBridge',
    description: 'Never miss a flight again.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#4F3FD3',
    background_color: '#FCFAF6',
    icons: [
        { src: '/favicon-32.png',       sizes: '32x32',   type: 'image/png' },
        { src: '/favicon-192.png',      sizes: '192x192', type: 'image/png' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
};
writeFileSync(
    join(PUBLIC_DIR, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2) + '\n'
);
generated.push('public/site.webmanifest');

// Remove legacy single-icon asset that used to live alone in the appiconset.
const legacy = join(IOS_ICON_DIR, 'AppIcon-512@2x.png');
if (existsSync(legacy)) {
    rmSync(legacy);
    generated.push('(removed) ios/…/AppIcon-512@2x.png');
}

console.log('Generated:');
for (const g of generated) console.log(`  ${g}`);
console.log(`\n${generated.length} assets written.`);
