# CamPanel

Aplicacao desktop Electron + React + Vite + TypeScript para exibir cameras RTSP em um painel moderno. O Chromium nao toca RTSP diretamente; o app inicia um go2rtc embutido, registra cada camera nele e consome o stream convertido por WebRTC, com fallback HLS.

## Requisitos

- Node.js 20 ou superior
- npm
- Uma camera RTSP acessivel pela maquina

Esses requisitos sao apenas para desenvolvimento. O usuario final usa somente o instalador `.exe` gerado.

## Instalar dependencias

```bash
npm install
```

## Rodar em desenvolvimento

Antes do primeiro `npm run dev`, baixe o binario do go2rtc que sera iniciado pelo Electron:

```bash
npm run download:go2rtc
```

Depois rode:

```bash
npm run dev
```

O script inicia o Vite em `127.0.0.1:5173`, compila o processo principal do Electron e abre a janela desktop. O Electron inicia o `resources/go2rtc/go2rtc.exe` automaticamente.

## Gerar artefato unico para Windows

```bash
npm run dist:win
```

Saidas principais:

```text
release/CamPanel 0.1.0.exe
release/CamPanel Setup 0.1.0.exe
```

O primeiro arquivo e o executavel portable. O segundo e o instalador NSIS. Ambos incluem:

- App Electron
- React/Vite compilado
- `go2rtc.exe` embutido em `resources/go2rtc`
- Configuracao local do go2rtc criada em `%APPDATA%/CamPanel/go2rtc.yaml`

O usuario final nao precisa instalar Node.js, Docker, Vite, npm ou go2rtc separadamente.

## go2rtc embutido

Ao abrir a aplicacao, o processo principal do Electron inicia o go2rtc em segundo plano.

Portas locais usadas:

- `1984`: HTTP API e Web UI, escutando em `127.0.0.1`
- `8554`: RTSP proxy, escutando em `127.0.0.1`
- `8555`: WebRTC TCP/UDP

Web UI do go2rtc durante a execucao:

```text
http://127.0.0.1:1984
```

O Windows pode pedir permissao de firewall na primeira execucao porque o go2rtc usa WebRTC.

## go2rtc via Docker opcional

O arquivo `go2rtc.yaml` contem uma camera inicial de exemplo:

```yaml
streams:
  sample_camera: rtsp://USUARIO:SENHA@192.168.0.17:554/stream1
```

Suba o gateway:

```bash
docker compose up -d
```

Esse modo e opcional para debug manual. O build final usa o go2rtc embutido.

No Docker Desktop para Windows, `network_mode: host` pode nao se comportar igual ao Linux. Se necessario, troque o bloco do servico por portas explicitas:

```yaml
ports:
  - "1984:1984"
  - "8554:8554"
  - "8555:8555/tcp"
  - "8555:8555/udp"
```

## Adicionar uma camera RTSP

1. Abra o app.
2. Clique no card com sinal de `+`.
3. Informe nome e URL no formato `rtsp://usuario:senha@ip:porta/caminho`.
4. Salve.

As cameras ficam persistidas em um arquivo JSON na pasta de usuario do sistema. No Windows, o caminho padrao e:

```text
%APPDATA%/CamPanel/cameras.json
```

O player usa o go2rtc embutido e toca pelo endpoint WebRTC `POST /api/webrtc?src=<stream>`, com fallback HLS em `/api/stream.m3u8?src=<stream>`.

## Configuracao por ambiente

Valores aceitos pelo Vite:

```bash
VITE_GO2RTC_BASE_URL=http://127.0.0.1:1984
VITE_EXAMPLE_RTSP_URL=rtsp://USUARIO:SENHA@192.168.0.17:554/stream1
```

A URL RTSP inicial fica centralizada em `src/services/appConfig.ts`, nao em componentes de UI. Isso facilita mover o exemplo para `.env` depois.

## Build

```bash
npm run build
```

Este comando valida TypeScript, gera o build do renderer e compila os arquivos em `electron/`.

## Limitacoes atuais

- Nao ha gravacao, IA, login, cloud, notificacoes ou ONVIF.
- A persistencia usa `cameras.json` na pasta de usuario do sistema.
- HLS e fallback; a baixa latencia depende do WebRTC e da conectividade com o go2rtc.
- Credenciais RTSP cadastradas no formulario ficam no armazenamento local do app.
- O instalador gerado ainda nao esta assinado com certificado de publicador; o Windows pode exibir aviso de SmartScreen.
