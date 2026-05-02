import extract from 'extract-zip';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'resources', 'go2rtc');
const outputPath = path.join(outputDir, 'go2rtc.exe');
const release = process.env.GO2RTC_VERSION ?? 'latest';
const releaseUrl =
  release === 'latest'
    ? 'https://api.github.com/repos/AlexxIT/go2rtc/releases/latest'
    : `https://api.github.com/repos/AlexxIT/go2rtc/releases/tags/${release}`;

try {
  await fs.access(outputPath);
  console.log(`go2rtc ja existe em ${outputPath}`);
  process.exit(0);
} catch {
  // Download only when the binary is not present.
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'rtsp-camera-dashboard-build'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar ${url}: ${response.status}`);
  }

  return response.json();
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'rtsp-camera-dashboard-build'
    }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
}

const releaseInfo = await fetchJson(releaseUrl);
const asset = releaseInfo.assets.find((item) => item.name === 'go2rtc_win64.zip');

if (!asset) {
  throw new Error(`Asset go2rtc_win64.zip nao encontrado no release ${releaseInfo.tag_name}.`);
}

await fs.mkdir(outputDir, { recursive: true });

const zipPath = path.join(outputDir, asset.name);
await downloadFile(asset.browser_download_url, zipPath);
await extract(zipPath, { dir: outputDir });
await fs.rm(zipPath, { force: true });

try {
  await fs.access(outputPath);
} catch {
  throw new Error(`Download concluido, mas ${outputPath} nao foi encontrado.`);
}

console.log(`go2rtc ${releaseInfo.tag_name} salvo em ${outputPath}`);
